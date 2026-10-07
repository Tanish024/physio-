# 📖 API Quick Reference

Complete reference for all backend API functions.

## 🔐 Authentication

All API calls require authentication except for public data (exercises, tutorials, homepage content).

```typescript
import { supabase } from '@/integrations/supabase/client'

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

---

## 👤 Profile API

### `getCurrentProfile()`
Get the current user's profile.

```typescript
const profile = await API.profile.getCurrentProfile()
// Returns: Profile object with all user data
```

### `updateProfile(updates)`
Update user profile information.

```typescript
await API.profile.updateProfile({
  full_name: 'John Doe',
  fitness_level: 'intermediate',
  fitness_goals: ['weight_loss', 'muscle_gain'],
  weekly_workout_goal: 4
})
```

### `completeOnboarding(profileData)`
Mark onboarding as complete and save initial data.

```typescript
await API.profile.completeOnboarding({
  full_name: 'John Doe',
  fitness_level: 'beginner',
  fitness_goals: ['general_fitness'],
  height_cm: 175,
  weight_kg: 80
})
```

### `uploadAvatar(file)`
Upload and set user avatar.

```typescript
const file = event.target.files[0]
await API.profile.uploadAvatar(file)
```

### `getSettings()`
Get user settings.

```typescript
const settings = await API.profile.getSettings()
```

### `updateSettings(updates)`
Update user settings.

```typescript
await API.profile.updateSettings({
  workout_reminders: true,
  notification_enabled: true,
  voice_guidance: true
})
```

---

## 🏋️ Exercise API

### `getAll(filters?)`
Get all exercises with optional filters.

```typescript
// Get all exercises
const exercises = await API.exercise.getAll()

// With filters
const strengthExercises = await API.exercise.getAll({
  category: 'strength',
  difficulty: 'beginner',
  search: 'push'
})
```

### `getById(id)`
Get specific exercise by ID.

```typescript
const exercise = await API.exercise.getById(exerciseId)
```

### `getRecommended(limit?)`
Get personalized exercise recommendations.

```typescript
const recommended = await API.exercise.getRecommended(10)
// Returns top 10 recommended exercises
```

### `bookmark(exerciseId, notes?)`
Bookmark an exercise.

```typescript
await API.exercise.bookmark(exerciseId, 'Great for chest day!')
```

### `removeBookmark(exerciseId)`
Remove a bookmark.

```typescript
await API.exercise.removeBookmark(exerciseId)
```

### `rate(exerciseId, rating, review?)`
Rate an exercise (1-5 stars).

```typescript
await API.exercise.rate(exerciseId, 5, 'Perfect exercise for beginners!')
```

### `getBookmarks()`
Get user's bookmarked exercises.

```typescript
const bookmarks = await API.exercise.getBookmarks()
```

---

## 💪 Workout API

### `start(sessionData)`
Start a new workout session.

```typescript
const session = await API.workout.start({
  title: 'Morning Workout',
  session_type: 'quick',
  mood_before: 'energized'
})
```

### `update(sessionId, updates)`
Update a workout session.

```typescript
await API.workout.update(sessionId, {
  status: 'paused'
})
```

### `complete(sessionId, finalData)`
Complete a workout session.

```typescript
await API.workout.complete(sessionId, {
  totalExercises: 5,
  totalReps: 75,
  totalCalories: 150,
  averageFormScore: 92.5,
  moodAfter: 'accomplished',
  perceivedDifficulty: 7
})
```

### `getHistory(limit?)`
Get workout history.

```typescript
const history = await API.workout.getHistory(20)
// Returns last 20 workouts
```

### `recordPerformance(performanceData)`
Record performance for an exercise.

```typescript
await API.workout.recordPerformance({
  session_id: sessionId,
  exercise_id: exerciseId,
  reps_completed: 15,
  sets_completed: 3,
  duration_seconds: 180,
  form_scores: [92, 94, 91],
  average_form_score: 92.3,
  calories_burned: 25
})
```

### `saveFeedback(feedbackData)`
Save live form feedback during workout.

```typescript
await API.workout.saveFeedback({
  performance_id: performanceId,
  rep_number: 5,
  form_score: 88.5,
  feedback_message: 'Keep elbows closer to body',
  issue_type: 'posture',
  severity: 'warning'
})
```

---

## 📊 Progress API

### `getStats(daysBack?)`
Get workout statistics.

```typescript
const stats = await API.progress.getStats(30)
// Returns: {
//   total_workouts,
//   total_duration_minutes,
//   total_calories,
//   average_form_score,
//   total_exercises,
//   improvement_percentage
// }
```

### `getDailyStats(startDate, endDate)`
Get daily statistics for date range.

```typescript
const dailyStats = await API.progress.getDailyStats(
  '2025-10-01',
  '2025-10-31'
)
```

### `getPersonalRecords()`
Get all personal records.

```typescript
const records = await API.progress.getPersonalRecords()
```

### `logMeasurement(measurement)`
Log body measurements.

```typescript
await API.progress.logMeasurement({
  date: '2025-10-05',
  weight_kg: 78.5,
  body_fat_percentage: 15.2,
  chest_cm: 102,
  waist_cm: 85,
  bicep_left_cm: 38
})
```

### `getMeasurements(limit?)`
Get body measurement history.

```typescript
const measurements = await API.progress.getMeasurements(30)
```

---

## 🏆 Achievement API

### `getAll()`
Get all available achievements.

```typescript
const achievements = await API.achievement.getAll()
```

### `getUserAchievements()`
Get user's unlocked achievements.

```typescript
const unlocked = await API.achievement.getUserAchievements()
```

### `getTodayChallenge()`
Get today's daily challenge.

```typescript
const challenge = await API.achievement.getTodayChallenge()
```

### `checkChallengeCompletion(challengeId)`
Check if user completed a challenge.

```typescript
const completed = await API.achievement.checkChallengeCompletion(challengeId)
// Returns: boolean
```

### `completeChallenge(challengeId, progressValue)`
Complete a daily challenge.

```typescript
await API.achievement.completeChallenge(challengeId, 50)
```

---

## 👥 Social API

### `getLeaderboard(type?, limit?)`
Get leaderboard.

```typescript
// Global leaderboard
const global = await API.social.getLeaderboard('global', 100)

