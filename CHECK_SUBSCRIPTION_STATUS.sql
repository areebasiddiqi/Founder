-- ===================================================================
-- CHECK CURRENT SUBSCRIPTION STATUS
-- Run this to see what's in your database right now
-- ===================================================================

-- 1. Check if tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
        THEN '✅ profiles table exists' 
        ELSE '❌ profiles table missing' 
    END as profiles_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') 
        THEN '✅ subscriptions table exists' 
        ELSE '❌ subscriptions table missing' 
    END as subscriptions_status;

-- 2. Check profiles with stripe_customer_id
SELECT 'Users with Stripe Customer IDs:' as info;
SELECT 
    id,
    email,
    stripe_customer_id,
    created_at
FROM profiles 
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check all subscriptions
SELECT 'All Subscriptions:' as info;
SELECT 
    s.id,
    s.user_id,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.status,
    s.plan_type,
    s.current_period_start,
    s.current_period_end,
    s.created_at,
    p.email
FROM subscriptions s
LEFT JOIN profiles p ON s.user_id = p.id
ORDER BY s.created_at DESC
LIMIT 10;

-- 4. Check for active subscriptions
SELECT 'Active Subscriptions:' as info;
SELECT 
    COUNT(*) as total_active,
    plan_type,
    status
FROM subscriptions 
WHERE status = 'active'
GROUP BY plan_type, status;

-- 5. Check for users without subscriptions but with customer IDs
SELECT 'Users with Customer ID but no Subscription:' as info;
SELECT 
    p.id,
    p.email,
    p.stripe_customer_id
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.stripe_customer_id IS NOT NULL
AND s.id IS NULL
LIMIT 10;

-- 6. Check recent auth users
SELECT 'Recent Users:' as info;
SELECT 
    au.id,
    au.email,
    au.created_at,
    p.stripe_customer_id,
    s.status as subscription_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN subscriptions s ON au.id = s.user_id
ORDER BY au.created_at DESC
LIMIT 5;
