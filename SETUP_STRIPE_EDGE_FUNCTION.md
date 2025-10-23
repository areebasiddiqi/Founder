# 🚀 Setup Stripe Webhook with Supabase Edge Functions

## **✅ Files Created**

```
📁 supabase/
├── config.toml                           # Supabase configuration
├── functions/
│   ├── .env.example                      # Environment variables template
│   └── stripe-webhook/
│       └── index.ts                      # Edge function code

📁 Root directory/
├── deploy-webhook.ps1                    # PowerShell deployment script
├── deploy-webhook.sh                     # Bash deployment script
├── STRIPE_WEBHOOK_EDGE_FUNCTION.md       # Detailed documentation
└── package.json                          # Updated with new scripts
```

## **🛠 Quick Setup (5 Steps)**

### **Step 1: Install Supabase CLI**
```bash
npm install -g supabase
supabase login
```

### **Step 2: Link Your Project**
```bash
supabase link --project-ref your-project-ref
```

### **Step 3: Configure Environment**
```bash
# Copy the template
cp supabase/functions/.env.example supabase/functions/.env

# Edit with your values
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **Step 4: Deploy the Function**
```bash
# Option A: Use the deployment script
./deploy-webhook.ps1

# Option B: Use npm script
npm run webhook:deploy

# Option C: Manual deployment
supabase functions deploy stripe-webhook --env-file supabase/functions/.env
```

### **Step 5: Update Stripe Dashboard**
1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Update webhook URL to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

## **🧪 Testing**

### **Test with Stripe CLI:**
```bash
# Install Stripe CLI if not already installed
# Then test the webhook
npm run webhook:test

# Or manually
stripe trigger customer.subscription.created
```

### **Monitor Logs:**
```bash
# Real-time logs
npm run webhook:logs

# Or manually
supabase functions logs stripe-webhook --follow
```

## **📊 New NPM Scripts Available**

```bash
npm run supabase:start      # Start local Supabase
npm run supabase:stop       # Stop local Supabase
npm run supabase:deploy     # Deploy all functions
npm run webhook:deploy      # Deploy stripe webhook function
npm run webhook:logs        # View webhook logs
npm run webhook:test        # Test webhook with Stripe CLI
```

## **🔄 Migration Benefits**

### **Before (Next.js API Route):**
- ❌ Cold starts on serverless
- ❌ Limited global distribution
- ❌ Potential timeout issues
- ❌ More complex error handling

### **After (Supabase Edge Function):**
- ✅ No cold starts
- ✅ Global edge distribution
- ✅ Built for webhook handling
- ✅ Better reliability and performance
- ✅ Direct database access
- ✅ Automatic scaling

## **🛡 Security Improvements**

- ✅ **Webhook Signature Verification**: Validates authenticity
- ✅ **Environment Isolation**: Secrets never exposed to frontend
- ✅ **Service Role Access**: Direct database access with proper permissions
- ✅ **HTTPS by Default**: All requests encrypted
- ✅ **Rate Limiting**: Built-in protection

## **📈 What the Edge Function Handles**

### **Subscription Events:**
- **Created/Updated**: Updates subscription in database
- **Deleted**: Cancels subscription, sets plan to free

### **Payment Events:**
- **Payment Succeeded**: Activates subscription
- **Payment Failed**: Deactivates subscription

### **Checkout Events:**
- **Checkout Completed**: Links Stripe customer ID to user profile

### **Database Operations:**
- **Upsert Subscriptions**: Creates or updates subscription records
- **Update User Profiles**: Links customer ID to user
- **Plan Management**: Updates plan types based on price IDs
- **Status Tracking**: Manages active/inactive/cancelled states

## **🚨 Important Notes**

### **Price ID Mapping:**
Update the `priceMapping` object in the Edge Function with your actual Stripe price IDs:

```typescript
const priceMapping: Record<string, string> = {
  'price_1SKH7nPhoypBuKkN3LR4BJ6G': 'seis_eis_plan',
  'price_your_ai_plan': 'ai_enabled',
  'price_your_premium_plan': 'premium',
}
```

### **Database Schema:**
Ensure your `subscriptions` table has these columns:
- `stripe_subscription_id`
- `stripe_customer_id`
- `status`
- `plan_type`
- `current_period_start`
- `current_period_end`
- `updated_at`

### **Environment Variables:**
Keep your `.env` file secure and never commit it to version control.

## **🎯 Next Steps After Setup**

1. **Test thoroughly** with real Stripe events
2. **Monitor logs** to ensure proper processing
3. **Update your checkout flow** if needed
4. **Remove old Next.js API route** once confirmed working
5. **Set up monitoring** for production

## **🆘 Troubleshooting**

### **Common Issues:**
- **Deployment fails**: Check if you're logged in and project is linked
- **Webhook not receiving events**: Verify URL in Stripe dashboard
- **Database errors**: Check service role key and table permissions
- **Signature verification fails**: Verify webhook secret is correct

### **Debug Commands:**
```bash
# Check Supabase status
supabase status

# View function logs
supabase functions logs stripe-webhook

# Test locally
supabase start
supabase functions serve stripe-webhook
```

**Your Stripe webhooks are now powered by Supabase Edge Functions!** 🎉

**Benefits**: Better performance, reliability, and security for handling Stripe webhooks.
