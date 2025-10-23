# PowerShell script to deploy Stripe webhook Edge Function

Write-Host "🚀 Deploying Stripe Webhook Edge Function..." -ForegroundColor Green

# Check if Supabase CLI is installed
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}

# Check if logged in to Supabase
$loginStatus = supabase status 2>&1
if ($loginStatus -match "not logged in") {
    Write-Host "🔐 Please login to Supabase first:" -ForegroundColor Yellow
    Write-Host "supabase login" -ForegroundColor Cyan
    exit 1
}

# Check if project is linked
$projectStatus = supabase status 2>&1
if ($projectStatus -match "not linked") {
    Write-Host "🔗 Please link your Supabase project first:" -ForegroundColor Yellow
    Write-Host "supabase link --project-ref your-project-ref" -ForegroundColor Cyan
    exit 1
}

# Check if .env file exists
if (!(Test-Path "supabase/functions/.env")) {
    Write-Host "⚠️  Environment file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "supabase/functions/.env.example" "supabase/functions/.env"
    Write-Host "📝 Please edit supabase/functions/.env with your actual values:" -ForegroundColor Yellow
    Write-Host "   - SUPABASE_URL" -ForegroundColor Cyan
    Write-Host "   - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Cyan
    Write-Host "   - STRIPE_SECRET_KEY" -ForegroundColor Cyan
    Write-Host "   - STRIPE_WEBHOOK_SECRET" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Deploy the function
Write-Host "📦 Deploying stripe-webhook function..." -ForegroundColor Blue
$deployResult = supabase functions deploy stripe-webhook --env-file supabase/functions/.env 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Your webhook URL is:" -ForegroundColor Yellow
    
    # Get project URL
    $status = supabase status --output json | ConvertFrom-Json
    $projectUrl = $status.api.url -replace "http://127.0.0.1:54321", "https://your-project.supabase.co"
    Write-Host "$projectUrl/functions/v1/stripe-webhook" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update your Stripe webhook URL in the Stripe Dashboard" -ForegroundColor White
    Write-Host "2. Test the webhook with: stripe trigger customer.subscription.created" -ForegroundColor White
    Write-Host "3. Monitor logs with: supabase functions logs stripe-webhook --follow" -ForegroundColor White
    Write-Host "4. Remove the old Next.js API route: app/api/stripe/webhook/" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed:" -ForegroundColor Red
    Write-Host $deployResult -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Stripe webhook is now powered by Supabase Edge Functions!" -ForegroundColor Green
