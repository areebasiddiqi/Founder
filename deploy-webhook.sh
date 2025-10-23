#!/bin/bash

# Bash script to deploy Stripe webhook Edge Function

echo "🚀 Deploying Stripe Webhook Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if logged in to Supabase
if supabase status 2>&1 | grep -q "not logged in"; then
    echo "🔐 Please login to Supabase first:"
    echo "supabase login"
    exit 1
fi

# Check if project is linked
if supabase status 2>&1 | grep -q "not linked"; then
    echo "🔗 Please link your Supabase project first:"
    echo "supabase link --project-ref your-project-ref"
    exit 1
fi

# Check if .env file exists
if [ ! -f "supabase/functions/.env" ]; then
    echo "⚠️  Environment file not found. Creating from template..."
    cp "supabase/functions/.env.example" "supabase/functions/.env"
    echo "📝 Please edit supabase/functions/.env with your actual values:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Deploy the function
echo "📦 Deploying stripe-webhook function..."
if supabase functions deploy stripe-webhook --env-file supabase/functions/.env; then
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "🔗 Your webhook URL is:"
    
    # Get project URL (simplified - user needs to replace with actual URL)
    echo "https://your-project.supabase.co/functions/v1/stripe-webhook"
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your Stripe webhook URL in the Stripe Dashboard"
    echo "2. Test the webhook with: stripe trigger customer.subscription.created"
    echo "3. Monitor logs with: supabase functions logs stripe-webhook --follow"
    echo "4. Remove the old Next.js API route: app/api/stripe/webhook/"
else
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "🎉 Stripe webhook is now powered by Supabase Edge Functions!"
