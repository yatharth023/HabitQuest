import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default challenges
  const challenges = [
    {
      name: '7-Day Streak',
      description: 'Complete any habit for 7 consecutive days',
      type: 'streak',
      durationDays: 7,
      targetValue: 7,
      icon: '🔥',
      xpReward: 150
    },
    {
      name: '30-Day Warrior',
      description: 'Complete any habit for 30 consecutive days',
      type: 'streak',
      durationDays: 30,
      targetValue: 30,
      icon: '⚔️',
      xpReward: 500
    },
    {
      name: 'Century Club',
      description: 'Complete 100 total habit completions',
      type: 'total_completions',
      durationDays: 365,
      targetValue: 100,
      icon: '💯',
      xpReward: 300
    },
    {
      name: 'Habit Master',
      description: 'Complete 5 different habits in a single day',
      type: 'consecutive_days',
      durationDays: 1,
      targetValue: 5,
      icon: '👑',
      xpReward: 400
    },
    {
      name: 'Early Riser',
      description: 'Complete a morning habit for 14 consecutive days',
      type: 'streak',
      durationDays: 14,
      targetValue: 14,
      icon: '🌅',
      xpReward: 250
    }
  ];

  // Clear existing challenges first
  await prisma.challenge.deleteMany({});
  
  // Create new challenges
  await prisma.challenge.createMany({
    data: challenges,
    skipDuplicates: true
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
