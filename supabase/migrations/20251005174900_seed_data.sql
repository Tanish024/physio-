-- =====================================================
-- SEED DATA FOR TESTING
-- =====================================================

-- =====================================================
-- EXERCISES
-- =====================================================

INSERT INTO exercises (name, slug, description, category, difficulty_level, muscle_groups, equipment_required, instructions, common_mistakes, tips, default_reps, default_sets, estimated_calories_per_rep, pose_detection_enabled, is_active) VALUES

-- Push-ups
('Push-up', 'push-up', 'A classic bodyweight exercise that builds upper body and core strength', 'strength', 'beginner', 
 ARRAY['chest', 'triceps', 'shoulders', 'core'], 
 ARRAY['none'], 
 ARRAY['Start in plank position with hands shoulder-width apart', 'Lower your body until chest nearly touches the floor', 'Push back up to starting position', 'Keep your body in a straight line throughout'],
 ARRAY['Sagging hips', 'Flaring elbows too wide', 'Not going low enough', 'Holding breath'],
 ARRAY['Engage your core', 'Look slightly ahead, not down', 'Keep elbows at 45-degree angle', 'Breathe out as you push up'],
 10, 3, 0.5, true, true),

-- Squats
('Bodyweight Squat', 'bodyweight-squat', 'Fundamental lower body exercise that targets legs and glutes', 'strength', 'beginner',
 ARRAY['quadriceps', 'hamstrings', 'glutes', 'core'],
 ARRAY['none'],
 ARRAY['Stand with feet shoulder-width apart', 'Lower your body by bending knees and hips', 'Keep chest up and back straight', 'Push through heels to return to start'],
 ARRAY['Knees caving inward', 'Lifting heels off ground', 'Leaning too far forward', 'Not going low enough'],
 ARRAY['Keep weight on heels', 'Push knees out', 'Maintain neutral spine', 'Go as low as comfortable'],
 15, 3, 0.6, true, true),

-- Plank
('Plank Hold', 'plank-hold', 'Isometric core exercise that builds stability and endurance', 'core', 'beginner',
 ARRAY['core', 'shoulders', 'back'],
 ARRAY['none'],
 ARRAY['Start in forearm plank position', 'Keep body in straight line from head to heels', 'Engage core and glutes', 'Hold position for specified time'],
 ARRAY['Sagging hips', 'Raised butt', 'Holding breath', 'Shoulders not over elbows'],
 ARRAY['Squeeze glutes', 'Breathe normally', 'Look at floor', 'Keep neck neutral'],
 30, 3, 0.3, true, true),

-- Lunges
('Forward Lunge', 'forward-lunge', 'Single-leg exercise that improves balance and leg strength', 'strength', 'intermediate',
 ARRAY['quadriceps', 'hamstrings', 'glutes'],
 ARRAY['none'],
 ARRAY['Stand tall with feet hip-width apart', 'Step forward with one leg', 'Lower hips until both knees are at 90 degrees', 'Push back to starting position'],
 ARRAY['Knee extending past toes', 'Leaning too far forward', 'Back knee hitting ground hard', 'Poor balance'],
 ARRAY['Keep torso upright', 'Step far enough forward', 'Control the descent', 'Alternate legs'],
 10, 3, 0.7, true, true),

-- Burpees
('Burpee', 'burpee', 'Full-body cardio exercise that burns maximum calories', 'cardio', 'advanced',
 ARRAY['full_body'],
 ARRAY['none'],
 ARRAY['Start standing', 'Drop into squat and place hands on floor', 'Jump feet back to plank', 'Do a push-up', 'Jump feet back to hands', 'Explode up into a jump'],
 ARRAY['Poor plank form', 'Not fully extending in jump', 'Landing too hard', 'Rushing through movement'],
 ARRAY['Maintain form over speed', 'Land softly', 'Breathe rhythmically', 'Modify if needed'],
 10, 3, 1.5, true, true),

-- Mountain Climbers
('Mountain Climbers', 'mountain-climbers', 'Dynamic core and cardio exercise', 'cardio', 'intermediate',
 ARRAY['core', 'shoulders', 'legs'],
 ARRAY['none'],
 ARRAY['Start in plank position', 'Bring one knee toward chest', 'Quickly switch legs', 'Continue alternating'],
 ARRAY['Hips too high', 'Not bringing knee far enough', 'Poor plank form', 'Going too fast'],
 ARRAY['Keep hips level', 'Maintain plank throughout', 'Control your pace', 'Engage core'],
 20, 3, 0.8, true, true),

