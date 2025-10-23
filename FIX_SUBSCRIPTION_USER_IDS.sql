-- ===================================================================
-- FIX SUBSCRIPTION USER IDS
-- This fixes subscriptions that have null user_id values
-- ===================================================================

-- 1. Check current subscriptions with null user_id
SELECT 'Subscriptions with null user_id:' as info;
SELECT id, stripe_customer_id, plan_type, status, created_at
FROM subscriptions 
WHERE user_id IS NULL;

-- 2. Update subscriptions by linking them to users via stripe_customer_id
UPDATE subscriptions 
SET user_id = profiles.id
FROM profiles 
WHERE subscriptions.stripe_customer_id = profiles.stripe_customer_id 
AND subscriptions.user_id IS NULL;

-- 3. Check results after update
SELECT 'Subscriptions still with null user_id after update:' as info;
SELECT id, stripe_customer_id, plan_type, status, created_at
FROM subscriptions 
WHERE user_id IS NULL;

-- 4. Show all subscriptions with their user info
SELECT 'All subscriptions with user info:' as info;
SELECT 
    s.id as subscription_id,
    s.user_id,
    s.stripe_customer_id,
    s.plan_type,
    s.status,
    p.email as user_email,
    p.full_name as user_name,
    s.created_at
FROM subscriptions s
LEFT JOIN profiles p ON s.user_id = p.id
ORDER BY s.created_at DESC;

-- Success message
SELECT '✅ Subscription user IDs fixed!' as result;
