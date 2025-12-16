# 🚀 Supabase Setup Guide for Tracko

## Why Supabase?

Supabase is a complete backend-as-a-service that provides:
- ✅ **PostgreSQL Database** - More powerful than MongoDB
- ✅ **Built-in Authentication** - No need to manage JWT tokens manually
- ✅ **Real-time subscriptions** - Live data updates
- ✅ **Row Level Security** - Database-level access control
- ✅ **Auto-generated APIs** - REST and GraphQL endpoints
- ✅ **Free tier** - Perfect for development and small projects
- ✅ **Easy deployment** - No server management needed

## 🎯 Quick Setup (5 minutes)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - **Name**: `tracko-backend`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
7. Click "Create new project"
8. Wait 2-3 minutes for setup to complete

### 2. Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

### 3. Configure Backend

1. **Create environment file:**
   ```bash
   cd supabase-backend
   cp .env.example .env
   ```

2. **Update `.env` with your credentials:**
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret-from-supabase-settings
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

### 4. Set Up Database Schema

**Option A: Automatic Setup (Recommended)**
```bash
npm run setup
```

**Option B: Manual Setup**
1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Copy and paste the contents of `scripts/manual-setup.sql`
4. Click "Run"

### 5. Seed Test Data

```bash
npm run seed
```

### 6. Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Supabase backend server running on port 3000
📍 Health check: http://localhost:3000/health
🔗 API base URL: http://localhost:3000/api
```

## 📱 Configure Mobile App

### 1. Update Supabase Config

Edit `src/config/supabase.ts`:

```typescript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-anon-public-key';
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js react-native-url-polyfill
```

### 3. iOS Setup (if using iOS)

```bash
cd ios && pod install && cd ..
```

## 🧪 Test Your Setup

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Supabase backend server is running",
  "database": "Supabase PostgreSQL"
}
```

### 2. Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "owner",
    "password": "password123"
  }'
```

### 3. Mobile App Test
```bash
npm start
npm run android  # or npm run ios
```

**Test Credentials:**
- **Owner**: `owner` / `password123` (or `owner@cityfuel.com`)
- **Manager**: `manager` / `password123`
- **Operator1**: `operator1` / `password123`
- **Operator2**: `operator2` / `password123`

## 🎛️ Supabase Dashboard Features

### Database
- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom queries
- **Database**: Manage schemas, functions, triggers

### Authentication
- **Users**: Manage user accounts
- **Policies**: Configure Row Level Security
- **Settings**: Configure auth providers, email templates

### API
- **API Docs**: Auto-generated documentation
- **GraphQL**: GraphQL playground
- **Realtime**: Configure real-time subscriptions

### Storage (Optional)
- **Buckets**: File storage for images, documents
- **Policies**: Access control for files

## 🔒 Security Features

### Row Level Security (RLS)
Supabase automatically enforces database-level security:

- **Users** can only see data from their petrol pump
- **Owners** can see all data for their pump
- **Managers/Operators** can only see their assigned pump data
- **Audit logs** track all user actions

### Authentication
- **JWT tokens** managed automatically
- **Session management** with refresh tokens
- **Password hashing** with bcrypt
- **Email verification** (optional)

## 🚀 Production Deployment

### Backend Deployment Options

1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Railway**
   ```bash
   npm install -g @railway/cli
   railway login
   railway deploy
   ```

3. **Heroku**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Mobile App Deployment

1. **Update API URL** in `src/services/ApiService.ts`
2. **Build for production**:
   ```bash
   # Android
   cd android && ./gradlew assembleRelease
   
   # iOS
   cd ios && xcodebuild -workspace Tracko.xcworkspace -scheme Tracko archive
   ```

## 📊 Monitoring & Analytics

### Supabase Dashboard
- **API Usage**: Monitor request volume
- **Database Performance**: Query performance metrics
- **Auth Analytics**: User login patterns
- **Real-time Connections**: Active subscriptions

### Custom Monitoring
- **Audit Logs**: Track all user actions
- **Error Logging**: Automatic error tracking
- **Performance Metrics**: API response times

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid API key"**
   - Check your `.env` file has correct Supabase credentials
   - Ensure no extra spaces in environment variables

2. **"Connection refused"**
   - Backend server not running: `npm run dev`
   - Wrong port: Check if port 3000 is available

3. **"RLS policy violation"**
   - Database policies are working correctly
   - User doesn't have access to requested data

4. **"Schema not found"**
   - Run database setup: `npm run setup`
   - Or manually run SQL from `scripts/manual-setup.sql`

### Getting Help

1. **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
2. **Discord Community**: [discord.supabase.com](https://discord.supabase.com)
3. **GitHub Issues**: Report bugs and feature requests

## 🎉 You're Ready!

Your Tracko app now has:
- ✅ **Supabase PostgreSQL backend**
- ✅ **Multi-device owner access**
- ✅ **Staff personal device support**
- ✅ **Real-time data synchronization**
- ✅ **Enterprise-grade security**
- ✅ **Automatic scaling**
- ✅ **Built-in monitoring**

**Total setup time: ~5 minutes**  
**Monthly cost: $0 (free tier)**  
**Scalability: Unlimited**

Welcome to the future of petrol pump management! 🚀