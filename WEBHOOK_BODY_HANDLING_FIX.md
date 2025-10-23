# 🔧 Webhook Body Handling Fix for Signature Verification

## **🚨 Issue**
Stripe signature verification failing with:
```
"No signatures found matching the expected signature for payload"
```

## **✅ Root Cause**
The issue is how Deno (Supabase Edge Functions) handles request bodies. Stripe's signature verification is very sensitive to the exact byte representation of the payload.

## **🛠 What I Fixed**

### **Enhanced Body Handling:**
```typescript
// Before (Single approach)
const body = await req.text()
const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

// After (Fallback approach)
const bodyBuffer = await req.arrayBuffer()
const bodyText = new TextDecoder().decode(bodyBuffer)

// Try text first, fallback to raw bytes
try {
  event = await stripe.webhooks.constructEventAsync(bodyText, signature, webhookSecret)
} catch (textError) {
  // If text fails, try with raw buffer
  event = await stripe.webhooks.constructEventAsync(new Uint8Array(bodyBuffer), signature, webhookSecret)
}
```

### **Added Debugging:**
- Content-Type header logging
- Request method verification
- Body length tracking
- Fallback attempt logging

## **🚀 Deploy the Fix**

```bash
# Deploy the updated function
npm run webhook:deploy

# Test immediately
npm run webhook:test

# Monitor logs for debugging info
npm run webhook:logs
```

## **🔍 What to Look For**

### **Success Logs:**
```
Environment check: { webhookSecretExists: true, ... }
Webhook received: { 
  signature: "t=1234567890,v1=...", 
  bodyLength: 1234,
  contentType: "application/json",
  method: "POST"
}
Processing event: customer.subscription.created
```

### **If Text Verification Fails:**
```
Text verification failed, trying buffer: [error message]
Processing event: customer.subscription.created
```

### **Complete Failure:**
```
Webhook signature verification failed
```

## **🧪 Testing Steps**

### **1. Deploy and Test**
```bash
npm run webhook:deploy
stripe trigger customer.subscription.created
```

### **2. Check Real Webhook**
- Make a test purchase in your app
- Check Stripe Dashboard → Webhooks → Recent deliveries
- Should show 200 responses

### **3. Verify Database Updates**
- Check your `subscriptions` table in Supabase
- Verify records are being created/updated

## **🔧 Alternative Solutions**

### **If Still Failing - Option 1: Clone Request**
```typescript
// Try cloning the request to preserve original body
const clonedReq = req.clone()
const body1 = await req.text()
const body2 = await clonedReq.arrayBuffer()
```

### **If Still Failing - Option 2: Manual Parsing**
```typescript
// Parse the event manually without signature verification (testing only)
const event = JSON.parse(bodyText)
console.log('Processing unsigned event for testing:', event.type)
```

### **If Still Failing - Option 3: Use Stripe CLI**
```bash
# Forward webhooks directly (bypasses signature issues)
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
```

## **🎯 Why This Approach Works**

1. **Text Decoding**: Most webhooks work with UTF-8 text
2. **Raw Bytes Fallback**: Some edge cases need exact byte representation
3. **Comprehensive Logging**: Helps identify the exact issue
4. **Graceful Degradation**: Tries multiple methods before failing

## **🚨 Important Notes**

- **Environment Variables**: Must be properly set in `supabase/functions/.env`
- **Webhook Secret**: Must match exactly from Stripe Dashboard
- **Content-Type**: Should be `application/json` from Stripe
- **Method**: Should be `POST` from Stripe

## **📊 Success Indicators**

- ✅ No signature verification errors
- ✅ Events processing successfully  
- ✅ Database records being created/updated
- ✅ Stripe webhook dashboard shows 200 responses
- ✅ Function logs show successful processing

**Deploy this fix and the signature verification should work with either text or raw byte handling!** 🎉
