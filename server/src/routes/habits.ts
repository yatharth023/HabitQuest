import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string(),
  goalType: z.string().default('check'),
  goalValue: z.number().int().min(1).max(10000).optional(),
  goalUnit: z.string().max(50).optional()
});

const completeHabitSchema = z.object({
  habitId: z.string().uuid()
});

// Get all habits for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        completions: {
          where: {
            completedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate streaks for each habit
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        const streak = await calculateHabitStreak(habit.id);
        return {
          ...habit,
          streak,
          completedToday: habit.completions.length > 0
        };
      })
    );

    res.json({ habits: habitsWithStreaks });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// Create new habit
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, icon, goalType, goalValue, goalUnit } = createHabitSchema.parse(req.body);

    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        icon,
        goalType,
        goalValue,
        goalUnit
      }
    });

    res.status(201).json({ habit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Complete habit
router.post('/complete', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { habitId } = completeHabitSchema.parse(req.body);

    // Check if habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId }
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check if already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCompletion = await prisma.habitCompletion.findFirst({
      where: {
        habitId,
        completedAt: {
          gte: today
        }
      }
    });

    if (existingCompletion) {
      return res.status(400).json({ error: 'Habit already completed today' });
    }

    // Create completion
    const completion = await prisma.habitCompletion.create({
      data: {
        habitId,
        userId,
        completedAt: new Date(),
        xpEarned: 10
      }
    });

    // Update user XP and level
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: {
          increment: 10
        }
      }
    });

    // Calculate new level
    const newLevel = Math.floor(updatedUser.totalXp / 100) + 1;
    
    if (newLevel > updatedUser.level) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel }
      });
    }

    // Update challenge progress
    await updateChallengeProgress(userId, habitId);

    res.json({ 
      completion,
      xpEarned: 10,
      newLevel,
      totalXp: updatedUser.totalXp
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Complete habit error:', error);
    res.status(500).json({ error: 'Failed to complete habit' });
  }
});

// Delete habit
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const habitId = req.params.id;

    // Check if habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId }
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    await prisma.habit.delete({
      where: { id: habitId }
    });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Helper function to calculate habit streak
async function calculateHabitStreak(habitId: string): Promise<number> {
  const completions = await prisma.habitCompletion.findMany({
    where: { habitId },
    orderBy: { completedAt: 'desc' }
  });

  if (completions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if completed today or yesterday
  const lastCompletion = new Date(completions[0].completedAt);
  lastCompletion.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 1) return 0; // Streak broken

  // Count consecutive days
  let currentDate = new Date(lastCompletion);
  
  for (const completion of completions) {
    const completionDate = new Date(completion.completedAt);
    completionDate.setHours(0, 0, 0, 0);
    
    if (completionDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Helper function to update challenge progress
async function updateChallengeProgress(userId: string, habitId: string) {
  const activeChallenges = await prisma.userChallenge.findMany({
    where: {
      userId,
      status: 'active'
    },
    include: {
      challenge: true
    }
  });

  for (const userChallenge of activeChallenges) {
    const { challenge } = userChallenge;
    
    let newProgress = userChallenge.currentProgress;
    
    if (challenge.type === 'streak') {
      const streak = await calculateHabitStreak(habitId);
      newProgress = Math.max(newProgress, streak);
    } else if (challenge.type === 'total_completions') {
      newProgress += 1;
    } else if (challenge.type === 'consecutive_days') {
      // This would need more complex logic for consecutive days across all habits
      newProgress += 1;
    }

    if (newProgress >= challenge.targetValue) {
      // Complete challenge
      await prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          currentProgress: newProgress
        }
      });

      // Award XP
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: {
            increment: challenge.xpReward
          }
        }
      });
    } else {
      // Update progress
      await prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: { currentProgress: newProgress }
      });
    }
  }
}

export default router;
