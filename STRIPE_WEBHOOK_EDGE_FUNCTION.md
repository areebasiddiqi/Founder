# Stripe Webhook with Supabase Edge Functions

## 🚀 **Why Use Edge Functions for Webhooks?**

### **Advantages over Next.js API Routes:**
- ✅ **Better Reliability**: Edge functions are designed for webhooks
- ✅ **Global Distribution**: Faster response times worldwide
- ✅ **Automatic Scaling**: Handles traffic spikes better
- ✅ **Built-in Security**: Better isolation and security
- ✅ **No Cold Starts**: Faster execution
- ✅ **Direct Database Access**: No need for API keys in frontend

## 📁 **File Structure Created**

```
supabase/
├── config.toml                           # Supabase configuration
├── functions/
│   ├── .env.example                      # Environment variables template
│   └── stripe-webhook/
│       └── index.ts                      # Edge function code
```

## 🛠 **Setup Instructions**

### **1. Install Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

### **2. Initialize Supabase (if not already done)**
```bash
# Link to your existing project
supabase link --project-ref your-project-ref

# Or initialize new project
supabase init
```

### **3. Set Environment Variables**

Create `supabase/functions/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **4. Deploy the Edge Function**
```bash
# Deploy the stripe-webhook function
supabase functions deploy stripe-webhook

# Or deploy all functions
supabase functions deploy
```

### **5. Update Stripe Webhook URL**

In your Stripe Dashboard:
1. Go to **Developers → Webhooks**
2. Update webhook URL to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`

## 🔧 **Edge Function Features**

### **Supported Webhook Events:**
- ✅ **Subscription Created/Updated**: Updates subscription in database
- ✅ **Subscription Deleted**: Cancels subscription, sets plan to free
- ✅ **Payment Succeeded**: Activates subscription
- ✅ **Payment Failed**: Deactivates subscription
- ✅ **Checkout Completed**: Links customer ID to user profile

### **Database Operations:**
- **Upsert Subscriptions**: Creates or updates subscription records
- **Update User Profiles**: Links Stripe customer ID to user
- **Handle Plan Changes**: Updates plan types based on price IDs
- **Status Management**: Tracks active/inactive/cancelled states

### **Error Handling:**
- **Signature Verification**: Validates webhook authenticity
- **Database Error Handling**: Proper error logging and responses
- **Retry Logic**: Stripe automatically retries failed webhooks

## 🧪 **Testing the Edge Function**

### **Local Testing:**
```bash
# Start Supabase locally
supabase start

# Deploy function locally
supabase functions deploy stripe-webhook --no-verify-jwt

# Test with curl
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-webhook' \
  --header 'Authorization: Bearer your_anon_key' \
  --header 'Content-Type: application/json' \
  --header 'stripe-signature: test_signature' \
  --data '{"test": "data"}'
```

### **Production Testing:**
1. **Use Stripe CLI** to forward webhooks:
   ```bash
   stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
   ```

2. **Trigger test events**:
   ```bash
   stripe trigger customer.subscription.created
   stripe trigger invoice.payment_succeeded
   ```

## 📊 **Monitoring & Logs**

### **View Function Logs:**
```bash
# View real-time logs
supabase functions logs stripe-webhook

# View logs with follow
supabase functions logs stripe-webhook --follow
```

### **In Supabase Dashboard:**
1. Go to **Edge Functions**
2. Click on **stripe-webhook**
3. View **Logs** and **Metrics**

## 🔄 **Migration from Next.js API Route**

### **1. Update Your Checkout Code**
Replace references to `/api/stripe/webhook` with the new Edge Function URL.

### **2. Remove Old API Route**
You can safely delete:
- `app/api/stripe/webhook/route.ts`

### **3. Update Environment Variables**
The Edge Function uses the same environment variables, but they're now managed in Supabase.

### **4. Test Thoroughly**
- Test subscription creation
- Test payment success/failure
- Test subscription cancellation
- Verify database updates

## 🛡 **Security Benefits**

### **Edge Function Security:**
- ✅ **Isolated Environment**: Each function runs in isolation
- ✅ **No Frontend Exposure**: Secrets never exposed to client
- ✅ **Automatic HTTPS**: All requests are encrypted
- ✅ **Built-in Rate Limiting**: Protection against abuse
- ✅ **Signature Verification**: Validates webhook authenticity

### **Database Security:**
- ✅ **Service Role Access**: Direct database access with proper permissions
- ✅ **Row Level Security**: RLS policies still apply
- ✅ **Audit Logging**: All database changes are logged

## 🚀 **Deployment Commands**

```bash
# Deploy single function
supabase functions deploy stripe-webhook

# Deploy with environment variables
supabase functions deploy stripe-webhook --env-file supabase/functions/.env

# Deploy all functions
supabase functions deploy

# View deployment status
supabase functions list
```

## 📈 **Performance Benefits**

- **Faster Response Times**: Edge functions are globally distributed
- **Better Reliability**: Built for webhook handling
- **Automatic Scaling**: Handles traffic spikes automatically
- **No Cold Starts**: Functions stay warm longer
- **Direct Database Access**: No API overhead

## 🎯 **Next Steps**

1. **Deploy the Edge Function** using the commands above
2. **Update Stripe webhook URL** in your dashboard
3. **Test with real transactions** to ensure everything works
4. **Monitor logs** to verify successful processing
5. **Remove old Next.js API route** once confirmed working

**Your Stripe webhooks are now powered by Supabase Edge Functions!** 🎉
