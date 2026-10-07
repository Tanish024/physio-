-- =====================================================
-- COMPLETE FITNESS APP DATABASE SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- USER PROFILES & AUTHENTICATION
-- =====================================================

-- User profiles with fitness information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Physical information
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Fitness information
    fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
    fitness_goals TEXT[], -- e.g., ['weight_loss', 'muscle_gain', 'endurance']
    target_weight_kg DECIMAL(5,2),
    weekly_workout_goal INTEGER DEFAULT 3,
    
    -- Preferences
    preferred_workout_time TEXT, -- e.g., 'morning', 'afternoon', 'evening'
    preferred_workout_duration INTEGER, -- in minutes
    theme_preference TEXT DEFAULT 'system',
    notification_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    
    -- Gamification
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_workout_date DATE,
    
    -- Privacy
    profile_visibility TEXT CHECK (profile_visibility IN ('public', 'friends', 'private')) DEFAULT 'public',
    show_on_leaderboard BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    onboarding_completed BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings (separate table for extensibility)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Notification preferences
    workout_reminders BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    social_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    
    -- Privacy settings
    show_activity_feed BOOLEAN DEFAULT true,
    allow_friend_requests BOOLEAN DEFAULT true,
    share_progress BOOLEAN DEFAULT true,
    
    -- Accessibility
    voice_guidance BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    text_size TEXT DEFAULT 'medium',
    
    -- Advanced
    camera_position TEXT DEFAULT 'front',
    pose_detection_sensitivity TEXT DEFAULT 'medium',
    auto_pause_workouts BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =====================================================
-- EXERCISE LIBRARY
-- =====================================================

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    instructions TEXT[],
    common_mistakes TEXT[],
    tips TEXT[],
    
    -- Categorization
    category TEXT NOT NULL CHECK (category IN (
        'strength', 'cardio', 'flexibility', 'balance', 
        'core', 'upper_body', 'lower_body', 'full_body'
    )),
    muscle_groups TEXT[], -- e.g., ['chest', 'triceps', 'shoulders']
    equipment_required TEXT[], -- e.g., ['dumbbells', 'mat']
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Media
    thumbnail_url TEXT,
    demo_video_url TEXT,
    demo_gif_url TEXT,
    youtube_tutorial_id TEXT,
    
    -- Metrics
    estimated_calories_per_rep DECIMAL(5,2),
    estimated_duration_seconds INTEGER,
    default_reps INTEGER,
    default_sets INTEGER,
    rest_time_seconds INTEGER DEFAULT 60,
    
    -- AI/Pose detection
    pose_detection_enabled BOOLEAN DEFAULT true,
    key_points TEXT[], -- Body keypoints to track
    form_criteria JSONB, -- JSON with form requirements
    
    -- Popularity & ratings
    times_performed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise variations (e.g., push-up variations)
CREATE TABLE IF NOT EXISTS exercise_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_modifier TEXT CHECK (difficulty_modifier IN ('easier', 'harder', 'different')),
    instructions_diff TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's exercise bookmarks/favorites
CREATE TABLE IF NOT EXISTS exercise_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- User exercise ratings
CREATE TABLE IF NOT EXISTS exercise_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- =====================================================
-- WORKOUT SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Session info
    title TEXT,
    session_type TEXT CHECK (session_type IN ('quick', 'custom', 'guided', 'challenge')),
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    paused_duration_seconds INTEGER DEFAULT 0,
    
    -- Metrics
    total_exercises INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    total_calories_burned DECIMAL(7,2) DEFAULT 0,
    average_form_score DECIMAL(5,2),
    
    -- Status
    status TEXT CHECK (status IN ('in_progress', 'paused', 'completed', 'abandoned')) DEFAULT 'in_progress',
    
    -- Additional data
    notes TEXT,
    mood_before TEXT,
    mood_after TEXT,
    perceived_difficulty INTEGER CHECK (perceived_difficulty >= 1 AND perceived_difficulty <= 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual exercise performances within sessions
CREATE TABLE IF NOT EXISTS exercise_performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Performance data
    reps_completed INTEGER DEFAULT 0,
    sets_completed INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    weight_used DECIMAL(6,2), -- if applicable
    
    -- Form analysis
    form_scores DECIMAL(5,2)[], -- Array of scores per rep
    average_form_score DECIMAL(5,2),
    best_form_score DECIMAL(5,2),
    worst_form_score DECIMAL(5,2),
    
    -- AI feedback data
    pose_data JSONB, -- Detailed pose detection data
    form_issues TEXT[], -- e.g., ['elbow_flaring', 'incomplete_range']
    corrections_needed INTEGER DEFAULT 0,
    
    -- Metrics
    calories_burned DECIMAL(6,2),
    is_personal_best BOOLEAN DEFAULT false,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time form feedback (for live sessions)
CREATE TABLE IF NOT EXISTS live_form_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    performance_id UUID REFERENCES exercise_performances(id) ON DELETE CASCADE,
    
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    rep_number INTEGER,
    form_score DECIMAL(5,2),
    feedback_message TEXT,
    issue_type TEXT, -- e.g., 'posture', 'range_of_motion', 'speed'
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    
    pose_snapshot JSONB -- Keypoint positions at this moment
);

