import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const sendFriendRequestSchema = z.object({
  friendId: z.string().uuid()
});

const respondToRequestSchema = z.object({
  friendshipId: z.string().uuid(),
  action: z.enum(['accept', 'decline'])
});

const searchUsersSchema = z.object({
  query: z.string().min(1).max(100)
});

// Get friends list
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'accepted' },
          { friendId: userId, status: 'accepted' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
            totalXp: true,
            avatarUrl: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            level: true,
            totalXp: true,
            avatarUrl: true
          }
        }
      }
    });

    const friends = friendships.map(friendship => {
      const friend = friendship.userId === userId ? friendship.friend : friendship.user;
      return {
        id: friendship.id,
        friend,
        createdAt: friendship.createdAt
      };
    });

    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get friend requests (incoming)
router.get('/requests', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
            totalXp: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ requests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Search users
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { query } = searchUsersSchema.parse(req.query);

    // Sanitize search query to prevent SQL injection
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&');

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } }, // Exclude current user
          {
            OR: [
              { username: { contains: sanitizedQuery, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        level: true,
        totalXp: true,
        avatarUrl: true
      },
      take: 10
    });

    // Check existing friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, friendId: { in: users.map(u => u.id) } },
          { friendId: userId, userId: { in: users.map(u => u.id) } }
        ]
      },
      select: {
        userId: true,
        friendId: true,
        status: true
      }
    });

    const usersWithStatus = users.map(user => {
      const friendship = friendships.find(f => 
        (f.userId === userId && f.friendId === user.id) ||
        (f.friendId === userId && f.userId === user.id)
      );

      return {
        ...user,
        friendshipStatus: friendship?.status || null
      };
    });

    res.json({ users: usersWithStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid search query', details: error.errors });
    }
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send friend request
router.post('/request', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { friendId } = sendFriendRequestSchema.parse(req.body);

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friend exists
    const friend = await prisma.user.findUnique({
      where: { id: friendId }
    });

    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Friendship already exists or pending' });
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'pending'
      }
    });

    res.status(201).json({ friendship });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Respond to friend request
router.post('/respond', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { friendshipId, action } = respondToRequestSchema.parse(req.body);

    // Check if friendship exists and user is the recipient
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        friendId: userId,
        status: 'pending'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (action === 'accept') {
      // Accept friendship
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' }
      });
    } else {
      // Decline friendship (delete)
      await prisma.friendship.delete({
        where: { id: friendshipId }
      });
    }

    res.json({ message: `Friend request ${action}ed successfully` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Respond to friend request error:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// Unfriend
router.delete('/:friendshipId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const friendshipId = req.params.friendshipId;

    // Check if friendship exists and user is part of it
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        OR: [
          { userId },
          { friendId: userId }
        ],
        status: 'accepted'
      }
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Delete friendship
    await prisma.friendship.delete({
      where: { id: friendshipId }
    });

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({ error: 'Failed to unfriend' });
  }
});

export default router;
