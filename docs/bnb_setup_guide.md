# Beauty N Brushes - Complete Setup & Installation Guide

## Prerequisites

### Required Software
- **Node.js**: v20.x LTS or higher
- **pnpm**: v8.x or higher (recommended) or npm v10.x
- **PostgreSQL**: v15 or higher
- **Redis**: v7.x or higher (for caching)
- **Git**: Latest version
- **VS Code** or **Cursor**: Latest version

### Required Accounts
- **GitHub**: For version control
- **Railway**: For deployment and database hosting
- **AWS**: For S3 storage and CloudFront CDN
- **Stripe**: For payment processing
- **SendGrid**: For email services
- **OpenAI**: For AI features

---

## Step 1: Clone and Initialize Project

```bash
# Clone repository
git clone https://github.com/your-org/beauty-n-brushes.git
cd beauty-n-brushes

# Install pnpm globally if not installed
npm install -g pnpm

# Install dependencies
pnpm install
```

---

## Step 2: Environment Configuration

Create `.env.local` file in the root directory:

```bash
# Copy example environment file
cp .env.example .env.local
```

### Environment Variables Setup

```bash
# ================================
# DATABASE CONFIGURATION
# ================================
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/bnb_dev"
# Direct connection for migrations (without connection pooling)
DIRECT_URL="postgresql://user:password@localhost:5432/bnb_dev"

# ================================
# NEXT.JS CONFIGURATION
# ================================
# Base URL for the application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Node environment
NODE_ENV="development"

# ================================
# AUTHENTICATION (NextAuth.js)
# ================================
# NextAuth URL (same as app URL in development)
NEXTAUTH_URL="http://localhost:3000"
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-super-secret-key-here-change-in-production"

# OAuth Providers (optional for MVP)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ================================
# AWS S3 CONFIGURATION
# ================================
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="bnb-media-dev"
# CloudFront distribution URL (optional in dev, required in production)
NEXT_PUBLIC_CLOUDFRONT_URL="https://d1234567890.cloudfront.net"

# ================================
# STRIPE CONFIGURATION (North America & Europe)
# ================================
# Get from: https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
# Webhook secret (get after setting up webhook)
STRIPE_WEBHOOK_SECRET="whsec_..."

# ================================
# PAYSTACK CONFIGURATION (Ghana & Nigeria)
# ================================
# Get from: https://dashboard.paystack.com/#/settings/developers
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_SECRET_KEY="sk_test_..."
# Webhook secret
PAYSTACK_WEBHOOK_SECRET="your-webhook-secret"

# ================================
# SENDGRID CONFIGURATION
# ================================
# Get from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY="SG.xxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="Beauty N Brushes"

# ================================
# OPENAI CONFIGURATION
# ================================
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-..."

# ================================
# REDIS CONFIGURATION (Optional in dev)
# ================================
REDIS_URL="redis://localhost:6379"

# ================================
# MONITORING & ANALYTICS (Production)
# ================================
# Sentry DSN for error tracking
SENTRY_DSN="https://...@sentry.io/..."
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# ================================
# RATE LIMITING
# ================================
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000" # 15 minutes
```

---

## Step 3: Database Setup

### Local PostgreSQL Setup

#### Option A: Using Docker (Recommended)

```bash
# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: bnb-postgres
    environment:
      POSTGRES_USER: bnb_user
      POSTGRES_PASSWORD: bnb_password
      POSTGRES_DB: bnb_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    container_name: bnb-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps
```

#### Option B: Native Installation

**macOS:**
```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Redis
brew install redis
brew services start redis

# Create database
createdb bnb_dev
```

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb bnb_dev
sudo -u postgres psql -c "CREATE USER bnb_user WITH PASSWORD 'bnb_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bnb_dev TO bnb_user;"

# Install Redis
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:**
```bash
# Use Docker Desktop (recommended)
# Or download installers from:
# PostgreSQL: https://www.postgresql.org/download/windows/
# Redis: https://github.com/microsoftarchive/redis/releases
```