-- =====================================================
-- PROGRESS TRACKING
-- =====================================================

-- Daily summaries
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Workout metrics
    workouts_completed INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    total_calories_burned DECIMAL(7,2) DEFAULT 0,
    average_form_score DECIMAL(5,2),
    
    -- Streaks and goals
    workout_goal_met BOOLEAN DEFAULT false,
    streak_day INTEGER DEFAULT 0,
    
    -- Body metrics (if logged)
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Personal records
CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    
    record_type TEXT CHECK (record_type IN ('max_reps', 'max_weight', 'best_form', 'fastest_time')),
    value DECIMAL(10,2) NOT NULL,
    session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    
    previous_record DECIMAL(10,2),
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, exercise_id, record_type)
);

-- Body measurements tracking
CREATE TABLE IF NOT EXISTS body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,2),
    
    -- Circumference measurements (in cm)
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hips_cm DECIMAL(5,2),
    bicep_left_cm DECIMAL(5,2),
    bicep_right_cm DECIMAL(5,2),
    thigh_left_cm DECIMAL(5,2),
    thigh_right_cm DECIMAL(5,2),
    
    notes TEXT,
    photo_urls TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- =====================================================
-- ACHIEVEMENTS & GAMIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Icon identifier
    badge_image_url TEXT,
    
    -- Categorization
    category TEXT CHECK (category IN ('milestone', 'streak', 'performance', 'social', 'special')),
    tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
    
    -- Unlock criteria
    criteria_type TEXT NOT NULL, -- e.g., 'workouts_completed', 'streak_days', 'total_reps'
    criteria_value INTEGER NOT NULL,
    criteria_params JSONB, -- Additional parameters
    
    -- Rewards
    xp_reward INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false, -- Hidden until unlocked
    
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocked badges)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    progress_when_unlocked INTEGER,
    
    -- Social
    is_featured BOOLEAN DEFAULT false,
    shared_at TIMESTAMPTZ,
    
    UNIQUE(user_id, achievement_id)
);

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    date DATE NOT NULL UNIQUE,
    
    -- Challenge details
    title TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT CHECK (challenge_type IN ('reps', 'duration', 'exercises', 'form_score')),
    target_value INTEGER NOT NULL,
    
    -- Constraints
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    exercise_category TEXT,
    
    -- Rewards
    xp_reward INTEGER DEFAULT 50,
    bonus_xp INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User challenge completions
CREATE TABLE IF NOT EXISTS user_challenge_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
    
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    progress_value INTEGER,
    
    UNIQUE(user_id, challenge_id)
);

-- =====================================================
-- SOCIAL FEATURES
-- =====================================================

-- Friend connections
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Community posts/activity feed
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    post_type TEXT CHECK (post_type IN ('workout', 'achievement', 'progress', 'thought', 'challenge_completion')),
    
    content TEXT,
    media_urls TEXT[],
    
    -- Related data
    session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE SET NULL,
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Privacy
    visibility TEXT CHECK (visibility IN ('public', 'friends', 'private')) DEFAULT 'friends',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout challenges between users
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    challenge_type TEXT CHECK (challenge_type IN ('total_workouts', 'specific_exercise', 'calories', 'streak')),
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    
    target_value INTEGER NOT NULL,
    duration_days INTEGER DEFAULT 7,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (creator_id != challenger_id)
);

