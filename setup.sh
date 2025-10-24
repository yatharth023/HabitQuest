#!/bin/bash

echo "🚀 Setting up HabitQuest..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Copy environment files
echo "⚙️ Setting up environment files..."
cp env.example .env
cp server/env.example server/.env

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your PostgreSQL database"
echo "2. Update server/.env with your database URL and JWT secret"
echo "3. Update .env with your API URL"
echo "4. Run the database setup:"
echo "   cd server && npm run db:generate && npm run db:push && npm run db:seed"
echo "5. Start the development servers:"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: npm run dev"
echo ""
echo "🎮 Happy habit tracking!"
