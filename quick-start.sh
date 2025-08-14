#!/bin/bash

echo "🚀 Bitboard Quick Start Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local from env.example..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your database credentials"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npm run prisma:generate

echo ""
echo "🎉 Setup complete! You can now:"
echo ""
echo "1. Edit .env.local with your database credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Or use Cursor's Command Palette (Cmd+Shift+P) and run 'Tasks: Run Task'"
echo "4. Select '🚀 Start Development Server' for one-click start"
echo ""
echo "🌐 Your app will be available at: http://localhost:3000"
echo ""
echo "Happy coding! 🚀"
