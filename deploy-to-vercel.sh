#!/bin/bash

echo "🚀 Deploying Riscura RCSA Platform to Vercel"
echo "=============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the application first
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "📋 Post-deployment checklist:"
echo "1. Set up production PostgreSQL database"
echo "2. Configure environment variables in Vercel dashboard:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET (32+ chars)"
echo "   - NEXTAUTH_SECRET (32+ chars)"
echo "   - SESSION_SECRET (32+ chars)"
echo "   - AI_ENCRYPTION_KEY (32+ chars)"
echo "   - WEBHOOK_SECRET (32+ chars)"
echo "   - APP_URL (your domain)"
echo "3. Run database migrations"
echo "4. Test user registration and login"
echo "5. Verify all features are working"

echo ""
echo "🎉 Deployment complete!"
echo "📖 See DEPLOYMENT_READINESS_REVIEW.md for detailed instructions" 