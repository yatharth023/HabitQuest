import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const joinChallengeSchema = z.object({
  challengeId: z.string().uuid()
});

// Get all available challenges
router.get('/available', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get all challenges
    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Get user's joined challenges
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId },
      select: { challengeId: true, status: true }
    });

    const joinedChallengeIds = new Set(
      userChallenges.map((uc: any) => uc.challengeId)
    );

    const challengesWithStatus = challenges.map((challenge: any) => ({
      ...challenge,
      joined: joinedChallengeIds.has(challenge.id),
      userStatus: userChallenges.find((uc: any) => uc.challengeId === challenge.id)?.status
    }));

    res.json({ challenges: challengesWithStatus });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Get user's active challenges
router.get('/active', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const activeChallenges = await prisma.userChallenge.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        challenge: true
      },
      orderBy: { startedAt: 'desc' }
    });

    // Calculate days remaining for each challenge
    const challengesWithProgress = activeChallenges.map((userChallenge: any) => {
      const { challenge } = userChallenge;
      const daysElapsed = Math.floor(
        (Date.now() - userChallenge.startedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.max(0, challenge.durationDays - daysElapsed);
      
      return {
        ...userChallenge,
        daysRemaining,
        progressPercentage: Math.min(100, (userChallenge.currentProgress / challenge.targetValue) * 100)
      };
    });

    res.json({ challenges: challengesWithProgress });
  } catch (error) {
    console.error('Get active challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch active challenges' });
  }
});

// Get user's completed challenges
router.get('/completed', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const completedChallenges = await prisma.userChallenge.findMany({
      where: {
        userId,
        status: 'completed'
      },
      include: {
        challenge: true
      },
      orderBy: { completedAt: 'desc' }
    });

    res.json({ challenges: completedChallenges });
  } catch (error) {
    console.error('Get completed challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch completed challenges' });
  }
});

// Join a challenge
router.post('/join', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { challengeId } = joinChallengeSchema.parse(req.body);

    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if already joined
    const existingUserChallenge = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId
        }
      }
    });

    if (existingUserChallenge) {
      return res.status(400).json({ error: 'Already joined this challenge' });
    }

    // Join challenge
    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId,
        challengeId,
        status: 'active',
        currentProgress: 0
      },
      include: {
        challenge: true
      }
    });

    res.status(201).json({ userChallenge });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Join challenge error:', error);
    res.status(500).json({ error: 'Failed to join challenge' });
  }
});

// Abandon a challenge
router.delete('/:challengeId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const challengeId = req.params.challengeId;

    // Check if user has joined this challenge
    const userChallenge = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId
        }
      }
    });

    if (!userChallenge) {
      return res.status(404).json({ error: 'Challenge not found or not joined' });
    }

    if (userChallenge.status === 'completed') {
      return res.status(400).json({ error: 'Cannot abandon completed challenge' });
    }

    // Delete user challenge
    await prisma.userChallenge.delete({
      where: { id: userChallenge.id }
    });

    res.json({ message: 'Challenge abandoned successfully' });
  } catch (error) {
    console.error('Abandon challenge error:', error);
    res.status(500).json({ error: 'Failed to abandon challenge' });
  }
});

export default router;