### Prisma Setup

```bash
# Generate Prisma Client
pnpm prisma generate

# Create initial database schema (first-time setup)
pnpm prisma migrate dev --name init

# This will create all tables defined in your Prisma schema
# No migration needed - this IS the initial schema creation

# Seed database with initial data (categories, test users, etc.)
pnpm prisma db seed
```

**Note**: Since this is a new project, the `prisma migrate dev --name init` command creates the complete database schema from scratch. You're not migrating from an existing database - you're creating everything fresh with Paystack and Stripe support already built in.

---

## Step 4: AWS S3 Setup

### Create S3 Bucket

1. **Log in to AWS Console**
2. **Navigate to S3**
3. **Create Bucket:**
   - Name: `bnb-media-dev` (or your preferred name)
   - Region: `us-east-1` (or your preferred region)
   - Block all public access: **Uncheck** (we'll use signed URLs)
   - Versioning: Enable
   - Encryption: Enable (SSE-S3)

4. **Configure CORS:**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://yourdomain.com"
       ],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

5. **Create IAM User:**
   - User name: `bnb-s3-uploader`
   - Attach policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::bnb-media-dev/*",
           "arn:aws:s3:::bnb-media-dev"
         ]
       }
     ]
   }
   ```
   - Save Access Key ID and Secret Access Key

### CloudFront Setup (Optional but Recommended)

1. **Create CloudFront Distribution:**
   - Origin: Your S3 bucket
   - Origin Access: Origin Access Control
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Compress Objects: Yes

2. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_CLOUDFRONT_URL="https://d1234567890.cloudfront.net"
   ```

---

## Step 5: Payment Providers Setup

### A. Stripe Setup (North America & Europe)

#### Create Stripe Account

1. **Sign up at:** https://stripe.com
2. **Get Test API Keys:**
   - Dashboard → Developers → API Keys
   - Copy Publishable Key and Secret Key

#### Configure Stripe

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### Set Up Webhook Events

In Stripe Dashboard → Developers → Webhooks:
- Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Select events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.trial_will_end`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

### B. Paystack Setup (Ghana & Nigeria)

#### Create Paystack Account

1. **Sign up at:** https://paystack.com
2. **Select your country:** Ghana or Nigeria
3. **Complete business verification**

#### Get API Keys

1. Navigate to: Dashboard → Settings → API Keys & Webhooks
2. Copy **Test Public Key** and **Test Secret Key**
3. Add to `.env.local`:

```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_SECRET_KEY="sk_test_..."
```

#### Configure Webhook

1. In Paystack Dashboard → Settings → API Keys & Webhooks
2. Click **Webhooks**
3. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
4. Generate a secret and save to `.env.local`:

```bash
PAYSTACK_WEBHOOK_SECRET="your-webhook-secret"
```

5. Select events:
   - `charge.success`
   - `charge.failed`
   - `subscription.create`
   - `subscription.disable`
   - `subscription.not_renew`
   - `transfer.success`
   - `transfer.failed`

#### Install Paystack SDK

```bash
# Install Paystack Node.js library
pnpm add paystack-node
```

#### Paystack Features Available

**Ghana:**
- Card payments (Visa, Mastercard, Verve)
- Mobile Money (MTN, Vodafone, AirtelTigo)
- Bank payments
- Recurring billing

**Nigeria:**
- Card payments (Visa, Mastercard, Verve)
- Bank Transfer (Pay with Transfer)
- USSD payments
- Recurring billing
- QR payments

---

### Payment Flow Overview

#### Provider Onboarding (Regional):

**North America/Europe (Stripe):**
1. Provider signs up and selects region
2. During onboarding, adds payment card (for subscription)
3. Stripe creates Customer ID and attaches payment method
4. 2-month free trial begins automatically
5. After trial, subscription charges monthly ($19 solo / $49 salon)

**Ghana/Nigeria (Paystack):**
1. Provider signs up and selects country
2. During onboarding, adds payment method (card or mobile money)
3. Paystack creates Customer Code
4. 2-month free trial begins automatically
5. After trial, subscription charges monthly (converted to GHS/NGN)

#### Client Booking (Regional):

**North America/Europe:**
- Service fee: $1.25 + 3.6% (max $8.00)
- Payment via Stripe
- Currency: USD

**Ghana:**
- Service fee: ₵10 + 2.9% (max ₵60)
- Payment via Paystack (Card, Mobile Money, Bank)
- Currency: GHS

**Nigeria:**
- Service fee: ₦1,500 + 2.9% (max ₦6,224)
- Payment via Paystack (Card, Bank Transfer, USSD)
- Currency: NGN

#### Key Points:
- No provider Connect/Subaccount setup required
- Simple card/mobile money entry for subscriptions
- Platform manages all transactions
- Regional payment optimization
- Automated subscription billing
- Regular payout schedule based on region

---

## Step 6: SendGrid Setup

1. **Create Account:** https://sendgrid.com
2. **Create API Key:**
   - Settings → API Keys → Create API Key
   - Name: `BNB Development`
   - Permissions: Full Access
   - Copy API Key

3. **Verify Sender Identity:**
   - Settings → Sender Authentication
   - Verify single sender: `noreply@yourdomain.com`

4. **Create Email Templates** (Optional):
   - Email API → Dynamic Templates
   - Create templates for:
     - Booking Confirmation
     - Booking Reminder
     - Cancellation Notice
     - Review Request

---

## Step 7: OpenAI Setup

1. **Create Account:** https://platform.openai.com
2. **Generate API Key:**
   - API Keys → Create new secret key
   - Copy and save immediately

3. **Set Usage Limits:**
   - Settings → Limits
   - Set monthly budget to control costs

---

## Step 8: Project Structure Setup

### Create Directory Structure

```bash
# Create all necessary directories
mkdir -p src/app/{(auth),(client),(provider),api}
mkdir -p src/components/{ui,shared,client,provider,admin}
mkdir -p src/lib/{ai,api,auth,db,email,payment,storage,utils}
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/stores
mkdir -p src/config
mkdir -p public/{images,fonts}
mkdir -p prisma/{migrations,seeds}
mkdir -p __tests__/{unit,integration,e2e}
```

### Initialize Shadcn/ui

> **📖 Complete Shadcn UI Setup Guide**: For detailed Shadcn UI configuration with Beauty N Brushes theme colors, see [bnb_shadcn_ui_guide.md](bnb_shadcn_ui_guide.md)

```bash
# Initialize Shadcn
npx shadcn-ui@latest init

# Follow prompts:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - Global CSS: src/app/globals.css
# - CSS variables: Yes
# - Tailwind config: tailwind.config.ts
# - Components: @/components
# - Utils: @/lib/utils
# - React Server Components: Yes
# - Write config: Yes

# Install all essential components at once
npx shadcn-ui@latest add button input label card badge avatar form select checkbox radio-group textarea switch dropdown-menu navigation-menu tabs toast alert alert-dialog dialog table skeleton separator scroll-area calendar popover tooltip sheet accordion slider
```

**Important**: After installation, you must configure the theme colors to match the Beauty N Brushes palette. See the [Shadcn UI Guide](bnb_shadcn_ui_guide.md) for:
- Complete color configuration
- Component usage examples
- Best practices
- All components with BNB theme

---

## Step 9: Configure TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

---

## Step 10: Configure Tailwind CSS

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 0 0% 10%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 10%;
    --primary: 11 36% 55%; /* #B06F64 - Dusty Rose */
    --primary-foreground: 0 0% 100%;
    --secondary: 12 36% 66%; /* #CA8D80 - Warm Taupe */
    --secondary-foreground: 0 0% 100%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 18 100% 80%; /* #FFB09E - Peach Blush */
    --accent-foreground: 207 31% 23%; /* #2A3F4D - Dark Slate Blue-Grey */
    --tertiary: 13 48% 72%; /* #DF9C8C - Blush Clay */
    --button-dark: 207 31% 23%; /* #2A3F4D - Dark Slate Blue-Grey */
    --button-light: 18 100% 80%; /* #FFB09E - Peach Blush */
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 11 36% 55%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 0 0% 10%;
    --foreground: 0 0% 98%;
    --card: 0 0% 12%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 12%;
    --popover-foreground: 0 0% 98%;
    --primary: 11 36% 55%;
    --primary-foreground: 0 0% 100%;
    --secondary: 12 36% 66%;
    --secondary-foreground: 0 0% 100%;
    --muted: 0 0% 20%;
    --muted-foreground: 0 0% 65%;
    --accent: 18 100% 80%;
    --accent-foreground: 207 31% 23%;
    --tertiary: 13 48% 72%;
    --button-dark: 207 31% 23%;
    --button-light: 18 100% 80%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 11 36% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer components {
  .page-container {
    @apply container mx-auto px-4 py-8;
  }
  
  .section-heading {
    @apply text-3xl font-bold tracking-tight;
  }
  
  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
  }
}
```

---

## Step 11: Configure ESLint & Prettier

### .eslintrc.json

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  }
}
```

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## Step 12: Configure Git Hooks (Husky)

