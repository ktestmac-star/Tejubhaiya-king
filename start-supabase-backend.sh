#!/bin/bash

# Tracko Supabase Backend Startup Script

echo "🚀 Starting Tracko Supabase Backend Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Navigate to supabase-backend directory
cd supabase-backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env
    echo ""
    echo "🔧 IMPORTANT: You need to configure Supabase!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Go to https://supabase.com"
    echo "   2. Create a new project (takes 2-3 minutes)"
    echo "   3. Get your project URL and API keys"
    echo "   4. Update supabase-backend/.env with your credentials"
    echo ""
    echo "📖 See SUPABASE_SETUP_GUIDE.md for detailed instructions"
    echo ""
    read -p "Have you configured your Supabase credentials? (y/n): " configured
    if [[ ! $configured =~ ^[Yy]$ ]]; then
        echo "❌ Please configure Supabase first, then run this script again."
        exit 1
    fi
fi

# Check if Supabase is configured
if grep -q "your-project" .env; then
    echo "⚠️  Supabase not configured yet!"
    echo ""
    echo "🔧 Please update supabase-backend/.env with your Supabase credentials:"
    echo "   SUPABASE_URL=https://your-project-id.supabase.co"
    echo "   SUPABASE_ANON_KEY=your-anon-key"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "📖 See SUPABASE_SETUP_GUIDE.md for step-by-step instructions"
    echo ""
    read -p "Continue anyway for testing? (y/n): " continue_test
    if [[ ! $continue_test =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Please configure Supabase first."
        exit 1
    fi
fi

# Set up database schema
echo "🗄️  Setting up database schema..."
npm run setup

# Check if we should seed data
echo ""
echo "🌱 Do you want to seed initial test data? (y/n)"
read -r seed_response
if [[ $seed_response =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding initial data..."
    npm run seed
    echo ""
    echo "✅ Test credentials created:"
    echo "   Owner: owner@cityfuel.com / password123 (or username: owner)"
    echo "   Manager: manager@cityfuel.com / password123 (or username: manager)"
    echo "   Operator1: operator1@cityfuel.com / password123 (or username: operator1)"
    echo "   Operator2: operator2@cityfuel.com / password123 (or username: operator2)"
    echo ""
fi

echo "🚀 Starting Supabase backend server..."
echo "   Server will be available at: http://localhost:3000"
echo "   Health check: http://localhost:3000/health"
echo "   API base URL: http://localhost:3000/api"
echo ""
echo "📱 For React Native app:"
echo "   - Update src/config/supabase.ts with your Supabase credentials"
echo "   - Install dependencies: npm install @supabase/supabase-js react-native-url-polyfill"
echo "   - Android emulator: Use http://10.0.2.2:3000/api"
echo "   - iOS simulator: Use http://localhost:3000/api"
echo ""
echo "🎯 Features enabled:"
echo "   ✅ Multi-device owner access"
echo "   ✅ Staff personal device support"
echo "   ✅ Real-time data synchronization"
echo "   ✅ Enterprise-grade security"
echo "   ✅ Automatic scaling"
echo ""

# Start the server
npm run dev