# 🚀 Getting Started - Complete Setup Guide

## ✅ What You Have Now

Your fitness app is **production-ready** with:
- ✅ Complete backend (Supabase + PostgreSQL)
- ✅ AI pose detection (MediaPipe)  
- ✅ Real-time form analysis
- ✅ Automated rep counting
- ✅ Progress tracking
- ✅ Gamification system

---

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ Node.js 18+ installed
- ✅ A Supabase account (free tier works!)
- ✅ A webcam for pose detection
- ✅ Internet connection

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```powershell
# Navigate to project directory
cd C:\Users\Mehta\OneDrive\Desktop\tempo-guide-ai-main\tempo-guide-ai-main

# Install dependencies
npm install

# Or if using bun (faster)
bun install
```

### Step 2: Set Up Supabase Backend

#### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New project"
5. Fill in:
   - **Name**: `tempo-fitness-app` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
6. Click "Create new project" (takes 2-3 minutes)

#### 2.2 Get Your Credentials
1. Once project is created, go to **Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

#### 2.3 Configure Environment Variables
Create/update `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from step 2.2.

#### 2.4 Run Database Migrations

**Option A: Using Supabase Dashboard (Recommended)**
1. In Supabase dashboard, go to **SQL Editor** (database icon)
2. Click **New query**
3. Copy and paste contents of each migration file **in order**:
   - `supabase/migrations/20251005174600_complete_fitness_schema.sql`
   - `supabase/migrations/20251005174700_triggers_and_functions.sql`
   - `supabase/migrations/20251005174800_row_level_security.sql`
   - `supabase/migrations/20251005174900_seed_data.sql`
4. Click **Run** for each file

**Option B: Using Supabase CLI**
```powershell
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push all migrations
supabase db push
```

### Step 3: Verify Backend Setup

1. Go to Supabase Dashboard → **Table Editor**
2. You should see tables like:
   - `profiles`
   - `exercises`
   - `workout_sessions`
   - `achievements`
   - etc.

3. Click on `exercises` table
4. You should see 10 sample exercises (push-ups, squats, etc.)

✅ **If you see these tables with data, your backend is ready!**

---

## 🎯 Running the App

### Start Development Server

```powershell
# Start the app
npm run dev

# Or with bun
bun run dev
```

The app will open at `http://localhost:5173` (or similar)

---

## 🧪 Testing the AI Pose Detection

### Test 1: Homepage
1. Open `http://localhost:5173`
2. You should see the beautiful homepage
3. Click **"Start Training Free"** or **"Sign In"**

### Test 2: Authentication
1. Click **"Sign In"** → **"Sign Up"**
2. Create an account:
   - Email: your-email@example.com
   - Password: minimum 6 characters
3. Check your email for confirmation (Supabase sends verification)
4. Click the verification link

### Test 3: Dashboard
1. After signing in, you should see the Dashboard
2. You'll see:
   - Your profile info
   - Exercise library
   - Progress stats (empty for now)

### Test 4: AI Pose Detection (The Cool Part!)

#### 4.1 Start a Workout
1. Click on any exercise (e.g., "Push-up")
2. You'll see the workout page with camera feed

#### 4.2 Enable Camera
1. Click **"Enable Camera"** button
2. Browser will ask for camera permission → **Allow**
3. You should see yourself in the video feed

#### 4.3 Position Yourself
For best results:
- ✅ Stand/position so your **full body** is visible
- ✅ Good lighting (not too dark)
- ✅ Clear background
- ✅ 6-10 feet from camera

#### 4.4 Start Workout
1. Click **"Start Workout"** button
2. **Magic happens!** 🎉

You should see:
- ✅ **Green skeleton overlay** on your body
- ✅ **Form score** updating in real-time
- ✅ **Feedback message** ("Perfect form!" or issues)
- ✅ **Issues detected** (if any - e.g., "Hips sagging")
- ✅ **Suggestions** (how to fix issues)
- ✅ **Rep counter** automatically counting!
- ✅ **Phase indicator** (UP/DOWN/HOLD)

#### 4.5 Try Different Exercises
1. Stop workout
2. Go back to dashboard
3. Try:
   - **Squats** - checks knee alignment, depth
   - **Plank** - checks body straightness, holds time
   - **Lunges** - checks knee position, torso

Each exercise has **custom AI analysis**!

---

## 🎨 What Each Color Means

### Skeleton Colors
- 🟢 **Green** (90-100%) = Excellent form
- 🔵 **Blue** (75-89%) = Good form
- 🟡 **Yellow** (60-74%) = Needs improvement
- 🔴 **Red** (0-59%) = Poor form - fix immediately

### Form Score
- 🟢 **90-100%** = "✓ Perfect form! Keep it up!"
- 🔵 **75-89%** = "✓ Good form, minor adjustments"
- 🟡 **60-74%** = "⚠ Check your form"
- 🔴 **0-59%** = "⚠ Poor form - risk of injury"

