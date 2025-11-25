#!/bin/bash
# Script to set up local development environment

echo "🔧 Setting up local development environment..."

# Backup current .env if it exists
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up current .env"
fi

# Create local .env
cat > .env << 'ENVEOF'
NODE_ENV=development
PORT=3001

# Local PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mentor_platform
DB_USER=user
DB_PASSWORD=
DB_SSL=false

# JWT Configuration
JWT_SECRET=your-local-dev-secret-must-be-at-least-32-characters-long-for-security
JWT_EXPIRES_IN=7d

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM=noreply@mentorplatform.com

# Payment Gateway (Cashfree - Sandbox)
CASHFREE_APP_ID=your-cashfree-app-id-here
CASHFREE_SECRET_KEY=your-cashfree-secret-key-here

# AI Service (OpenAI)
OPENAI_API_KEY=your-openai-api-key-here

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
ENVEOF

echo "✅ Created local .env file"
echo ""
echo "⚠️  IMPORTANT: Update JWT_SECRET to a random 32+ character string"
echo "   You can generate one with: openssl rand -base64 32"
