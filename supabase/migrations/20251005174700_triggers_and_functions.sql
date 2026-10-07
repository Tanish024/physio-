-- =====================================================
-- DATABASE TRIGGERS AND AUTOMATED FUNCTIONS
-- =====================================================

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USER PROFILE TRIGGERS
-- =====================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW());
    
    -- Create user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update profile updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_active_at on profile access
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_last_active
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.last_active_at IS DISTINCT FROM NEW.last_active_at OR 
          OLD.last_active_at < NOW() - INTERVAL '5 minutes')
    EXECUTE FUNCTION update_last_active();

-- =====================================================
-- STREAK CALCULATION
-- =====================================================

-- Calculate and update user streaks
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID, workout_date DATE)
RETURNS VOID AS $$
DECLARE
    last_date DATE;
    new_streak INTEGER;
BEGIN
    -- Get the user's last workout date
    SELECT last_workout_date INTO last_date
    FROM profiles
    WHERE id = user_uuid;
    
    -- Calculate new streak
    IF last_date IS NULL THEN
        new_streak := 1;
    ELSIF workout_date = last_date THEN
        -- Same day, no change
        RETURN;
    ELSIF workout_date = last_date + INTERVAL '1 day' THEN
        -- Consecutive day
        SELECT current_streak + 1 INTO new_streak
        FROM profiles
        WHERE id = user_uuid;
    ELSE
        -- Streak broken
        new_streak := 1;
    END IF;
    
    -- Update profile
    UPDATE profiles
    SET 
        current_streak = new_streak,
        longest_streak = GREATEST(longest_streak, new_streak),
        last_workout_date = workout_date
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak when workout is completed
CREATE OR REPLACE FUNCTION handle_workout_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Update streak
        PERFORM update_user_streak(NEW.user_id, DATE(NEW.ended_at));
        
        -- Award XP
        UPDATE profiles
        SET xp_points = xp_points + (10 + (NEW.total_exercises * 5))
        WHERE id = NEW.user_id;
        
        -- Check for level up (every 100 XP)
        UPDATE profiles
        SET level = (xp_points / 100) + 1
        WHERE id = NEW.user_id;
        
        -- Update or create daily stats
        INSERT INTO daily_stats (user_id, date, workouts_completed, total_duration_seconds, total_exercises, total_reps, total_calories_burned, average_form_score)
        VALUES (
            NEW.user_id,
            DATE(NEW.ended_at),
            1,
            NEW.duration_seconds,
            NEW.total_exercises,
            NEW.total_reps,
            NEW.total_calories_burned,
            NEW.average_form_score
        )
        ON CONFLICT (user_id, date)
        DO UPDATE SET
            workouts_completed = daily_stats.workouts_completed + 1,
            total_duration_seconds = daily_stats.total_duration_seconds + EXCLUDED.total_duration_seconds,
            total_exercises = daily_stats.total_exercises + EXCLUDED.total_exercises,
            total_reps = daily_stats.total_reps + EXCLUDED.total_reps,
            total_calories_burned = daily_stats.total_calories_burned + EXCLUDED.total_calories_burned,
            average_form_score = (daily_stats.average_form_score + EXCLUDED.average_form_score) / 2,
            updated_at = NOW();
        
        -- Check achievements
        PERFORM check_user_achievements(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_workout_completed
    AFTER INSERT OR UPDATE ON workout_sessions
    FOR EACH ROW EXECUTE FUNCTION handle_workout_completion();

-- =====================================================
-- ACHIEVEMENT SYSTEM
-- =====================================================

-- Check and unlock achievements for user
CREATE OR REPLACE FUNCTION check_user_achievements(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    achievement_record RECORD;
    user_stat_value INTEGER;
    criteria_met BOOLEAN;
BEGIN
    FOR achievement_record IN 
        SELECT a.* 
        FROM achievements a
        WHERE a.is_active = true
        AND a.id NOT IN (
            SELECT achievement_id 
            FROM user_achievements 
            WHERE user_id = user_uuid
        )
    LOOP
        criteria_met := false;
        
        -- Check different criteria types
        CASE achievement_record.criteria_type
            WHEN 'workouts_completed' THEN
                SELECT COUNT(*) INTO user_stat_value
                FROM workout_sessions
                WHERE user_id = user_uuid AND status = 'completed';
                
                criteria_met := user_stat_value >= achievement_record.criteria_value;
                
            WHEN 'streak_days' THEN
                SELECT current_streak INTO user_stat_value
                FROM profiles
                WHERE id = user_uuid;
                
                criteria_met := user_stat_value >= achievement_record.criteria_value;
                
            WHEN 'total_reps' THEN
                SELECT COALESCE(SUM(total_reps), 0) INTO user_stat_value
                FROM workout_sessions
                WHERE user_id = user_uuid AND status = 'completed';
                
                criteria_met := user_stat_value >= achievement_record.criteria_value;
                
            WHEN 'total_exercises' THEN
                SELECT COUNT(*) INTO user_stat_value
                FROM exercise_performances
                WHERE user_id = user_uuid;
                
                criteria_met := user_stat_value >= achievement_record.criteria_value;
                
            WHEN 'perfect_form_count' THEN
                SELECT COUNT(*) INTO user_stat_value
                FROM exercise_performances
                WHERE user_id = user_uuid AND average_form_score >= 95.0;
                
                criteria_met := user_stat_value >= achievement_record.criteria_value;
                
            WHEN 'friends_count' THEN
                SELECT COUNT(*) INTO user_stat_value
                FROM friendships
                WHERE (user_id = user_uuid OR friend_id = user_uuid) AND status = 'accepted';
                
                criteria_met := user_stat_value >= achievement_record.criteria_value;
        END CASE;
        
        -- If criteria met, unlock achievement
        IF criteria_met THEN
            INSERT INTO user_achievements (user_id, achievement_id, progress_when_unlocked)
            VALUES (user_uuid, achievement_record.id, user_stat_value);
            
            -- Award XP
            UPDATE profiles
            SET xp_points = xp_points + achievement_record.xp_reward
            WHERE id = user_uuid;
            
            -- Create notification
            INSERT INTO notifications (user_id, type, title, message)
            VALUES (
                user_uuid,
                'achievement',
                'Achievement Unlocked! 🎉',
                'You unlocked: ' || achievement_record.name
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXERCISE RATING SYSTEM
-- =====================================================

-- Update exercise average rating when user rates
CREATE OR REPLACE FUNCTION update_exercise_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE exercises
    SET 
        total_ratings = (
            SELECT COUNT(*) 
            FROM exercise_ratings 
            WHERE exercise_id = NEW.exercise_id
        ),
        average_rating = (
            SELECT AVG(rating) 
            FROM exercise_ratings 
            WHERE exercise_id = NEW.exercise_id
        ),
        updated_at = NOW()
    WHERE id = NEW.exercise_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_exercise_rated
    AFTER INSERT OR UPDATE ON exercise_ratings
    FOR EACH ROW EXECUTE FUNCTION update_exercise_rating();

-- =====================================================
-- PERFORMANCE TRACKING
-- =====================================================

-- Update exercise popularity counter
CREATE OR REPLACE FUNCTION increment_exercise_popularity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE exercises
    SET 
        times_performed = times_performed + 1,
        updated_at = NOW()
    WHERE id = NEW.exercise_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_exercise_performed
    AFTER INSERT ON exercise_performances
    FOR EACH ROW EXECUTE FUNCTION increment_exercise_popularity();

-- Check and update personal records
CREATE OR REPLACE FUNCTION check_personal_records()
RETURNS TRIGGER AS $$
DECLARE
    current_max_reps DECIMAL(10,2);
    current_best_form DECIMAL(10,2);
BEGIN
    -- Check max reps record
    SELECT value INTO current_max_reps
    FROM personal_records
    WHERE user_id = NEW.user_id 
        AND exercise_id = NEW.exercise_id 
        AND record_type = 'max_reps';
    
    IF current_max_reps IS NULL OR NEW.reps_completed > current_max_reps THEN
        INSERT INTO personal_records (user_id, exercise_id, record_type, value, previous_record, session_id)
        VALUES (NEW.user_id, NEW.exercise_id, 'max_reps', NEW.reps_completed, current_max_reps, NEW.session_id)
        ON CONFLICT (user_id, exercise_id, record_type)
        DO UPDATE SET 
            value = NEW.reps_completed,
            previous_record = personal_records.value,
            session_id = NEW.session_id,
            achieved_at = NOW();
        
        -- Mark as personal best
        UPDATE exercise_performances
        SET is_personal_best = true
        WHERE id = NEW.id;
        
        -- Send notification
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
            NEW.user_id,
            'milestone',
            'New Personal Record! 🏆',
            'You hit a new max reps record!'
        );
    END IF;
    
    -- Check best form record
    SELECT value INTO current_best_form
    FROM personal_records
    WHERE user_id = NEW.user_id 
        AND exercise_id = NEW.exercise_id 
        AND record_type = 'best_form';
    
    IF current_best_form IS NULL OR NEW.average_form_score > current_best_form THEN
        INSERT INTO personal_records (user_id, exercise_id, record_type, value, previous_record, session_id)
        VALUES (NEW.user_id, NEW.exercise_id, 'best_form', NEW.average_form_score, current_best_form, NEW.session_id)
        ON CONFLICT (user_id, exercise_id, record_type)
        DO UPDATE SET 
            value = NEW.average_form_score,
            previous_record = personal_records.value,
            session_id = NEW.session_id,
            achieved_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_performance_completed
    AFTER INSERT ON exercise_performances
    FOR EACH ROW EXECUTE FUNCTION check_personal_records();

-- =====================================================
-- SOCIAL FEATURES
-- =====================================================

-- Update post engagement counters
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
        
        -- Notify post author
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_post_id)
        SELECT 
            cp.user_id,
            'like',
            'New Like',
            (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' liked your post',
            NEW.user_id,
            NEW.post_id
        FROM community_posts cp
        WHERE cp.id = NEW.post_id AND cp.user_id != NEW.user_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_like_changed
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
        
        -- Notify post author
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_post_id)
        SELECT 
            cp.user_id,
            'comment',
            'New Comment',
            (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' commented on your post',
            NEW.user_id,
            NEW.post_id
        FROM community_posts cp
        WHERE cp.id = NEW.post_id AND cp.user_id != NEW.user_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_comment_changed
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Handle friend request notifications
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending') THEN
        INSERT INTO notifications (user_id, type, title, message, related_user_id)
        SELECT 
            NEW.friend_id,
            'friend_request',
            'New Friend Request',
            (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' sent you a friend request',
            NEW.user_id;
    ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (user_id, type, title, message, related_user_id)
        SELECT 
            NEW.user_id,
            'friend_request',
            'Friend Request Accepted',
            (SELECT full_name FROM profiles WHERE id = NEW.friend_id) || ' accepted your friend request',
            NEW.friend_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_friendship_changed
    AFTER INSERT OR UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION notify_friend_request();

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get user workout statistics
CREATE OR REPLACE FUNCTION get_user_workout_stats(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_workouts BIGINT,
    total_duration_minutes INTEGER,
    total_calories DECIMAL,
    average_form_score DECIMAL,
    total_exercises BIGINT,
    improvement_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT ws.id)::BIGINT,
        (SUM(ws.duration_seconds) / 60)::INTEGER,
        SUM(ws.total_calories_burned)::DECIMAL,
        AVG(ws.average_form_score)::DECIMAL,
        SUM(ws.total_exercises)::BIGINT,
        (
            CASE 
                WHEN COUNT(*) > 1 THEN
                    ((AVG(CASE WHEN ws.started_at > NOW() - INTERVAL '7 days' THEN ws.average_form_score END) - 
                      AVG(CASE WHEN ws.started_at <= NOW() - INTERVAL '7 days' THEN ws.average_form_score END)) / 
                     AVG(CASE WHEN ws.started_at <= NOW() - INTERVAL '7 days' THEN ws.average_form_score END)) * 100
                ELSE 0
            END
        )::DECIMAL as improvement
    FROM workout_sessions ws
    WHERE ws.user_id = user_uuid
        AND ws.status = 'completed'
        AND ws.started_at > NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended exercises for user
CREATE OR REPLACE FUNCTION get_recommended_exercises(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    exercise_id UUID,
    name TEXT,
    category TEXT,
    difficulty_level TEXT,
    recommendation_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_profile AS (
        SELECT fitness_level, fitness_goals
        FROM profiles
        WHERE id = user_uuid
    ),
    user_history AS (
        SELECT DISTINCT ep.exercise_id
        FROM exercise_performances ep
        WHERE ep.user_id = user_uuid
    )
    SELECT 
        e.id,
        e.name,
        e.category,
        e.difficulty_level,
        (
            -- Score based on popularity
            (e.times_performed::DECIMAL / NULLIF((SELECT MAX(times_performed) FROM exercises), 0)) * 30 +
            -- Score based on rating
            (e.average_rating / 5.0) * 20 +
            -- Bonus for matching user fitness level
            (CASE WHEN e.difficulty_level = (SELECT fitness_level FROM user_profile) THEN 30 ELSE 0 END) +
            -- Penalty for already performed exercises
            (CASE WHEN e.id IN (SELECT exercise_id FROM user_history) THEN -20 ELSE 20 END)
        )::DECIMAL as score
    FROM exercises e
    WHERE e.is_active = true
    ORDER BY score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update system statistics (to be called periodically)
CREATE OR REPLACE FUNCTION update_system_stats()
RETURNS VOID AS $$
BEGIN
    -- Total users
    INSERT INTO system_statistics (stat_key, stat_value, stat_label)
    SELECT 'total_users', COUNT(*)::TEXT, 'Total Users'
    FROM profiles
    ON CONFLICT (stat_key) 
    DO UPDATE SET stat_value = EXCLUDED.stat_value, last_calculated = NOW();
    
    -- Total workouts completed
    INSERT INTO system_statistics (stat_key, stat_value, stat_label)
    SELECT 'total_workouts', COUNT(*)::TEXT, 'Workouts Completed'
    FROM workout_sessions
    WHERE status = 'completed'
    ON CONFLICT (stat_key) 
    DO UPDATE SET stat_value = EXCLUDED.stat_value, last_calculated = NOW();
    
    -- Total exercises in library
    INSERT INTO system_statistics (stat_key, stat_value, stat_label)
    SELECT 'total_exercises', COUNT(*)::TEXT, 'Exercises Available'
    FROM exercises
    WHERE is_active = true
    ON CONFLICT (stat_key) 
    DO UPDATE SET stat_value = EXCLUDED.stat_value, last_calculated = NOW();
    
    -- Average user satisfaction (based on exercise ratings)
    INSERT INTO system_statistics (stat_key, stat_value, stat_label)
    SELECT 'avg_satisfaction', ROUND(AVG(rating) * 20)::TEXT || '%', 'User Satisfaction'
    FROM exercise_ratings
    ON CONFLICT (stat_key) 
    DO UPDATE SET stat_value = EXCLUDED.stat_value, last_calculated = NOW();
    
    -- Active users (worked out in last 30 days)
    INSERT INTO system_statistics (stat_key, stat_value, stat_label)
    SELECT 'active_users', COUNT(DISTINCT user_id)::TEXT, 'Active Users'
    FROM workout_sessions
    WHERE started_at > NOW() - INTERVAL '30 days' AND status = 'completed'
    ON CONFLICT (stat_key) 
    DO UPDATE SET stat_value = EXCLUDED.stat_value, last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- LEADERBOARD FUNCTIONS
-- =====================================================

-- Get global leaderboard
CREATE OR REPLACE FUNCTION get_global_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    xp_points INTEGER,
    level INTEGER,
    current_streak INTEGER,
    total_workouts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY p.xp_points DESC) as rank,
        p.id,
        p.full_name,
        p.avatar_url,
        p.xp_points,
        p.level,
        p.current_streak,
        COUNT(ws.id)
    FROM profiles p
    LEFT JOIN workout_sessions ws ON ws.user_id = p.id AND ws.status = 'completed'
    WHERE p.show_on_leaderboard = true
    GROUP BY p.id
    ORDER BY p.xp_points DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Get friends leaderboard
CREATE OR REPLACE FUNCTION get_friends_leaderboard(user_uuid UUID)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    xp_points INTEGER,
    level INTEGER,
    current_streak INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH friend_ids AS (
        SELECT friend_id as id FROM friendships WHERE user_id = user_uuid AND status = 'accepted'
        UNION
        SELECT user_id as id FROM friendships WHERE friend_id = user_uuid AND status = 'accepted'
        UNION
        SELECT user_uuid as id
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY p.xp_points DESC),
        p.id,
        p.full_name,
        p.avatar_url,
        p.xp_points,
        p.level,
        p.current_streak
    FROM profiles p
    WHERE p.id IN (SELECT id FROM friend_ids)
    ORDER BY p.xp_points DESC;
END;
$$ LANGUAGE plpgsql;

