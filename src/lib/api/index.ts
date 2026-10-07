// =====================================================
// API SERVICE - Complete Backend Functions
// =====================================================

import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']

// =====================================================
// PROFILES & USER MANAGEMENT
// =====================================================

export const ProfileAPI = {
  /**
   * Get current user's profile
   */
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: Tables['profiles']['Update']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(profileData: Partial<Tables['profiles']['Update']>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        onboarding_completed: true
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get user settings
   */
  async getSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update user settings
   */
  async updateSettings(updates: Tables['user_settings']['Update']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// =====================================================
// EXERCISES
// =====================================================

export const ExerciseAPI = {
  /**
   * Get all exercises
   */
  async getAll(filters?: {
    category?: string
    difficulty?: string
    search?: string
  }) {
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('is_active', true)
      .order('times_performed', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty)
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Get exercise by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get recommended exercises for user
   */
  async getRecommended(limit = 10) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .rpc('get_recommended_exercises', {
        user_uuid: user.id,
        limit_count: limit
      })

    if (error) throw error
    return data
  },

  /**
   * Bookmark an exercise
   */
  async bookmark(exerciseId: string, notes?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('exercise_bookmarks')
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        notes
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove bookmark
   */
  async removeBookmark(exerciseId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('exercise_bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)

    if (error) throw error
  },

  /**
   * Rate an exercise
   */
  async rate(exerciseId: string, rating: number, review?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('exercise_ratings')
      .upsert({
        user_id: user.id,
        exercise_id: exerciseId,
        rating,
        review
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get user's bookmarked exercises
   */
  async getBookmarks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('exercise_bookmarks')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('user_id', user.id)

    if (error) throw error
    return data
  }
}

// =====================================================
// WORKOUT SESSIONS
// =====================================================

export const WorkoutAPI = {
  /**
   * Start a new workout session
   */
  async start(sessionData: Partial<Tables['workout_sessions']['Insert']>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        ...sessionData
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update workout session
   */
  async update(sessionId: string, updates: Tables['workout_sessions']['Update']) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Complete workout session
   */
  async complete(sessionId: string, finalData: {
    totalExercises: number
    totalReps: number
    totalCalories: number
    averageFormScore?: number
    moodAfter?: string
    perceivedDifficulty?: number
  }) {
    const endTime = new Date().toISOString()

    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        ended_at: endTime,
        status: 'completed',
        total_exercises: finalData.totalExercises,
        total_reps: finalData.totalReps,
        total_calories_burned: finalData.totalCalories,
        average_form_score: finalData.averageFormScore,
        mood_after: finalData.moodAfter,
        perceived_difficulty: finalData.perceivedDifficulty
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get user's workout history
   */
  async getHistory(limit = 20) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Record exercise performance
   */
  async recordPerformance(performanceData: Tables['exercise_performances']['Insert']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('exercise_performances')
      .insert({
        ...performanceData,
        user_id: user.id,
        started_at: performanceData.started_at || new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Save live form feedback
   */
  async saveFeedback(feedbackData: Omit<Tables['live_form_feedback']['Row'], 'id' | 'timestamp'>) {
    const { data, error } = await supabase
      .from('live_form_feedback')
      .insert(feedbackData)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// =====================================================
// PROGRESS TRACKING
// =====================================================

export const ProgressAPI = {
  /**
   * Get user workout statistics
   */
  async getStats(daysBack = 30) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .rpc('get_user_workout_stats', {
        user_uuid: user.id,
        days_back: daysBack
      })

    if (error) throw error
    return data?.[0] || null
  },

  /**
   * Get daily stats for date range
   */
  async getDailyStats(startDate: string, endDate: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Get personal records
   */
  async getPersonalRecords() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercises(name, slug, thumbnail_url)
      `)
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Log body measurement
   */
  async logMeasurement(measurement: Omit<Tables['body_measurements']['Insert'], 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('body_measurements')
      .upsert({
        ...measurement,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get body measurement history
   */
  async getMeasurements(limit = 30) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}

// =====================================================
// ACHIEVEMENTS & GAMIFICATION
// =====================================================

export const AchievementAPI = {
  /**
   * Get all available achievements
   */
  async getAll() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Get user's unlocked achievements
   */
  async getUserAchievements() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get today's challenge
   */
  async getTodayChallenge() {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') throw error // Ignore not found
    return data
  },

  /**
   * Check if user completed today's challenge
   */
  async checkChallengeCompletion(challengeId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_challenge_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .maybeSingle()

    if (error) throw error
    return data !== null
  },

  /**
   * Complete a challenge
   */
  async completeChallenge(challengeId: string, progressValue: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_challenge_completions')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        progress_value: progressValue
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// =====================================================
// SOCIAL FEATURES
// =====================================================

export const SocialAPI = {
  /**
   * Get leaderboard
   */
  async getLeaderboard(type: 'global' | 'friends' = 'global', limit = 100) {
    const { data: { user } } = await supabase.auth.getUser()

    if (type === 'friends' && user) {
      const { data, error } = await supabase
        .rpc('get_friends_leaderboard', { user_uuid: user.id })
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .rpc('get_global_leaderboard', { limit_count: limit })
      if (error) throw error
      return data
    }
  },

  /**
   * Get community feed
   */
  async getFeed(limit = 20) {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url, level)
      `)
      .in('visibility', ['public', 'friends'])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Create a post
   */
  async createPost(postData: Omit<Tables['community_posts']['Insert'], 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        ...postData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Like a post
   */
  async likePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)

    if (error) throw error
  },

  /**
   * Send friend request
   */
  async sendFriendRequest(friendId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(friendshipId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', friendshipId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export const NotificationAPI = {
  /**
   * Get user notifications
   */
  async getAll(unreadOnly = false) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error
  },

  /**
   * Delete notification
   */
  async delete(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  }
}

// =====================================================
// TUTORIALS
// =====================================================

export const TutorialAPI = {
  /**
   * Get all tutorials
   */
  async getAll(category?: string) {
    let query = supabase
      .from('tutorials')
      .select('*')
      .order('display_order', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Get tutorial by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('tutorials')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    // Increment view count
    await supabase.rpc('increment', {
      table_name: 'tutorials',
      row_id: id,
      column_name: 'views_count'
    })

    return data
  },

  /**
   * Track tutorial progress
   */
  async updateProgress(tutorialId: string, watchedDuration: number, completed = false) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_tutorial_progress')
      .upsert({
        user_id: user.id,
        tutorial_id: tutorialId,
        watched_duration_seconds: watchedDuration,
        completed,
        last_watched_at: new Date().toISOString(),
        completed_at: completed ? new Date().toISOString() : undefined
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// =====================================================
// USER FEEDBACK
// =====================================================

export const FeedbackAPI = {
  /**
   * Submit user feedback using community_posts table with fallback
   */
  async submitFeedback(feedbackData: {
    name: string
    email: string
    feedback: string
    rating?: number
    category?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    
    try {
      // Try to use community_posts table first
      const feedbackContent = `FEEDBACK SUBMISSION\n\nName: ${feedbackData.name}\nEmail: ${feedbackData.email}\nCategory: ${feedbackData.category || 'general'}\n${feedbackData.rating ? `Rating: ${feedbackData.rating}/5 stars\n` : ''}\nFeedback:\n${feedbackData.feedback}`;
      
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user?.id || null,
          post_type: 'thought',
          content: feedbackContent,
          visibility: 'private',
          likes_count: 0,
          comments_count: 0
        })
        .select()
        .single()

      if (error) throw error
      return data
      
    } catch (error) {
      // Fallback: Store in localStorage and log to console
      console.warn('Database feedback submission failed, using fallback method:', error)
      
      const fallbackData = {
        ...feedbackData,
        user_id: user?.id || 'anonymous',
        timestamp: new Date().toISOString(),
        page_url: window.location.href
      }
      
      // Store in localStorage
      const existingFeedback = JSON.parse(localStorage.getItem('app_feedback') || '[]')
      existingFeedback.push(fallbackData)
      localStorage.setItem('app_feedback', JSON.stringify(existingFeedback))
      
      // Log to console for debugging
      console.log('Feedback submitted (fallback):', fallbackData)
      
      // Return success response
      return {
        id: Date.now().toString(),
        success: true,
        message: 'Feedback submitted successfully',
        method: 'fallback'
      }
    }
  },

  /**
   * Get feedback from community posts (for admin)
   */
  async getAllFeedback(limit = 50) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('post_type', 'thought')
      .eq('visibility', 'private')
      .ilike('content', 'FEEDBACK SUBMISSION%')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}

// =====================================================
// ANALYTICS
// =====================================================

export const AnalyticsAPI = {
  /**
   * Track event
   */
  async trackEvent(eventData: {
    eventType: string
    eventCategory?: string
    eventData?: any
    pageUrl?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user?.id || null,
        event_type: eventData.eventType,
        event_category: eventData.eventCategory,
        event_data: eventData.eventData,
        page_url: eventData.pageUrl || window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent
      })

    if (error) console.error('Analytics error:', error)
  },

  /**
   * Get homepage content
   */
  async getHomepageContent() {
    const { data, error } = await supabase
      .from('homepage_content')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const { data, error } = await supabase
      .from('system_statistics')
      .select('*')

    if (error) throw error
    return data
  }
}

// Export all APIs
export default {
  profile: ProfileAPI,
  exercise: ExerciseAPI,
  workout: WorkoutAPI,
  progress: ProgressAPI,
  achievement: AchievementAPI,
  social: SocialAPI,
  notification: NotificationAPI,
  tutorial: TutorialAPI,
  analytics: AnalyticsAPI,
  feedback: FeedbackAPI
}

