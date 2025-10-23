# 🔧 Stripe Webhook Signature Verification Troubleshooting

## **🚨 Current Issue**
```json
{
  "error": "Webhook signature verification failed",
  "details": "No signatures found matching the expected signature for payload..."
}
```

## **🔍 Root Causes & Solutions**

### **1. Wrong Webhook Secret**
**Most Common Issue**: The webhook secret in your environment doesn't match Stripe.

#### **Check Your Webhook Secret:**
1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Click on your webhook endpoint**
3. **Copy the "Signing secret"** (starts with `whsec_`)
4. **Update your `.env` file**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_signing_secret_here
   ```

### **2. Environment Variables Not Loading**
The Edge Function might not be reading your environment variables.

#### **Verify Environment Setup:**
```bash
# Check if .env file exists
ls supabase/functions/.env

# Deploy with explicit env file
supabase functions deploy stripe-webhook --env-file supabase/functions/.env
```

### **3. Multiple Webhook Endpoints**
You might have multiple webhook endpoints with different secrets.

#### **Check Stripe Dashboard:**
1. **Go to Developers → Webhooks**
2. **Verify you're using the correct endpoint URL**
3. **Each endpoint has its own signing secret**

## **🧪 Debugging Steps**

### **Step 1: Deploy Updated Function**
The updated function now includes debugging logs.

```bash
npm run webhook:deploy
```

### **Step 2: Check Environment Logs**
```bash
npm run webhook:logs
```

**Look for this log:**
```
Environment check: {
  supabaseUrlExists: true,
  serviceKeyExists: true,
  webhookSecretExists: true,
  webhookSecretPrefix: "whsec_ab..."
}
```

**If `webhookSecretExists: false`:**
- Your environment variables aren't loading
- Check your `.env` file path and contents

### **Step 3: Test Webhook**
```bash
# Trigger a test event
stripe trigger customer.subscription.created
```

**Look for these logs:**
```
Webhook received: {
  signature: "t=1234567890,v1=abc...",
  bodyLength: 1234,
  webhookSecretExists: true
}
```

### **Step 4: Verify Webhook URL**
Make sure Stripe is sending to the correct URL:
- **Expected**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Check in Stripe Dashboard** → Webhooks → Your endpoint

## **🛠 Common Fixes**

### **Fix 1: Update Webhook Secret**
```bash
# Edit your environment file
nano supabase/functions/.env

# Make sure it looks like this:
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...

# Redeploy
npm run webhook:deploy
```

### **Fix 2: Create New Webhook Endpoint**
If you can't find the right secret:

1. **Delete old webhook** in Stripe Dashboard
2. **Create new webhook** with URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. **Copy the new signing secret**
4. **Update your `.env` file**
5. **Redeploy the function**

### **Fix 3: Test with Stripe CLI**
```bash
# Forward webhooks to your Edge Function
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook

# This will show you the webhook secret to use
# Copy it to your .env file
```

## **📋 Environment File Template**

Your `supabase/functions/.env` should look like this:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

## **🔍 Verification Checklist**

- [ ] **Webhook secret starts with `whsec_`**
- [ ] **Environment file exists at `supabase/functions/.env`**
- [ ] **Deployed with `--env-file` flag**
- [ ] **Stripe webhook URL points to Edge Function**
- [ ] **Webhook endpoint is enabled in Stripe**
- [ ] **Function logs show environment variables loaded**

## **🚨 If Still Failing**

### **Option 1: Bypass Signature Verification (Testing Only)**
**⚠️ ONLY FOR TESTING - NOT FOR PRODUCTION**

Temporarily comment out signature verification:
```typescript
// try {
//   const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
// } catch (error) {
//   console.error('Signature verification failed, processing anyway for testing')
//   const event = JSON.parse(body)
// }
```

### **Option 2: Use Stripe CLI for Testing**
```bash
# This bypasses signature issues for local testing
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

### **Option 3: Check Supabase Logs**
```bash
# View detailed logs
supabase functions logs stripe-webhook --follow

# Look for any deployment or runtime errors
```

## **🎯 Next Steps**

1. **Deploy the updated function** with debugging
2. **Check the environment logs** to verify variables
3. **Update webhook secret** if needed
4. **Test with Stripe CLI** to verify
5. **Remove debugging logs** once working

**The signature verification should work once the webhook secret matches!** 🔐