-- Jumping Jacks
('Jumping Jacks', 'jumping-jacks', 'Classic cardio warm-up exercise', 'cardio', 'beginner',
 ARRAY['full_body'],
 ARRAY['none'],
 ARRAY['Start with feet together, arms at sides', 'Jump feet out while raising arms overhead', 'Jump back to starting position', 'Repeat rhythmically'],
 ARRAY['Landing too hard', 'Not fully extending arms', 'Poor rhythm', 'Holding breath'],
 ARRAY['Land softly on balls of feet', 'Keep knees soft', 'Breathe steadily', 'Maintain good posture'],
 30, 3, 0.4, true, true),

-- Sit-ups
('Sit-up', 'sit-up', 'Traditional core exercise for abdominal strength', 'core', 'beginner',
 ARRAY['abs', 'hip_flexors'],
 ARRAY['none'],
 ARRAY['Lie on back with knees bent', 'Place hands behind head or crossed on chest', 'Engage core and lift upper body', 'Lower back down with control'],
 ARRAY['Pulling on neck', 'Using momentum', 'Not engaging core', 'Coming up too high'],
 ARRAY['Lead with chest, not head', 'Control the movement', 'Focus on core contraction', 'Keep feet flat'],
 15, 3, 0.5, true, true),

-- Tricep Dips
('Tricep Dips', 'tricep-dips', 'Bodyweight exercise targeting triceps and shoulders', 'strength', 'intermediate',
 ARRAY['triceps', 'shoulders', 'chest'],
 ARRAY['bench', 'chair'],
 ARRAY['Sit on edge of bench', 'Place hands beside hips', 'Slide butt off bench', 'Lower body by bending elbows', 'Push back up'],
 ARRAY['Elbows flaring out', 'Shoulders shrugging', 'Going too low', 'Using legs too much'],
 ARRAY['Keep elbows pointing back', 'Lower shoulders down and back', 'Control the depth', 'Focus on triceps'],
 12, 3, 0.6, true, true),

-- High Knees
('High Knees', 'high-knees', 'High-intensity cardio exercise', 'cardio', 'intermediate',
 ARRAY['legs', 'core'],
 ARRAY['none'],
 ARRAY['Stand with feet hip-width apart', 'Run in place lifting knees high', 'Pump arms vigorously', 'Maintain quick pace'],
 ARRAY['Not lifting knees high enough', 'Leaning back', 'Landing too hard', 'Poor arm coordination'],
 ARRAY['Drive knees to hip level', 'Stay on balls of feet', 'Keep core engaged', 'Land softly'],
 30, 3, 1.0, true, true);

-- =====================================================
-- ACHIEVEMENTS
-- =====================================================

INSERT INTO achievements (name, description, icon, category, tier, criteria_type, criteria_value, xp_reward, is_active, is_hidden, display_order) VALUES

-- Beginner Achievements
('First Steps', 'Complete your first workout', '🎯', 'milestone', 'bronze', 'workouts_completed', 1, 50, true, false, 1),
('Getting Started', 'Complete 5 workouts', '⭐', 'milestone', 'bronze', 'workouts_completed', 5, 100, true, false, 2),
('Building Momentum', 'Complete 10 workouts', '🔥', 'milestone', 'silver', 'workouts_completed', 10, 200, true, false, 3),
('Dedicated', 'Complete 25 workouts', '💪', 'milestone', 'silver', 'workouts_completed', 25, 500, true, false, 4),
('Committed', 'Complete 50 workouts', '🏆', 'milestone', 'gold', 'workouts_completed', 50, 1000, true, false, 5),
('Century Club', 'Complete 100 workouts', '👑', 'milestone', 'platinum', 'workouts_completed', 100, 2500, true, false, 6),

-- Streak Achievements
('Streak Starter', 'Maintain a 3-day workout streak', '📅', 'streak', 'bronze', 'streak_days', 3, 100, true, false, 10),
('Week Warrior', 'Maintain a 7-day workout streak', '⚡', 'streak', 'silver', 'streak_days', 7, 250, true, false, 11),
('Two Week Champion', 'Maintain a 14-day workout streak', '🌟', 'streak', 'gold', 'streak_days', 14, 500, true, false, 12),
('Monthly Master', 'Maintain a 30-day workout streak', '🔱', 'streak', 'platinum', 'streak_days', 30, 1500, true, false, 13),

-- Performance Achievements
('Form Perfectionist', 'Achieve perfect form (95%+) on 10 exercises', '✨', 'performance', 'gold', 'perfect_form_count', 10, 750, true, false, 20),
('Rep Master', 'Complete 1000 total reps', '💯', 'performance', 'silver', 'total_reps', 1000, 500, true, false, 21),
('Rep Legend', 'Complete 5000 total reps', '🎖️', 'performance', 'gold', 'total_reps', 5000, 2000, true, false, 22),
('Exercise Explorer', 'Try 20 different exercises', '🗺️', 'performance', 'silver', 'total_exercises', 20, 400, true, false, 23),

