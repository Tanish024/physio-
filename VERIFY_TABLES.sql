-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR TO VERIFY
-- ============================================

-- 1. Check if orders table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items');

-- Expected result: Should show 2 rows (orders and order_items)
-- If you see 0 rows, the tables don't exist!

-- ============================================

-- 2. Check table structure (if tables exist)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- ============================================

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items');

-- Expected: Should show 4 policies (2 for orders, 2 for order_items)

-- ============================================

-- 4. Try to insert a test order (will fail if table doesn't exist)
INSERT INTO public.orders (
    customer_name,
    customer_email,
    address,
    city,
    postal_code,
    subtotal,
    shipping,
    total,
    status
) VALUES (
    'Test User',
    'test@example.com',
    '123 Test St',
    'Test City',
    '12345',
    100.00,
    5.99,
    105.99,
    'created'
) RETURNING *;

-- If this works, your table exists!
-- If you get an error, the table doesn't exist.

-- ============================================

-- 5. Clean up test data (optional)
-- DELETE FROM public.orders WHERE customer_email = 'test@example.com';