-- Challenge progress
CREATE TABLE IF NOT EXISTS challenge_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES user_challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    current_value INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(challenge_id, user_id)
);

-- =====================================================
-- TUTORIALS & LEARNING
-- =====================================================

CREATE TABLE IF NOT EXISTS tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('getting_started', 'form_tips', 'workout_plans', 'nutrition', 'recovery')),
    
    -- Content
    youtube_video_id TEXT,
    video_duration_seconds INTEGER,
    thumbnail_url TEXT,
    
    -- Metadata
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[],
    
    -- Related exercises
    related_exercise_ids UUID[],
    
    -- Engagement
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    
    display_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tutorial progress
CREATE TABLE IF NOT EXISTS user_tutorial_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE,
    
    watched_duration_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    bookmarked BOOLEAN DEFAULT false,
    
    last_watched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    UNIQUE(user_id, tutorial_id)
);

-- =====================================================
-- ANALYTICS & TRACKING
-- =====================================================

-- Website analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    event_type TEXT NOT NULL, -- e.g., 'page_view', 'exercise_started', 'achievement_unlocked'
    event_category TEXT,
    event_data JSONB,
    
    -- Session tracking
    session_id TEXT,
    
    -- Page/context
    page_url TEXT,
    referrer TEXT,
    
    -- Device info
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homepage dynamic content
CREATE TABLE IF NOT EXISTS homepage_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    content_type TEXT CHECK (content_type IN ('testimonial', 'success_story', 'statistic', 'banner', 'announcement')),
    
    title TEXT,
    content TEXT,
    
    -- Media
    image_url TEXT,
    author_name TEXT,
    author_avatar TEXT,
    
    -- For statistics
    stat_label TEXT,
    stat_value TEXT,
    stat_trend TEXT,
    
    -- Display
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System-wide statistics (cached)
CREATE TABLE IF NOT EXISTS system_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    stat_key TEXT UNIQUE NOT NULL,
    stat_value TEXT NOT NULL,
    stat_label TEXT,
    
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN (
        'achievement', 'friend_request', 'challenge_invite', 
        'workout_reminder', 'comment', 'like', 'milestone', 'system'
    )),
    
    title TEXT NOT NULL,
    message TEXT,
    
    -- Related entities
    related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    related_post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
    related_challenge_id UUID REFERENCES user_challenges(id) ON DELETE SET NULL,
    
    -- Action link
    action_url TEXT,
    action_label TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_fitness_level ON profiles(fitness_level);
CREATE INDEX idx_profiles_last_workout_date ON profiles(last_workout_date);

-- Exercises
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_exercises_is_active ON exercises(is_active);
CREATE INDEX idx_exercises_popularity ON exercises(times_performed DESC);

-- Workout Sessions
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at DESC);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);

-- Exercise Performances
CREATE INDEX idx_exercise_performances_session_id ON exercise_performances(session_id);
CREATE INDEX idx_exercise_performances_exercise_id ON exercise_performances(exercise_id);
CREATE INDEX idx_exercise_performances_user_id ON exercise_performances(user_id);

-- Daily Stats
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);
CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);

-- Friendships
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Community Posts
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_visibility ON community_posts(visibility);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Analytics
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Comments
COMMENT ON TABLE profiles IS 'User profiles with fitness data and preferences';
COMMENT ON TABLE exercises IS 'Exercise library with AI pose detection support';
COMMENT ON TABLE workout_sessions IS 'Individual workout sessions with timing and metrics';
COMMENT ON TABLE exercise_performances IS 'Per-exercise performance data within sessions';
COMMENT ON TABLE achievements IS 'Gamification achievements and badges';
COMMENT ON TABLE daily_stats IS 'Aggregated daily workout statistics';
COMMENT ON TABLE community_posts IS 'Social feed posts from users';
COMMENT ON TABLE tutorials IS 'Educational video content and guides';

