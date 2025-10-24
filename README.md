# HabitQuest - Gamified Habit Tracker

A full-stack gamified habit tracking web application that transforms daily habits into an RPG-style adventure with XP, levels, streaks, challenges, and social features.

## 🚀 Features

- **Gamified Experience**: Earn XP, level up, and unlock achievements
- **Habit Tracking**: Create and track daily habits with streak counting
- **Challenges**: Take on epic quests for bonus XP rewards
- **Social Features**: Connect with friends and see their progress
- **Progress Visualization**: Heatmap calendar and streak tracking
- **Modern UI**: Beautiful interface with animations and confetti celebrations

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Radix UI** components (shadcn/ui)
- **React Query** for state management
- **React Router** for navigation
- **React Hook Form** + **Zod** for forms
- **Sonner** for toast notifications
- **React Confetti Boom** for celebrations

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT** authentication
- **bcryptjs** for password hashing
- **Zod** for validation

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database

### 1. Clone the repository
```bash
git clone <repository-url>
cd HabitQuest
```

### 2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Database Setup
```bash
# Create a PostgreSQL database
createdb habitquest

# Set up environment variables
cp server/env.example server/.env
# Edit server/.env with your database URL and JWT secret

# Generate Prisma client
cd server
npm run db:generate

# Push database schema
npm run db:push

# Seed the database with default challenges
npm run db:seed
```

### 4. Environment Configuration
```bash
# Copy environment file
cp env.example .env
# Edit .env with your API URL
```

### 5. Start the development servers
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend development server
npm run dev
```

## 🗄 Database Schema

The application uses the following main entities:

- **Users**: User profiles with XP, level, and authentication
- **Habits**: User-created habits with goals and frequency
- **Habit Completions**: Daily habit completions with XP rewards
- **Challenges**: Pre-defined challenges for bonus XP
- **User Challenges**: User participation in challenges
- **Friendships**: Social connections between users
- **Achievements**: User achievements and badges

## 🎮 Game Mechanics

### XP System
- **10 XP** per habit completion
- **100 XP** per level (Level = floor(totalXP / 100) + 1)
- **Challenge bonuses** (100-500 XP)

### Streaks
- Consecutive days of habit completion
- Visual flame icons (🔥) for active streaks
- Streak tracking across all habits

### Challenges
- **7-Day Streak**: Complete any habit for 7 days (150 XP)
- **30-Day Warrior**: Complete any habit for 30 days (500 XP)
- **Century Club**: Complete 100 total habits (300 XP)
- **Habit Master**: Complete 5 different habits in one day (400 XP)
- **Early Riser**: Complete morning habits for 14 days (250 XP)

## 🎨 UI Components

Built with **shadcn/ui** components:
- **Button**: Various styles and sizes
- **Card**: Content containers
- **Input**: Form inputs with validation
- **Progress**: XP and challenge progress bars
- **Tabs**: Navigation between sections
- **Avatar**: User profile pictures
- **Toast**: Notifications with Sonner

## 🔐 Authentication

- **JWT-based** authentication
- **bcryptjs** password hashing
- **Protected routes** with React Router
- **Auto-login** with localStorage persistence

## 📱 Pages

- **Onboarding**: 3-step welcome flow
- **Authentication**: Login/register forms
- **Home**: Daily habits dashboard
- **Add Habit**: Create new habits
- **Progress**: Stats and heatmap visualization
- **Challenges**: Available, active, and completed challenges
- **Friends**: Social features and user search

## 🎯 Key Features

### Habit Management
- Create habits with custom icons and goals
- Daily completion tracking
- Streak calculation and visualization
- XP rewards for completions

### Challenge System
- Pre-defined challenges with different types
- Progress tracking and completion rewards
- Time-limited challenges
- XP bonus rewards

### Social Features
- Friend requests and management
- User search and discovery
- Friend progress visibility
- Social challenge participation

### Progress Tracking
- 12-week heatmap visualization
- Top 3 current streaks
- Total statistics and achievements
- Level progression tracking

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy Express.js server

### Frontend Deployment
1. Build the React application
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure API endpoints

## 🧪 Development

### Available Scripts
```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
cd server
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, please open an issue in the repository or contact the development team.