---

## 📊 Viewing Your Progress

### Check Workout History
1. Complete a workout (click "Stop Workout")
2. Data is **automatically saved** to database
3. Go to Supabase Dashboard → **Table Editor** → `workout_sessions`
4. You'll see your workout with:
   - Duration
   - Reps completed
   - Form score
   - Timestamp

### Check Daily Stats
1. In Supabase → `daily_stats` table
2. See aggregated daily data
3. Tracks your consistency and progress

### Check Achievements
1. Complete workouts to unlock achievements
2. Check `user_achievements` table
3. See which badges you've earned!

---

## 🐛 Troubleshooting

### Camera Issues

**"Camera not working"**
```
✓ Check browser permissions (Settings → Privacy → Camera)
✓ Ensure no other app is using camera
✓ Try different browser (Chrome works best)
✓ Refresh the page
```

**"Skeleton not showing"**
```
✓ Ensure full body visible in frame
✓ Check lighting (too dark?)
✓ Move back from camera (6-10 feet)
✓ Clear background helps
```

**"Reps not counting"**
```
✓ Complete full range of motion
✓ Ensure proper form (AI won't count bad reps)
✓ Move slower, more controlled
✓ Check exercise-specific requirements
```

### Backend Issues

**"Cannot connect to Supabase"**
```
✓ Check .env file has correct values
✓ Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
✓ Restart development server after changing .env
✓ Check Supabase project is active (not paused)
```

**"Table doesn't exist"**
```
✓ Verify migrations ran successfully
✓ Check Supabase Dashboard → Table Editor
✓ Re-run migration files if needed
✓ Check for SQL errors in Supabase logs
```

**"Authentication errors"**
```
✓ Check email verification link
✓ Try resetting password
✓ Clear browser cache/cookies
✓ Check Supabase Auth settings
```

### Performance Issues

**"Pose detection is slow/laggy"**
```
✓ Close other applications
✓ Use Chrome (best performance)
✓ Lower video resolution in code if needed
✓ Check internet connection (first load downloads AI model)
✓ Ensure good GPU/CPU
```

---

## 📚 Documentation Files

- **`BACKEND_SETUP.md`** - Complete backend documentation
- **`API_REFERENCE.md`** - All API functions explained
- **`AI_POSE_DETECTION.md`** - How pose detection works
- **`GETTING_STARTED.md`** - This file!

---

## 🎯 Quick Start Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Create Supabase project
- [ ] Copy credentials to `.env`
- [ ] Run all 4 migration files
- [ ] Verify tables exist in Supabase
- [ ] Start dev server (`npm run dev`)
- [ ] Sign up for account
- [ ] Test camera on workout page
- [ ] Do a few reps and watch AI analyze!
- [ ] Check data saved in Supabase

---

## 🚀 Deployment (When Ready)

### Deploy Frontend
```powershell
# Build for production
npm run build

# Deploy to Vercel, Netlify, or any host
# Just upload the `dist` folder
```

### Supabase Backend
- Already hosted in cloud ✅
- Auto-scales ✅
- Backups included ✅
- Just use your production URL

---

## 💡 Tips for Best Experience

### For Users
1. ✅ **Lighting** - Well-lit room is crucial
2. ✅ **Space** - Clear 8-10 feet around you
3. ✅ **Camera angle** - Show full body
4. ✅ **Clothing** - Contrasting colors help AI
5. ✅ **Start slow** - Let AI learn your movements

### For Development
1. ✅ **Use Chrome** - Best MediaPipe support
2. ✅ **HTTPS in production** - Required for camera access
3. ✅ **Test each exercise** - Ensure analyzers work
4. ✅ **Monitor Supabase** - Check API usage
5. ✅ **Read the docs** - All three documentation files

---

## 🎉 You're All Set!

Your AI fitness coach app is **ready to use**! 

### What You've Built:
- ✅ Full-stack fitness application
- ✅ AI-powered real-time form detection
- ✅ Automatic rep counting
- ✅ Progress tracking & analytics
- ✅ Gamification with achievements
- ✅ Social features ready
- ✅ Production-ready backend

### Next Steps:
1. **Test it out!** - Do some workouts
2. **Customize** - Adjust form thresholds
3. **Add exercises** - Use the analyzer templates
4. **Share it!** - Show friends your AI trainer
5. **Deploy it** - Make it public!

---

## 🆘 Need Help?

1. Check the documentation files:
   - `BACKEND_SETUP.md` for backend issues
   - `AI_POSE_DETECTION.md` for pose detection questions
   - `API_REFERENCE.md` for API usage

2. Check Supabase Dashboard logs:
   - Settings → Logs
   - See database errors, API calls

3. Browser console:
   - Press F12
   - Check Console tab for errors

---

**🎊 Congratulations! You have a production-ready AI fitness app!** 🏋️‍♂️💪

Start working out and let the AI coach guide you to perfect form!

