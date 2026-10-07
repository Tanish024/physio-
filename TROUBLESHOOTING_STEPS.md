# Troubleshooting: "Could not find the table 'public.orders'" Error

## Step 1: Verify Tables Don't Exist

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `cknhitafyibctnkuezjc`
3. Go to **SQL Editor**
4. Copy and paste this query:

```sql
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items');
```

5. Click **Run**

**Expected Result:**
- If you see **0 rows** → Tables don't exist (proceed to Step 2)
- If you see **2 rows** → Tables exist (proceed to Step 3)

---

## Step 2: Create the Tables (If They Don't Exist)

1. In Supabase SQL Editor, click **New query**
2. Open the file: `supabase/migrations/APPLY_THIS_create_orders_tables.sql`
3. Copy **ALL** the contents (Ctrl+A, Ctrl+C)
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Wait for "Success" message
7. Go back to Step 1 to verify tables were created

---

## Step 3: Verify RLS Policies (If Tables Exist)

If tables exist but you still get errors, check RLS policies:

```sql
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items');
```

**Expected Result:** Should show 4 policies:
- `orders_select_own` (SELECT)
- `orders_insert_self` (INSERT)
- `order_items_select_by_order` (SELECT)
- `order_items_insert_by_order` (INSERT)

If policies are missing, run the migration again (Step 2).

---

## Step 4: Test Direct Insert

Try inserting a test order directly in SQL Editor:

```sql
INSERT INTO public.orders (
    customer_email,
    customer_name,
    subtotal,
    shipping,
    total,
    status
) VALUES (
    'test@example.com',
    'Test User',
    100.00,
    5.99,
    105.99,
    'created'
) RETURNING *;
```

**If this works:** Your database is fine, the issue is in the app.
**If this fails:** Note the exact error message.

---

## Step 5: Check Supabase Project Status

1. In Supabase Dashboard, check top-right corner
2. Make sure project status is **Active** (not Paused)
3. If paused, click to restore it

---

## Step 6: Refresh Schema Cache

Sometimes Supabase needs to refresh its schema cache:

1. Go to **Settings** → **API**
2. Click **Refresh** next to "Schema cache"
3. Wait 30 seconds
4. Try your checkout again

---

## Step 7: Alternative - Use Browser Test

1. Open the file: `test-supabase-connection.html` in your browser
2. Click **"Check Tables"** button
3. Look at the output
4. If it says "Orders table does NOT exist", go back to Step 2

---

## Step 8: Check Environment Variables

Verify your `.env` file has correct values:

```env
VITE_SUPABASE_URL="https://cknhitafyibctnkuezjc.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
```

After changing `.env`:
1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev`

---

## Common Issues & Solutions

### Issue: "relation 'public.orders' does not exist"
**Solution:** Tables weren't created. Run Step 2.

### Issue: "new row violates row-level security policy"
**Solution:** RLS policies are wrong. Run Step 2 again (it will recreate policies).

### Issue: "permission denied for table orders"
**Solution:** Run this in SQL Editor:
```sql
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.order_items TO anon, authenticated;
```

### Issue: Still not working after all steps
**Solution:** 
1. Take a screenshot of the exact error in browser console (F12)
2. Take a screenshot of the result from Step 1 (table verification)
3. Share both screenshots for further help

---

## Quick Checklist

- [ ] Verified tables exist (Step 1)
- [ ] Ran migration if tables don't exist (Step 2)
- [ ] Verified RLS policies exist (Step 3)
- [ ] Tested direct insert (Step 4)
- [ ] Project is Active, not Paused (Step 5)
- [ ] Refreshed schema cache (Step 6)
- [ ] Environment variables are correct (Step 8)
- [ ] Restarted dev server after any changes

---

## Need More Help?

If you've completed all steps and still have issues:
1. Open browser console (F12)
2. Try checkout again
3. Copy the FULL error message
4. Share it along with which steps you completed