-- Social Achievements
('Social Butterfly', 'Make 5 friends', '🤝', 'social', 'bronze', 'friends_count', 5, 200, true, false, 30),
('Community Member', 'Make 10 friends', '👥', 'social', 'silver', 'friends_count', 10, 400, true, false, 31),
('Fitness Family', 'Make 25 friends', '🌐', 'social', 'gold', 'friends_count', 25, 1000, true, false, 32);

-- =====================================================
-- DAILY CHALLENGES
-- =====================================================

-- Insert today's challenge
INSERT INTO daily_challenges (date, title, description, challenge_type, target_value, xp_reward, bonus_xp) VALUES
(CURRENT_DATE, 'Push-up Challenge', 'Complete 50 push-ups today', 'reps', 50, 100, 50),
(CURRENT_DATE + INTERVAL '1 day', 'Cardio Blast', 'Spend 15 minutes on cardio exercises', 'duration', 900, 100, 50),
(CURRENT_DATE + INTERVAL '2 days', 'Core Power', 'Complete 3 core exercises', 'exercises', 3, 100, 50);

-- =====================================================
-- TUTORIALS
-- =====================================================

INSERT INTO tutorials (title, description, category, youtube_video_id, difficulty_level, tags, is_featured, is_premium, display_order) VALUES

('Getting Started with AI Fitness', 'Learn how to use the AI fitness coach and get the most out of your workouts', 'getting_started', 'dQw4w9WgXcQ', 'beginner', 
 ARRAY['introduction', 'basics', 'tutorial'], true, false, 1),

('Perfect Push-up Form', 'Master the push-up with proper technique and variations', 'form_tips', 'dQw4w9WgXcQ', 'beginner',
 ARRAY['push-ups', 'form', 'chest'], true, false, 2),

('Squat Technique Masterclass', 'Learn proper squat form to maximize gains and prevent injury', 'form_tips', 'dQw4w9WgXcQ', 'beginner',
 ARRAY['squats', 'legs', 'form'], true, false, 3),

('Building Your First Workout Routine', 'Create an effective workout plan tailored to your goals', 'workout_plans', 'dQw4w9WgXcQ', 'beginner',
 ARRAY['planning', 'routine', 'beginner'], false, false, 4),

('Advanced Plank Variations', 'Take your core training to the next level', 'form_tips', 'dQw4w9WgXcQ', 'advanced',
 ARRAY['plank', 'core', 'advanced'], false, false, 5),

('Nutrition Basics for Fitness', 'Understanding macros and meal timing for optimal results', 'nutrition', 'dQw4w9WgXcQ', 'beginner',
 ARRAY['nutrition', 'diet', 'basics'], false, true, 6),

('Recovery and Rest Days', 'Why rest is crucial and how to optimize recovery', 'recovery', 'dQw4w9WgXcQ', 'beginner',
 ARRAY['recovery', 'rest', 'health'], false, false, 7);

-- =====================================================
-- HOMEPAGE CONTENT
-- =====================================================

INSERT INTO homepage_content (content_type, title, content, author_name, author_avatar, display_order, is_active) VALUES

-- Testimonials
('testimonial', 'Life Changing!', 'This AI coach has completely transformed my workout routine. The real-time feedback keeps me motivated and helps me maintain perfect form!', 
 'Sarah Johnson', '/api/placeholder/40/40', 1, true),

('testimonial', 'Best Fitness App Ever', 'I''ve tried many fitness apps, but this one is different. The AI actually understands my movements and gives helpful corrections instantly.', 
 'Mike Chen', '/api/placeholder/40/40', 2, true),

('testimonial', 'Results Speak for Themselves', 'Lost 20 pounds and gained so much strength in 3 months. The progress tracking keeps me accountable every day!', 
 'Emma Davis', '/api/placeholder/40/40', 3, true),

-- Success Stories
('success_story', 'From Beginner to Marathon Runner', 'Started with basic workouts, now running marathons! This app guided my entire fitness journey.', 
 'Tom Wilson', '/api/placeholder/80/80', 10, true),

('success_story', 'Gained 15lbs of Muscle', 'The progressive overload tracking helped me consistently improve. Now I''m stronger than ever!', 
 'Alex Rodriguez', '/api/placeholder/80/80', 11, true);

-- Insert system statistics (will be updated by function)
INSERT INTO system_statistics (stat_key, stat_value, stat_label) VALUES
('total_users', '0', 'Total Users'),
('total_workouts', '0', 'Workouts Completed'),
('total_exercises', '10', 'Exercises Available'),
('avg_satisfaction', '98%', 'User Satisfaction'),
('active_users', '0', 'Active Users');

-- Run initial stats update
SELECT update_system_stats();

