-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_form_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can view public profiles
CREATE POLICY "Users can view public profiles"
    ON profiles FOR SELECT
    USING (profile_visibility = 'public');

-- Users can view friends' profiles
CREATE POLICY "Users can view friends profiles"
    ON profiles FOR SELECT
    USING (
        profile_visibility = 'friends' AND
        id IN (
            SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but needed for completeness)
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER SETTINGS POLICIES
-- =====================================================

CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- EXERCISES POLICIES (Public Read)
-- =====================================================

-- Everyone can view active exercises
CREATE POLICY "Anyone can view active exercises"
    ON exercises FOR SELECT
    USING (is_active = true);

-- Only authenticated users can view all exercises
CREATE POLICY "Authenticated users can view all exercises"
    ON exercises FOR SELECT
    USING (auth.role() = 'authenticated');

-- =====================================================
-- EXERCISE VARIATIONS POLICIES
-- =====================================================

CREATE POLICY "Anyone can view exercise variations"
    ON exercise_variations FOR SELECT
    USING (true);

-- =====================================================
-- EXERCISE BOOKMARKS POLICIES
-- =====================================================

CREATE POLICY "Users can view own bookmarks"
    ON exercise_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
    ON exercise_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
    ON exercise_bookmarks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON exercise_bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- EXERCISE RATINGS POLICIES
-- =====================================================

CREATE POLICY "Users can view all ratings"
    ON exercise_ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own ratings"
    ON exercise_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
    ON exercise_ratings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- WORKOUT SESSIONS POLICIES
-- =====================================================

CREATE POLICY "Users can view own workout sessions"
    ON workout_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view friends' completed workouts
CREATE POLICY "Users can view friends workouts"
    ON workout_sessions FOR SELECT
    USING (
        status = 'completed' AND
        user_id IN (
            SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "Users can insert own workout sessions"
    ON workout_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
    ON workout_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- EXERCISE PERFORMANCES POLICIES
-- =====================================================

CREATE POLICY "Users can view own exercise performances"
    ON exercise_performances FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise performances"
    ON exercise_performances FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise performances"
    ON exercise_performances FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- LIVE FORM FEEDBACK POLICIES
-- =====================================================

CREATE POLICY "Users can view own live feedback"
    ON live_form_feedback FOR SELECT
    USING (
        performance_id IN (
            SELECT id FROM exercise_performances WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own live feedback"
    ON live_form_feedback FOR INSERT
    WITH CHECK (
        performance_id IN (
            SELECT id FROM exercise_performances WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- DAILY STATS POLICIES
-- =====================================================

CREATE POLICY "Users can view own daily stats"
    ON daily_stats FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view friends' daily stats
CREATE POLICY "Users can view friends daily stats"
    ON daily_stats FOR SELECT
    USING (
        user_id IN (
            SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "System can insert daily stats"
    ON daily_stats FOR INSERT
    WITH CHECK (true); -- Handled by triggers

CREATE POLICY "System can update daily stats"
    ON daily_stats FOR UPDATE
    USING (true); -- Handled by triggers

-- =====================================================
-- PERSONAL RECORDS POLICIES
-- =====================================================

CREATE POLICY "Users can view own personal records"
    ON personal_records FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view friends' personal records
CREATE POLICY "Users can view friends personal records"
    ON personal_records FOR SELECT
    USING (
        user_id IN (
            SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "System can manage personal records"
    ON personal_records FOR ALL
    USING (true); -- Handled by triggers

-- =====================================================
-- BODY MEASUREMENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own body measurements"
    ON body_measurements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body measurements"
    ON body_measurements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body measurements"
    ON body_measurements FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own body measurements"
    ON body_measurements FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- ACHIEVEMENTS POLICIES
-- =====================================================

-- Everyone can view active achievements
CREATE POLICY "Anyone can view active achievements"
    ON achievements FOR SELECT
    USING (is_active = true AND is_hidden = false);

-- Users can view hidden achievements they've unlocked
CREATE POLICY "Users can view unlocked hidden achievements"
    ON achievements FOR SELECT
    USING (
        is_hidden = true AND
        id IN (SELECT achievement_id FROM user_achievements WHERE user_id = auth.uid())
    );

-- =====================================================
-- USER ACHIEVEMENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view friends' achievements
CREATE POLICY "Users can view friends achievements"
    ON user_achievements FOR SELECT
    USING (
        user_id IN (
            SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    );

CREATE POLICY "System can insert user achievements"
    ON user_achievements FOR INSERT
    WITH CHECK (true); -- Handled by triggers

CREATE POLICY "Users can update own achievements"
    ON user_achievements FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DAILY CHALLENGES POLICIES
-- =====================================================

CREATE POLICY "Everyone can view daily challenges"
    ON daily_challenges FOR SELECT
    USING (true);

-- =====================================================
-- USER CHALLENGE COMPLETIONS POLICIES
-- =====================================================

CREATE POLICY "Users can view own challenge completions"
    ON user_challenge_completions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge completions"
    ON user_challenge_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FRIENDSHIPS POLICIES
-- =====================================================

-- Users can view friendships they're part of
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friend requests
CREATE POLICY "Users can send friend requests"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update friendships they're part of
CREATE POLICY "Users can update own friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id)
    WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete friendships they're part of
CREATE POLICY "Users can delete own friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =====================================================
-- COMMUNITY POSTS POLICIES
-- =====================================================

-- Users can view their own posts
CREATE POLICY "Users can view own posts"
    ON community_posts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public posts
CREATE POLICY "Users can view public posts"
    ON community_posts FOR SELECT
    USING (visibility = 'public');

-- Users can view friends' posts
CREATE POLICY "Users can view friends posts"
    ON community_posts FOR SELECT
    USING (
        visibility = 'friends' AND
        user_id IN (
            SELECT friend_id FROM friendships WHERE user_id = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = auth.uid() AND status = 'accepted'
        )
    );

-- Users can create posts
CREATE POLICY "Users can create posts"
    ON community_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
    ON community_posts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
    ON community_posts FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- POST LIKES POLICIES
-- =====================================================

-- Users can view likes on posts they can see
CREATE POLICY "Users can view post likes"
    ON post_likes FOR SELECT
    USING (
        post_id IN (SELECT id FROM community_posts) -- Post visibility handled by community_posts policies
    );

-- Users can like posts
CREATE POLICY "Users can like posts"
    ON post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can unlike posts
CREATE POLICY "Users can unlike posts"
    ON post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- POST COMMENTS POLICIES
-- =====================================================

-- Users can view comments on posts they can see
CREATE POLICY "Users can view post comments"
    ON post_comments FOR SELECT
    USING (
        post_id IN (SELECT id FROM community_posts)
    );

-- Users can create comments
CREATE POLICY "Users can create comments"
    ON post_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
    ON post_comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
    ON post_comments FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- USER CHALLENGES POLICIES
-- =====================================================

-- Users can view challenges they're part of
CREATE POLICY "Users can view own challenges"
    ON user_challenges FOR SELECT
    USING (auth.uid() = creator_id OR auth.uid() = challenger_id);

-- Users can create challenges
CREATE POLICY "Users can create challenges"
    ON user_challenges FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Users can update challenges they're part of
CREATE POLICY "Users can update own challenges"
    ON user_challenges FOR UPDATE
    USING (auth.uid() = creator_id OR auth.uid() = challenger_id)
    WITH CHECK (auth.uid() = creator_id OR auth.uid() = challenger_id);

-- =====================================================
-- CHALLENGE PROGRESS POLICIES
-- =====================================================

-- Users can view progress for challenges they're part of
CREATE POLICY "Users can view challenge progress"
    ON challenge_progress FOR SELECT
    USING (
        challenge_id IN (
            SELECT id FROM user_challenges WHERE creator_id = auth.uid() OR challenger_id = auth.uid()
        )
    );

CREATE POLICY "System can manage challenge progress"
    ON challenge_progress FOR ALL
    USING (true); -- Handled by application logic

-- =====================================================
-- TUTORIALS POLICIES
-- =====================================================

-- Everyone can view active tutorials
CREATE POLICY "Anyone can view active tutorials"
    ON tutorials FOR SELECT
    USING (true); -- Tutorial visibility can be controlled by is_premium flag in app logic

-- =====================================================
-- USER TUTORIAL PROGRESS POLICIES
-- =====================================================

CREATE POLICY "Users can view own tutorial progress"
    ON user_tutorial_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tutorial progress"
    ON user_tutorial_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ANALYTICS EVENTS POLICIES
-- =====================================================

-- Users can insert their own analytics events
CREATE POLICY "Users can track own analytics"
    ON analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only system can read analytics (via service role)
-- No SELECT policy for regular users

-- =====================================================
-- HOMEPAGE CONTENT POLICIES
-- =====================================================

-- Everyone can view active homepage content
CREATE POLICY "Anyone can view homepage content"
    ON homepage_content FOR SELECT
    USING (is_active = true);

-- =====================================================
-- SYSTEM STATISTICS POLICIES
-- =====================================================

-- Everyone can view system statistics
CREATE POLICY "Anyone can view system statistics"
    ON system_statistics FOR SELECT
    USING (true);

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true); -- Handled by triggers and system

