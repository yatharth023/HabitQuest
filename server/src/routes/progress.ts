import express from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get progress data (heatmap and streaks)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get habits with completions for the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7));

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        completions: {
          where: {
            completedAt: {
              gte: twelveWeeksAgo
            }
          }
        }
      }
    });

    // Calculate streaks for each habit
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        const streak = await calculateHabitStreak(habit.id);
        return {
          ...habit,
          streak
        };
      })
    );

    // Sort by streak and get top 3
    const topStreaks = habitsWithStreaks
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3)
      .map(habit => ({
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        streak: habit.streak
      }));

    // Generate heatmap data
    const heatmapData = await generateHeatmapData(userId, twelveWeeksAgo);

    res.json({
      topStreaks,
      heatmapData
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

// Get user stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        totalXp: true,
        username: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get total habits
    const totalHabits = await prisma.habit.count({
      where: { userId }
    });

    // Get total completions
    const totalCompletions = await prisma.habitCompletion.count({
      where: { userId }
    });

    // Get current streak (longest active streak)
    const habits = await prisma.habit.findMany({
      where: { userId },
      select: { id: true }
    });

    const streaks = await Promise.all(
      habits.map(habit => calculateHabitStreak(habit.id))
    );

    const currentStreak = Math.max(...streaks, 0);

    // Get completed challenges
    const completedChallenges = await prisma.userChallenge.count({
      where: {
        userId,
        status: 'completed'
      }
    });

    res.json({
      user,
      totalHabits,
      totalCompletions,
      currentStreak,
      completedChallenges
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
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

// Helper function to generate heatmap data
async function generateHeatmapData(userId: string, startDate: Date) {
  const endDate = new Date();
  const heatmapData: { [key: string]: number } = {};

  // Get all completions in the date range
  const completions = await prisma.habitCompletion.findMany({
    where: {
      userId,
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: { completedAt: true }
  });

  // Group completions by date
  completions.forEach(completion => {
    const date = new Date(completion.completedAt);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];
    
    heatmapData[dateKey] = (heatmapData[dateKey] || 0) + 1;
  });

  // Generate all dates in range
  const allDates: { date: string; count: number }[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    allDates.push({
      date: dateKey,
      count: heatmapData[dateKey] || 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return allDates;
}

export default router;