```bash
# Install Husky
pnpm add -D husky lint-staged

# Initialize Husky
pnpm exec husky init

# Configure pre-commit hook
echo "pnpm lint-staged" > .husky/pre-commit
```

### package.json (add lint-staged config)

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

---

## Step 13: Development Scripts

### package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

---

## Step 14: Run Development Server

```bash
# Start development server
pnpm dev

# Open browser
# http://localhost:3000
```

### Verify Setup

1. **Homepage loads** without errors
2. **Database connection** works (check console)
3. **Hot reload** works when you edit files
4. **TypeScript** compilation works
5. **Tailwind CSS** styles are applied

---

## Step 15: Seed Initial Data

### prisma/seed.ts

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create service categories
  const hairCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Hair',
      slug: 'hair',
      description: 'Hair styling, braiding, cuts, and color',
      iconName: 'scissors',
      displayOrder: 1,
    },
  });

  const makeupCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Makeup',
      slug: 'makeup',
      description: 'Makeup artistry for all occasions',
      iconName: 'palette',
      displayOrder: 2,
    },
  });

  // Create subcategories
  await prisma.serviceSubcategory.createMany({
    data: [
      {
        categoryId: hairCategory.id,
        name: 'Braids',
        slug: 'braids',
        displayOrder: 1,
      },
      {
        categoryId: hairCategory.id,
        name: 'Weaves',
        slug: 'weaves',
        displayOrder: 2,
      },
      {
        categoryId: hairCategory.id,
        name: 'Natural Hair',
        slug: 'natural-hair',
        displayOrder: 3,
      },
      {
        categoryId: makeupCategory.id,
        name: 'Bridal',
        slug: 'bridal',
        displayOrder: 1,
      },
      {
        categoryId: makeupCategory.id,
        name: 'Special Events',
        slug: 'special-events',
        displayOrder: 2,
      },
    ],
  });

  // Create test admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@beautynbrushes.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```bash
# Run seed
pnpm db:seed
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
pnpm prisma db push

# View database in browser
pnpm db:studio
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
pnpm db:generate

# Clear node_modules and reinstall
rm -rf node_modules .next
pnpm install
```

### Build Errors

```bash
# Clean build
rm -rf .next

# Type check
pnpm type-check

# Rebuild
pnpm build
```

---

## Next Steps

1. ✅ **Review** the Technical Architecture Document
2. ✅ **Set up** Railway project for deployment
3. ✅ **Configure** CI/CD pipeline
4. ✅ **Start** implementing features following Cursor Rules
5. ✅ **Test** each feature thoroughly
6. ✅ **Deploy** to staging environment

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025