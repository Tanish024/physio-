// =====================================================
// DATABASE TYPES - Auto-generated from Supabase Schema
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          height_cm: number | null
          weight_kg: number | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          fitness_goals: string[] | null
          target_weight_kg: number | null
          weekly_workout_goal: number
          preferred_workout_time: string | null
          preferred_workout_duration: number | null
          theme_preference: string
          notification_enabled: boolean
          sound_enabled: boolean
          xp_points: number
          level: number
          current_streak: number
          longest_streak: number
          last_workout_date: string | null
          profile_visibility: 'public' | 'friends' | 'private'
          show_on_leaderboard: boolean
          created_at: string
          updated_at: string
          onboarding_completed: boolean
          last_active_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          fitness_goals?: string[] | null
          target_weight_kg?: number | null
          weekly_workout_goal?: number
          preferred_workout_time?: string | null
          preferred_workout_duration?: number | null
          theme_preference?: string
          notification_enabled?: boolean
          sound_enabled?: boolean
          xp_points?: number
          level?: number
          current_streak?: number
          longest_streak?: number
          last_workout_date?: string | null
          profile_visibility?: 'public' | 'friends' | 'private'
          show_on_leaderboard?: boolean
          onboarding_completed?: boolean
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          fitness_goals?: string[] | null
          target_weight_kg?: number | null
          weekly_workout_goal?: number
          preferred_workout_time?: string | null
          preferred_workout_duration?: number | null
          theme_preference?: string
          notification_enabled?: boolean
          sound_enabled?: boolean
          profile_visibility?: 'public' | 'friends' | 'private'
          show_on_leaderboard?: boolean
          onboarding_completed?: boolean
        }
      }
      
      user_settings: {
        Row: {
          id: string
          user_id: string
          workout_reminders: boolean
          achievement_notifications: boolean
          social_notifications: boolean
          email_notifications: boolean
          push_notifications: boolean
          show_activity_feed: boolean
          allow_friend_requests: boolean
          share_progress: boolean
          voice_guidance: boolean
          high_contrast: boolean
          text_size: string
          camera_position: string
          pose_detection_sensitivity: string
          auto_pause_workouts: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          workout_reminders?: boolean
          achievement_notifications?: boolean
          social_notifications?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          show_activity_feed?: boolean
          allow_friend_requests?: boolean
          share_progress?: boolean
          voice_guidance?: boolean
          high_contrast?: boolean
          text_size?: string
          camera_position?: string
          pose_detection_sensitivity?: string
          auto_pause_workouts?: boolean
        }
        Update: {
          workout_reminders?: boolean
          achievement_notifications?: boolean
          social_notifications?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          show_activity_feed?: boolean
          allow_friend_requests?: boolean
          share_progress?: boolean
          voice_guidance?: boolean
          high_contrast?: boolean
          text_size?: string
          camera_position?: string
          pose_detection_sensitivity?: string
          auto_pause_workouts?: boolean
        }
      }
      
      exercises: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          instructions: string[] | null
          common_mistakes: string[] | null
          tips: string[] | null
          category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core' | 'upper_body' | 'lower_body' | 'full_body'
          muscle_groups: string[] | null
          equipment_required: string[] | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          thumbnail_url: string | null
          demo_video_url: string | null
          demo_gif_url: string | null
          youtube_tutorial_id: string | null
          estimated_calories_per_rep: number | null
          estimated_duration_seconds: number | null
          default_reps: number | null
          default_sets: number | null
          rest_time_seconds: number
          pose_detection_enabled: boolean
          key_points: string[] | null
          form_criteria: Json | null
          times_performed: number
          average_rating: number
          total_ratings: number
          is_active: boolean
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          instructions?: string[] | null
          common_mistakes?: string[] | null
          tips?: string[] | null
          category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core' | 'upper_body' | 'lower_body' | 'full_body'
          muscle_groups?: string[] | null
          equipment_required?: string[] | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          thumbnail_url?: string | null
          demo_video_url?: string | null
          demo_gif_url?: string | null
          youtube_tutorial_id?: string | null
          estimated_calories_per_rep?: number | null
          estimated_duration_seconds?: number | null
          default_reps?: number | null
          default_sets?: number | null
          rest_time_seconds?: number
          pose_detection_enabled?: boolean
          key_points?: string[] | null
          form_criteria?: Json | null
          is_active?: boolean
          is_premium?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          instructions?: string[] | null
          common_mistakes?: string[] | null
          tips?: string[] | null
          category?: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core' | 'upper_body' | 'lower_body' | 'full_body'
          muscle_groups?: string[] | null
          equipment_required?: string[] | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          thumbnail_url?: string | null
          demo_video_url?: string | null
          demo_gif_url?: string | null
          youtube_tutorial_id?: string | null
          estimated_calories_per_rep?: number | null
          estimated_duration_seconds?: number | null
          default_reps?: number | null
          default_sets?: number | null
          rest_time_seconds?: number
          pose_detection_enabled?: boolean
          key_points?: string[] | null
          form_criteria?: Json | null
          is_active?: boolean
          is_premium?: boolean
        }
      }
      
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          session_type: 'quick' | 'custom' | 'guided' | 'challenge' | null
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          paused_duration_seconds: number
          total_exercises: number
          total_reps: number
          total_calories_burned: number
          average_form_score: number | null
          status: 'in_progress' | 'paused' | 'completed' | 'abandoned'
          notes: string | null
          mood_before: string | null
          mood_after: string | null
          perceived_difficulty: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title?: string | null
          session_type?: 'quick' | 'custom' | 'guided' | 'challenge' | null
          started_at: string
          ended_at?: string | null
          duration_seconds?: number | null
          paused_duration_seconds?: number
          total_exercises?: number
          total_reps?: number
          total_calories_burned?: number
          average_form_score?: number | null
          status?: 'in_progress' | 'paused' | 'completed' | 'abandoned'
          notes?: string | null
          mood_before?: string | null
          mood_after?: string | null
          perceived_difficulty?: number | null
        }
        Update: {
          title?: string | null
          session_type?: 'quick' | 'custom' | 'guided' | 'challenge' | null
          ended_at?: string | null
          duration_seconds?: number | null
          paused_duration_seconds?: number
          total_exercises?: number
          total_reps?: number
          total_calories_burned?: number
          average_form_score?: number | null
          status?: 'in_progress' | 'paused' | 'completed' | 'abandoned'
          notes?: string | null
          mood_before?: string | null
          mood_after?: string | null
          perceived_difficulty?: number | null
        }
      }
      
      exercise_performances: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          user_id: string
          reps_completed: number
          sets_completed: number
          duration_seconds: number | null
          weight_used: number | null
          form_scores: number[] | null
          average_form_score: number | null
          best_form_score: number | null
          worst_form_score: number | null
          pose_data: Json | null
          form_issues: string[] | null
          corrections_needed: number
          calories_burned: number | null
          is_personal_best: boolean
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          session_id: string
          exercise_id: string
          user_id: string
          reps_completed?: number
          sets_completed?: number
          duration_seconds?: number | null
          weight_used?: number | null
          form_scores?: number[] | null
          average_form_score?: number | null
          best_form_score?: number | null
          worst_form_score?: number | null
          pose_data?: Json | null
          form_issues?: string[] | null
          corrections_needed?: number
          calories_burned?: number | null
          is_personal_best?: boolean
          started_at: string
          ended_at?: string | null
        }
        Update: {
          reps_completed?: number
          sets_completed?: number
          duration_seconds?: number | null
          weight_used?: number | null
          form_scores?: number[] | null
          average_form_score?: number | null
          best_form_score?: number | null
          worst_form_score?: number | null
          pose_data?: Json | null
          form_issues?: string[] | null
          corrections_needed?: number
          calories_burned?: number | null
          is_personal_best?: boolean
          ended_at?: string | null
        }
      }
      
      achievements: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          badge_image_url: string | null
          category: 'milestone' | 'streak' | 'performance' | 'social' | 'special' | null
          tier: 'bronze' | 'silver' | 'gold' | 'platinum'
          criteria_type: string
          criteria_value: number
          criteria_params: Json | null
          xp_reward: number
          is_active: boolean
          is_hidden: boolean
          display_order: number | null
          created_at: string
        }
        Insert: {
          name: string
          description?: string | null
          icon?: string | null
          badge_image_url?: string | null
          category?: 'milestone' | 'streak' | 'performance' | 'social' | 'special' | null
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          criteria_type: string
          criteria_value: number
          criteria_params?: Json | null
          xp_reward?: number
          is_active?: boolean
          is_hidden?: boolean
          display_order?: number | null
        }
        Update: {
          name?: string
          description?: string | null
          icon?: string | null
          badge_image_url?: string | null
          category?: 'milestone' | 'streak' | 'performance' | 'social' | 'special' | null
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          criteria_type?: string
          criteria_value?: number
          criteria_params?: Json | null
          xp_reward?: number
          is_active?: boolean
          is_hidden?: boolean
          display_order?: number | null
        }
      }
      
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'achievement' | 'friend_request' | 'challenge_invite' | 'workout_reminder' | 'comment' | 'like' | 'milestone' | 'system'
          title: string
          message: string | null
          related_user_id: string | null
          related_post_id: string | null
          related_challenge_id: string | null
          action_url: string | null
          action_label: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          type: 'achievement' | 'friend_request' | 'challenge_invite' | 'workout_reminder' | 'comment' | 'like' | 'milestone' | 'system'
          title: string
          message?: string | null
          related_user_id?: string | null
          related_post_id?: string | null
          related_challenge_id?: string | null
          action_url?: string | null
          action_label?: string | null
          is_read?: boolean
          read_at?: string | null
        }
        Update: {
          is_read?: boolean
          read_at?: string | null
        }
      }
      
      daily_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          workouts_completed: number
          total_duration_seconds: number
          total_exercises: number
          total_reps: number
          total_calories_burned: number
          average_form_score: number | null
          workout_goal_met: boolean
          streak_day: number
          weight_kg: number | null
          body_fat_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          date: string
          workouts_completed?: number
          total_duration_seconds?: number
          total_exercises?: number
          total_reps?: number
          total_calories_burned?: number
          average_form_score?: number | null
          workout_goal_met?: boolean
          streak_day?: number
          weight_kg?: number | null
          body_fat_percentage?: number | null
        }
        Update: {
          workouts_completed?: number
          total_duration_seconds?: number
          total_exercises?: number
          total_reps?: number
          total_calories_burned?: number
          average_form_score?: number | null
          workout_goal_met?: boolean
          streak_day?: number
          weight_kg?: number | null
          body_fat_percentage?: number | null
        }
      }

      community_posts: {
        Row: {
          id: string
          user_id: string
          post_type: 'workout' | 'achievement' | 'progress' | 'thought' | 'challenge_completion'
          content: string | null
          media_urls: string[] | null
          session_id: string | null
          achievement_id: string | null
          likes_count: number
          comments_count: number
          visibility: 'public' | 'friends' | 'private'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          post_type: 'workout' | 'achievement' | 'progress' | 'thought' | 'challenge_completion'
          content?: string | null
          media_urls?: string[] | null
          session_id?: string | null
          achievement_id?: string | null
          likes_count?: number
          comments_count?: number
          visibility?: 'public' | 'friends' | 'private'
        }
        Update: {
          content?: string | null
          media_urls?: string[] | null
          visibility?: 'public' | 'friends' | 'private'
        }
      }

      tutorials: {
        Row: {
          id: string
          title: string
          description: string | null
          category: 'getting_started' | 'form_tips' | 'workout_plans' | 'nutrition' | 'recovery' | null
          youtube_video_id: string | null
          video_duration_seconds: number | null
          thumbnail_url: string | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
          tags: string[] | null
          related_exercise_ids: string[] | null
          views_count: number
          likes_count: number
          average_rating: number | null
          is_featured: boolean
          is_premium: boolean
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          category?: 'getting_started' | 'form_tips' | 'workout_plans' | 'nutrition' | 'recovery' | null
          youtube_video_id?: string | null
          video_duration_seconds?: number | null
          thumbnail_url?: string | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          tags?: string[] | null
          related_exercise_ids?: string[] | null
          views_count?: number
          likes_count?: number
          average_rating?: number | null
          is_featured?: boolean
          is_premium?: boolean
          display_order?: number | null
        }
        Update: {
          title?: string
          description?: string | null
          category?: 'getting_started' | 'form_tips' | 'workout_plans' | 'nutrition' | 'recovery' | null
          youtube_video_id?: string | null
          video_duration_seconds?: number | null
          thumbnail_url?: string | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          tags?: string[] | null
          related_exercise_ids?: string[] | null
          is_featured?: boolean
          is_premium?: boolean
          display_order?: number | null
        }
      }
    }
    
    Functions: {
      get_user_workout_stats: {
        Args: {
          user_uuid: string
          days_back?: number
        }
        Returns: {
          total_workouts: number
          total_duration_minutes: number
          total_calories: number
          average_form_score: number
          total_exercises: number
          improvement_percentage: number
        }[]
      }
      get_recommended_exercises: {
        Args: {
          user_uuid: string
          limit_count?: number
        }
        Returns: {
          exercise_id: string
          name: string
          category: string
          difficulty_level: string
          recommendation_score: number
        }[]
      }
      get_global_leaderboard: {
        Args: {
          limit_count?: number
        }
        Returns: {
          rank: number
          user_id: string
          full_name: string
          avatar_url: string
          xp_points: number
          level: number
          current_streak: number
          total_workouts: number
        }[]
      }
      get_friends_leaderboard: {
        Args: {
          user_uuid: string
        }
        Returns: {
          rank: number
          user_id: string
          full_name: string
          avatar_url: string
          xp_points: number
          level: number
          current_streak: number
        }[]
      }
    }
  }
}

