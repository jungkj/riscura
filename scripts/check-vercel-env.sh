#!/bin/bash

echo "🔍 Checking Vercel environment variables..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it with:"
    echo "   npm i -g vercel"
    exit 1
fi

# List environment variables
echo "📋 Environment variables in Vercel:"
echo ""
vercel env ls

echo ""
echo "🔐 To check if DATABASE_URL is set, run:"
echo "   vercel env pull"
echo ""
echo "This will create a .env.local file with your production variables."
echo ""
echo "⚠️  IMPORTANT: Make sure these variables are set in Vercel:"
echo "   - DATABASE_URL (your Supabase PostgreSQL connection string)"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - NEXTAUTH_URL (should be https://riscura.app)"
echo "   - NEXTAUTH_SECRET"
echo ""
echo "To add missing variables:"
echo "   vercel env add DATABASE_URL"