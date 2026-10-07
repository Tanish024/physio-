# 🏋️ Fitness App Backend - Complete Setup Guide

## 📋 Overview

This document describes the complete backend system for your AI-powered fitness application. The backend is built using **Supabase** (PostgreSQL) and provides:

- ✅ **30+ Database Tables** - Complete data model for fitness tracking
- ✅ **Automated Triggers** - Real-time streak calculation, XP awarding, achievement unlocking
- ✅ **Row Level Security** - Secure data access with privacy controls
- ✅ **TypeScript API Client** - Type-safe frontend integration
- ✅ **Seed Data** - Ready-to-use exercises, achievements, and tutorials

---

## 🚀 Quick Start

### 1. Prerequisites

- Supabase account (free tier works!)
- Node.js 18+ installed
- Your project already uses `@supabase/supabase-js`

### 2. Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Save your project URL and anon key

2. **Configure Environment Variables**

Create or update `.env` file:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. **Run Migrations**

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Push migrations to Supabase
supabase db push
```

Alternatively, copy and run each migration file manually in the Supabase SQL Editor:
1. `20251005174600_complete_fitness_schema.sql`
2. `20251005174700_triggers_and_functions.sql`
3. `20251005174800_row_level_security.sql`
4. `20251005174900_seed_data.sql`

---

## 📊 Database Architecture

### Core Tables

#### **Users & Authentication**
- `profiles` - User profiles with fitness data
- `user_settings` - User preferences and settings

#### **Exercise Library**
- `exercises` - Exercise database with AI pose detection support
- `exercise_variations` - Alternative versions of exercises
- `exercise_bookmarks` - User's saved exercises
- `exercise_ratings` - User ratings and reviews

#### **Workout Tracking**
- `workout_sessions` - Individual workout sessions
- `exercise_performances` - Per-exercise performance data
- `live_form_feedback` - Real-time AI feedback during workouts

#### **Progress & Analytics**
- `daily_stats` - Daily aggregated statistics
- `personal_records` - User's personal bests
- `body_measurements` - Body tracking over time

#### **Gamification**
- `achievements` - Available badges and achievements
- `user_achievements` - Unlocked achievements
- `daily_challenges` - Daily workout challenges
- `user_challenge_completions` - Challenge completions

#### **Social Features**
- `friendships` - Friend connections
- `community_posts` - Social feed posts
- `post_likes` - Post engagement
- `post_comments` - Post discussions
- `user_challenges` - Challenges between friends

#### **Learning**
- `tutorials` - YouTube video tutorials
- `user_tutorial_progress` - Viewing progress

#### **System**
- `notifications` - User notifications
- `analytics_events` - Event tracking
- `homepage_content` - Dynamic homepage content
- `system_statistics` - Cached statistics

---

## 🔧 Backend Features

### 1. **Automated Streak Tracking**

When a workout is completed, the system automatically:
- Calculates current streak (consecutive workout days)
- Updates longest streak if broken
- Awards bonus XP for maintaining streaks

### 2. **Achievement System**

Achievements are automatically checked and unlocked when criteria are met:
- Workout milestones (1st, 5th, 10th workout, etc.)
- Streak achievements (3, 7, 14, 30 days)
- Performance achievements (perfect form, total reps)
- Social achievements (friend count)

### 3. **XP & Leveling**

- Base XP per workout: 10 XP
- Bonus XP per exercise: 5 XP
- Achievement rewards: 50-2500 XP
- Automatic level-up every 100 XP

### 4. **Personal Records**

The system automatically tracks and updates:
- Max reps per exercise
- Best form scores
- Fastest times
- Max weight used

### 5. **Daily Statistics**

Automatically aggregated daily:
- Total workouts
- Total duration
- Total exercises
- Total reps
- Calories burned
- Average form score

### 6. **Recommendation Engine**

Smart exercise recommendations based on:
- User fitness level
- Exercise popularity
- User ratings
- Past performance
- Avoidance of repetition

### 7. **Social Notifications**

Automatic notifications for:
- Friend requests
- Post likes and comments
- Challenge invitations
- Achievement unlocks
- Personal records

---

## 💻 Frontend Integration

### Using the API Client

```typescript
import API from '@/lib/api'

// Profile Management
const profile = await API.profile.getCurrentProfile()
await API.profile.updateProfile({ fitness_level: 'intermediate' })
await API.profile.uploadAvatar(file)

// Exercises
const exercises = await API.exercise.getAll({ category: 'strength' })
const recommended = await API.exercise.getRecommended(10)
await API.exercise.bookmark(exerciseId)
await API.exercise.rate(exerciseId, 5, 'Great exercise!')

// Workouts
const session = await API.workout.start({ session_type: 'quick' })
await API.workout.recordPerformance({
  session_id: session.id,
  exercise_id: exerciseId,
  reps_completed: 15,
  average_form_score: 92.5
})
await API.workout.complete(session.id, {
  totalExercises: 5,
  totalReps: 75,
  totalCalories: 150
})

// Progress
const stats = await API.progress.getStats(30) // Last 30 days
const dailyStats = await API.progress.getDailyStats(startDate, endDate)
const records = await API.progress.getPersonalRecords()

// Achievements
const achievements = await API.achievement.getAll()
const userAchievements = await API.achievement.getUserAchievements()
const todayChallenge = await API.achievement.getTodayChallenge()