// Friends leaderboard
const friends = await API.social.getLeaderboard('friends')
```

### `getFeed(limit?)`
Get community feed.

```typescript
const posts = await API.social.getFeed(20)
```

### `createPost(postData)`
Create a post.

```typescript
await API.social.createPost({
  post_type: 'workout',
  content: 'Just completed my 50th workout! 💪',
  visibility: 'friends',
  session_id: sessionId
})
```

### `likePost(postId)`
Like a post.

```typescript
await API.social.likePost(postId)
```

### `unlikePost(postId)`
Unlike a post.

```typescript
await API.social.unlikePost(postId)
```

### `sendFriendRequest(friendId)`
Send a friend request.

```typescript
await API.social.sendFriendRequest(friendId)
```

### `acceptFriendRequest(friendshipId)`
Accept a friend request.

```typescript
await API.social.acceptFriendRequest(friendshipId)
```

---

## 🔔 Notification API

### `getAll(unreadOnly?)`
Get notifications.

```typescript
// All notifications
const all = await API.notification.getAll()

// Unread only
const unread = await API.notification.getAll(true)
```

### `markAsRead(notificationId)`
Mark notification as read.

```typescript
await API.notification.markAsRead(notificationId)
```

### `markAllAsRead()`
Mark all notifications as read.

```typescript
await API.notification.markAllAsRead()
```

### `delete(notificationId)`
Delete a notification.

```typescript
await API.notification.delete(notificationId)
```

---

## 📚 Tutorial API

### `getAll(category?)`
Get all tutorials.

```typescript
// All tutorials
const tutorials = await API.tutorial.getAll()

