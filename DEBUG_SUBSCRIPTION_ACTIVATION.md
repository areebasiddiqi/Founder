# 🔧 Debug Subscription Activation Issues

## **🚨 Common Issues Why Subscriptions Don't Activate**

### **1. Missing Database Tables**
- `subscriptions` table doesn't exist
- Missing columns in `profiles` table

### **2. Webhook Events Not Configured**
- Stripe webhook not sending all required events
- Events being sent but not handled properly

### **3. Database Permission Issues**
- RLS policies blocking updates
- Service role key not working

## **🔍 Step-by-Step Debugging**

### **Step 1: Check Database Structure**

Run this in Supabase SQL Editor:
```sql
-- Check if subscriptions table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'subscriptions' AND table_schema = 'public';

-- Check profiles table columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check current subscriptions
SELECT * FROM subscriptions LIMIT 5;
```

### **Step 2: Check Webhook Logs**

```bash
# View real-time webhook logs
npm run webhook:logs

# Look for these events after a successful payment:
# - customer.created
# - checkout.session.completed  
# - customer.subscription.created
# - invoice.payment_succeeded
```

### **Step 3: Check Stripe Dashboard**

1. **Go to Stripe Dashboard** → **Webhooks**
2. **Click your webhook endpoint**
3. **Check "Recent deliveries"**
4. **Look for 200 responses** (success) or errors

### **Step 4: Verify Webhook Events**

Make sure your Stripe webhook is configured to send:
- ✅ `customer.created`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `checkout.session.completed`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

## **🛠 Quick Fixes**

### **Fix 1: Create Missing Database Tables**

Run this SQL in Supabase:
```sql
-- Create subscriptions table if missing
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'inactive',
    plan_type TEXT DEFAULT 'free',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON subscriptions TO service_role;
```

### **Fix 2: Add Missing Columns to Profiles**

```sql
-- Add stripe_customer_id if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add updated_at if missing  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

### **Fix 3: Test Subscription Creation Manually**

```sql
-- Test creating a subscription record
INSERT INTO subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    plan_type
) VALUES (
    'your-user-id-here',
    'cus_test123',
    'sub_test123', 
    'active',
    'seis_eis_plan'
);
```

## **🧪 Testing Steps**

### **1. Make a Test Purchase**
1. Go through your checkout flow
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete the purchase

### **2. Check Webhook Logs**
```bash
npm run webhook:logs
```

**Look for:**
```
Processing event: checkout.session.completed
Processing event: customer.subscription.created
Processing event: invoice.payment_succeeded
Subscription sub_xxx processed for customer cus_xxx
```

### **3. Check Database**
```sql
-- Check if subscription was created
SELECT * FROM subscriptions WHERE stripe_customer_id = 'cus_your_customer_id';

-- Check if user profile was updated
SELECT stripe_customer_id FROM profiles WHERE id = 'your-user-id';
```

## **🚨 Common Error Messages**

### **"Could not find the 'subscriptions' table"**
**Fix:** Run the database creation SQL above

### **"permission denied for table subscriptions"**
**Fix:** Check RLS policies and service role permissions

### **"No signatures found matching expected signature"**
**Fix:** Check webhook secret in environment variables

## **📊 Expected Database State After Successful Subscription**

### **Profiles Table:**
```sql
id: user-uuid-123
email: user@example.com
stripe_customer_id: cus_ABC123
```

### **Subscriptions Table:**
```sql
id: subscription-uuid
user_id: user-uuid-123
stripe_customer_id: cus_ABC123
stripe_subscription_id: sub_ABC123
status: active
plan_type: seis_eis_plan
current_period_start: 2024-01-01T00:00:00Z
current_period_end: 2024-02-01T00:00:00Z
```

## **🎯 Next Steps**

1. **Run the database fixes** above
2. **Deploy the updated webhook**
3. **Test with a real purchase**
4. **Check logs and database**
5. **Share the results** so I can help debug further

**The key is making sure all webhook events are firing and the database can store the subscription data!** 🚀