// Social
const leaderboard = await API.social.getLeaderboard('global')
const feed = await API.social.getFeed(20)
await API.social.createPost({
  post_type: 'workout',
  content: 'Just crushed my workout! 💪',
  visibility: 'friends'
})
await API.social.likePost(postId)

// Notifications
const notifications = await API.notification.getAll()
await API.notification.markAsRead(notificationId)
await API.notification.markAllAsRead()

// Analytics
await API.analytics.trackEvent({
  eventType: 'exercise_started',
  eventCategory: 'workout',
  eventData: { exerciseId, difficulty: 'intermediate' }
})
const homepageContent = await API.analytics.getHomepageContent()
const systemStats = await API.analytics.getSystemStats()
```

### Real-time Subscriptions

```typescript
import { supabase } from '@/integrations/supabase/client'

// Listen for new notifications
const notificationSubscription = supabase
  .channel('user-notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new)
      // Update UI with new notification
    }
  )
  .subscribe()

// Listen for achievement unlocks
const achievementSubscription = supabase
  .channel('user-achievements')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'user_achievements',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Achievement unlocked!', payload.new)
      // Show achievement popup
    }
  )
  .subscribe()
```

---

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:

1. **Users can only access their own data**
   - Profiles, settings, workouts, measurements
   
2. **Privacy controls respected**
   - Public profiles visible to all
   - Friends-only profiles visible to friends
   - Private profiles only to owner

3. **Social features are properly scoped**
   - Users can only view posts from friends/public
   - Only post authors can edit/delete
   - Friendship status controls access

4. **System integrity**
   - Triggers run with elevated permissions
   - Users can't manipulate XP/achievements directly
   - Analytics are write-only for users

---

## 📈 Analytics & Insights

### System Statistics

Updated automatically via `update_system_stats()` function:
- Total users
- Total workouts completed
- Total exercises available
- Average user satisfaction
- Active users (30 days)

### User Analytics

Track user behavior with events:
```typescript
API.analytics.trackEvent({
  eventType: 'page_view',
  eventCategory: 'navigation',
  pageUrl: '/dashboard'
})

API.analytics.trackEvent({
  eventType: 'exercise_started',
  eventCategory: 'workout',
  eventData: { exerciseId, difficulty }
})

API.analytics.trackEvent({
  eventType: 'achievement_unlocked',
  eventCategory: 'gamification',
  eventData: { achievementId, xpReward }
})
```

---

## 🎯 Database Functions

### Utility Functions

**`get_user_workout_stats(user_uuid, days_back)`**
- Returns workout statistics for specified period
- Includes improvement percentage

**`get_recommended_exercises(user_uuid, limit_count)`**
- Returns personalized exercise recommendations
- Scores based on multiple factors

**`get_global_leaderboard(limit_count)`**
- Returns top users by XP
- Includes workout count

**`get_friends_leaderboard(user_uuid)`**
- Returns leaderboard filtered to friends
- Includes current user

**`update_system_stats()`**
- Recalculates system-wide statistics
- Should be run periodically (cron job)

---

## 🧪 Testing

### Seed Data Included

The system comes with:
- ✅ 10 exercises (push-ups, squats, planks, etc.)
- ✅ 19 achievements across all tiers
- ✅ 3 daily challenges
- ✅ 7 tutorial videos
- ✅ 5 testimonials and success stories

### Manual Testing

```sql
-- Check if user profile was created
SELECT * FROM profiles WHERE id = 'your-user-id';

-- Manually complete a workout to test triggers
UPDATE workout_sessions 
SET status = 'completed', 
    ended_at = NOW(),
    total_exercises = 5,
    total_reps = 50
WHERE id = 'session-id';

-- Check if achievements were unlocked
SELECT * FROM user_achievements WHERE user_id = 'your-user-id';

-- Check daily stats
SELECT * FROM daily_stats WHERE user_id = 'your-user-id';

-- View system statistics
SELECT * FROM system_statistics;
```

---

## 🔄 Maintenance

### Regular Tasks

1. **Update System Statistics**
   ```sql
   SELECT update_system_stats();
   ```
   Run daily via cron job or scheduled function

2. **Create Daily Challenges**
   Insert new challenges for upcoming days

3. **Clean Old Data**
   - Archive old analytics events (>90 days)
   - Clean up abandoned workout sessions

### Backup Strategy

Supabase provides automatic daily backups. For critical data:
1. Enable Point-in-Time Recovery
2. Set up custom backup scripts if needed
3. Export important tables regularly

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Achievements not unlocking**
- Check if triggers are enabled
- Verify `check_user_achievements` function exists
- Ensure RLS policies allow system inserts

**Issue: Streaks not calculating**
- Check `last_workout_date` in profile
- Verify `update_user_streak` function
- Ensure workout status is 'completed'

**Issue: RLS blocking queries**
- Verify user is authenticated
- Check RLS policies for the table
- Use service role key for admin operations

**Issue: Real-time subscriptions not working**
- Enable Realtime in Supabase dashboard
- Check subscription channel name
- Verify RLS allows SELECT

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 🎉 You're All Set!

Your backend is now fully configured and ready to power your fitness application! The system will automatically:

- ✅ Track user workouts and progress
- ✅ Calculate streaks and award XP
- ✅ Unlock achievements
- ✅ Generate personalized recommendations
- ✅ Send notifications
- ✅ Maintain leaderboards
- ✅ Aggregate analytics

Start building your frontend and let the backend handle all the complex logic automatically! 🚀

