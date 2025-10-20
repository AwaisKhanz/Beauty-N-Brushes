# Environment Variables Configuration

Copy this to `.env` in the backend directory and configure your values.

```env
# ================================
# Beauty N Brushes - Backend Environment Variables
# ================================

# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/bnb_dev

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=3d
COOKIE_SECRET=your-cookie-signing-secret-change-this

# ================================
# Email Service (SendGrid)
# ================================

# SendGrid API Key (REQUIRED for sending emails)
# Get from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG.xxxxx

# Email sender configuration
FROM_EMAIL=noreply@beautynbrushes.com
FROM_NAME=Beauty N Brushes

# For Development: If not configured, emails will be logged to console only

# ================================
# File Storage (Choose One)
# ================================

# AWS S3
# AWS_S3_BUCKET=beauty-n-brushes
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=xxx
# AWS_REGION=us-east-1

# Cloudinary (Recommended)
# CLOUDINARY_CLOUD_NAME=your-cloud-name
# CLOUDINARY_API_KEY=xxx
# CLOUDINARY_API_SECRET=xxx

# For Development: Uses local filesystem (no configuration needed)

# ================================
# Google Cloud AI (REQUIRED)
# ================================

# Google Cloud AI is used for ALL AI features:
# - Image analysis (Google Vision AI)
# - Text generation (Vertex AI - Gemini 1.5 Pro)
# - Visual similarity search (Vision AI embeddings)
#
# Setup Instructions:
# 1. Create a Google Cloud Project at https://console.cloud.google.com
# 2. Enable these APIs:
#    - Cloud Vision API
#    - Vertex AI API
# 3. Create a service account with these roles:
#    - Vertex AI User
#    - Cloud Vision AI Service Agent
# 4. Download the JSON key file
# 5. Set the path to the key file below

GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# How Visual Search Works:
# Google Vision AI analyzes actual pixels to create a 512-dimensional feature vector:
# - Color histogram (256 dims) - RGB color distribution
# - Object/label features (128 dims) - Hair-specific attributes
# - Spatial features (64 dims) - Face/hair position
# - Texture features (64 dims) - Color variance and complexity
#
# This allows matching based on ACTUAL visual similarity (color, texture, style)
# NOT semantic text similarity

# ================================
# Payment Providers
# ================================

# Stripe (Required for North America & Europe)
STRIPE_SECRET_KEY=sk_test_51xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx

# Stripe Product Price IDs (Create these in Stripe Dashboard)
# Solo Plan: $19/month
STRIPE_SOLO_PRICE_ID=price_xxxxx

# Salon Plan: $49/month
STRIPE_SALON_PRICE_ID=price_xxxxx

# Stripe Webhook Secret (Get from Stripe Dashboard > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Paystack (Required for Ghana & Nigeria)
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx

# ================================
# Instagram Integration (Optional)
# ================================

# Instagram Basic Display API
# Get from: https://developers.facebook.com/apps/
# INSTAGRAM_CLIENT_ID=xxxxx
# INSTAGRAM_CLIENT_SECRET=xxxxx
# INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/v1/instagram/callback

# ================================
# Redis (Optional - for caching)
# ================================

# REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=
```

## Frontend Environment Variables

Copy this to `.env.local` in the frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Stripe (for card collection)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx

# Paystack (for African regions)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

## How to Get SendGrid API Key

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to https://app.sendgrid.com/settings/api_keys
3. Click "Create API Key"
4. Name it "Beauty N Brushes Production"
5. Select "Full Access" permissions
6. Copy the API key (starts with `SG.`)
7. Add to your `.env` file as `SENDGRID_API_KEY`

**Important:** You'll also need to verify a sender email address:

- Go to https://app.sendgrid.com/settings/sender_auth/senders
- Add and verify your sender email (e.g., noreply@yourdomain.com)
- Use this email as `FROM_EMAIL` in your `.env` file

## How to Get Stripe Price IDs

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Create "Beauty N Brushes - Solo Professional"
   - Recurring: Monthly
   - Price: $19.00 USD
   - Copy the Price ID (starts with `price_`)
4. Create "Beauty N Brushes - Salon"
   - Recurring: Monthly
   - Price: $49.00 USD
   - Copy the Price ID
5. Add both Price IDs to your `.env` file

## How to Set Up Webhooks

### **Stripe Webhooks:**

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/v1/webhooks/stripe`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_method.attached`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add to your `.env` file as `STRIPE_WEBHOOK_SECRET`

**For local development:**

- Use Stripe CLI: `stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe`
- Copy the webhook signing secret from CLI output

### **Paystack Webhooks:**

1. Go to https://dashboard.paystack.com/#/settings/developer
2. Scroll to "Webhook URL"
3. Set URL: `https://yourdomain.com/api/v1/webhooks/paystack`
4. Paystack uses your secret key for signature verification (already configured)

**For local development:**

- Use ngrok or similar to expose local server: `ngrok http 5000`
- Use the ngrok URL for webhook endpoint

### **Webhook Endpoints:**

- Stripe: `POST /api/v1/webhooks/stripe`
- Paystack: `POST /api/v1/webhooks/paystack`