// By category
const formTips = await API.tutorial.getAll('form_tips')
```

### `getById(id)`
Get specific tutorial (increments view count).

```typescript
const tutorial = await API.tutorial.getById(tutorialId)
```

### `updateProgress(tutorialId, watchedDuration, completed?)`
Track tutorial viewing progress.

```typescript
await API.tutorial.updateProgress(tutorialId, 120, false)
// User watched 120 seconds
```

---

## 📈 Analytics API

### `trackEvent(eventData)`
Track an analytics event.

```typescript
await API.analytics.trackEvent({
  eventType: 'exercise_started',
  eventCategory: 'workout',
  eventData: { exerciseId, difficulty: 'intermediate' },
  pageUrl: '/workout/push-up'
})
```

### `getHomepageContent()`
Get dynamic homepage content.

```typescript
const content = await API.analytics.getHomepageContent()
// Returns testimonials, success stories, banners, etc.
```

### `getSystemStats()`
Get system-wide statistics.

```typescript
const stats = await API.analytics.getSystemStats()
// Returns total users, workouts, exercises, etc.
```

---

## 🔄 Real-time Subscriptions

### Listen for Notifications

```typescript
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Handle new notification
      console.log('New notification:', payload.new)
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

### Listen for Achievement Unlocks

```typescript
const subscription = supabase
  .channel('achievements')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'user_achievements',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Show achievement popup
      showAchievementPopup(payload.new)
    }
  )
  .subscribe()
```

### Listen for Leaderboard Changes

```typescript
const subscription = supabase
  .channel('profiles')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `show_on_leaderboard=eq.true`
    },
    (payload) => {
      // Refresh leaderboard
      refreshLeaderboard()
    }
  )
  .subscribe()
```

---

## 🎨 Common Patterns

### Complete Workout Flow

```typescript
// 1. Start session
const session = await API.workout.start({
  session_type: 'quick'
})

// 2. Record each exercise
for (const exercise of exercises) {
  await API.workout.recordPerformance({
    session_id: session.id,
    exercise_id: exercise.id,
    reps_completed: 15,
    average_form_score: 92.5
  })
}

// 3. Complete session
await API.workout.complete(session.id, {
  totalExercises: exercises.length,
  totalReps: 75,
  totalCalories: 150
})
```

### Display User Dashboard

```typescript
// Get all dashboard data
const [profile, stats, achievements, challenges] = await Promise.all([
  API.profile.getCurrentProfile(),
  API.progress.getStats(30),
  API.achievement.getUserAchievements(),
  API.achievement.getTodayChallenge()
])

// Display in UI
renderDashboard({ profile, stats, achievements, challenges })
```

### Social Feed

```typescript
// Get feed
const posts = await API.social.getFeed(20)

// Listen for updates
const subscription = supabase
  .channel('feed')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'community_posts' 
  }, (payload) => {
    addPostToFeed(payload.new)
  })
  .subscribe()
```

---

## 🔍 Error Handling

All API functions throw errors that should be caught:

```typescript
try {
  const profile = await API.profile.getCurrentProfile()
} catch (error) {
  if (error.message === 'Not authenticated') {
    // Redirect to login
  } else {
    // Show error message
    console.error('Error:', error)
  }
}
```

### Common Errors

- `Not authenticated` - User not logged in
- `PGRST116` - Row not found (Supabase error code)
- Permission errors - RLS policy violation
- Validation errors - Invalid data format

---

## 💡 Tips & Best Practices

1. **Batch Requests**: Use `Promise.all()` for independent queries
2. **Error Handling**: Always wrap API calls in try-catch
3. **Real-time**: Unsubscribe from channels when component unmounts
4. **Caching**: Use React Query or similar for automatic caching
5. **Types**: Import types from `database.types.ts` for type safety
6. **Analytics**: Track important user actions for insights

---

## 🚀 Performance Optimization

### Use Pagination

```typescript
// Get first 20 posts
const posts = await API.social.getFeed(20)

// Load more
const morePosts = await supabase
  .from('community_posts')
  .select('*')
  .range(20, 39)
```

### Select Only Needed Fields

```typescript
const { data } = await supabase
  .from('exercises')
  .select('id, name, category, thumbnail_url')
  // Don't fetch instructions, tips, etc if not needed
```

### Use Filters on Database

```typescript
// ✅ Good: Filter in database
const recentWorkouts = await supabase
  .from('workout_sessions')
  .select('*')
  .gte('started_at', thirtyDaysAgo)

// ❌ Bad: Filter in JS after fetching all
const allWorkouts = await supabase.from('workout_sessions').select('*')
const recentWorkouts = allWorkouts.filter(w => w.started_at >= thirtyDaysAgo)
```

---

That's it! You now have complete API documentation for your fitness app backend. Happy coding! 🎉

