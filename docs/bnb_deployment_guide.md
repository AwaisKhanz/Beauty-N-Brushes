# Beauty N Brushes - Deployment & DevOps Guide

## Deployment Strategy Overview

### Environments

1. **Development**: Local machine
2. **Staging**: Railway staging environment
3. **Production**: Railway production environment

### Deployment Flow

```
Developer → GitHub (PR) → CI/CD Pipeline → Staging → Manual Approval → Production
```

---

## Railway Setup

### Step 1: Create Railway Account

1. Sign up at https://railway.app
2. Connect GitHub account
3. Create new project: `beauty-n-brushes`

### Step 2: Create Services

#### Database Service (PostgreSQL)

```bash
# In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Name: bnb-postgres-production
3. Copy connection details
```

Railway provides:
- `DATABASE_URL`: Connection string with pooling
- `DATABASE_PRIVATE_URL`: Direct connection for migrations

#### Redis Service

```bash
# In Railway dashboard:
1. Click "New" → "Database" → "Redis"
2. Name: bnb-redis-production
3. Copy REDIS_URL
```

#### Application Service

```bash
# In Railway dashboard:
1. Click "New" → "GitHub Repo"
2. Select: beauty-n-brushes repository
3. Configure:
   - Name: bnb-app-production
   - Root Directory: /
   - Build Command: pnpm build
   - Start Command: pnpm start
```

### Step 3: Configure Environment Variables

In Railway dashboard for Application Service:

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_PRIVATE_URL}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://beautyandbrushes.com

# NextAuth
NEXTAUTH_URL=https://beautyandbrushes.com
NEXTAUTH_SECRET=<generate-new-secret>

# AWS S3
AWS_ACCESS_KEY_ID=<from-aws>
AWS_SECRET_ACCESS_KEY=<from-aws>
AWS_REGION=us-east-1
AWS_S3_BUCKET=bnb-media-production
NEXT_PUBLIC_CLOUDFRONT_URL=https://d1234567890.cloudfront.net

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@beautyandbrushes.com
SENDGRID_FROM_NAME=Beauty N Brushes

# OpenAI
OPENAI_API_KEY=sk-...

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 4: Configure Domains

```bash
# In Railway dashboard → Settings → Domains:
1. Add custom domain: beautyandbrushes.com
2. Add subdomain: www.beautyandbrushes.com
3. Configure DNS records (A/CNAME)
4. Wait for SSL certificate provisioning
```

---

## CI/CD Pipeline Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches:
      - main
      - staging
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '20'

jobs:
  # Type checking and linting
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
          
      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
            
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run TypeScript type check
        run: pnpm type-check
        
      - name: Run ESLint
        run: pnpm lint
        
      - name: Check formatting
        run: pnpm format --check

  # Unit and integration tests
  test:
    runs-on: ubuntu-latest
    needs: quality-checks
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: bnb_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Setup test environment
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/bnb_test
          REDIS_URL: redis://localhost:6379
        run: |
          pnpm prisma generate
          pnpm prisma migrate deploy
          
      - name: Run unit tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/bnb_test
          REDIS_URL: redis://localhost:6379
        run: pnpm test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  # Build and test the application
  build:
    runs-on: ubuntu-latest
    needs: [quality-checks, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build application
        env:
          DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
          NEXTAUTH_SECRET: dummy-secret-for-build
          NEXTAUTH_URL: https://example.com
        run: pnpm build
        
      - name: Check build output
        run: |
          if [ ! -d ".next" ]; then
            echo "Build failed: .next directory not found"
            exit 1
          fi

  # Deploy to staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [quality-checks, test, build]
    if: github.ref == 'refs/heads/staging'
    environment:
      name: staging
      url: https://staging.beautyandbrushes.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway Staging
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_STAGING_TOKEN }}
          service: bnb-app-staging
          
      - name: Run database migrations
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
        run: |
          railway run --service bnb-app-staging -- pnpm prisma migrate deploy

  # Deploy to production
  deploy-production:
    runs-on: ubuntu-latest
    needs: [quality-checks, test, build]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://beautyandbrushes.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway Production
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_PRODUCTION_TOKEN }}
          service: bnb-app-production
          
      - name: Run database migrations
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_PRODUCTION_TOKEN }}
        run: |
          railway run --service bnb-app-production -- pnpm prisma migrate deploy
          
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### GitHub Secrets Setup

Add these secrets in GitHub repository settings:

```bash
# Railway
RAILWAY_STAGING_TOKEN=<from-railway>
RAILWAY_PRODUCTION_TOKEN=<from-railway>

# Slack (optional)
SLACK_WEBHOOK=<webhook-url>
```

---

## Database Migrations

### Migration Workflow

```bash
# 1. Create migration locally
pnpm prisma migrate dev --name add_user_preferences

# 2. Test migration
pnpm prisma migrate reset

# 3. Commit migration files
git add prisma/migrations
git commit -m "feat(db): add user preferences table"

# 4. Push to GitHub
git push origin feature/user-preferences

# 5. CI/CD will apply migration automatically on deploy
```

### Manual Migration (if needed)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migration in staging
railway run --service bnb-app-staging -- pnpm prisma migrate deploy

# Run migration in production
railway run --service bnb-app-production -- pnpm prisma migrate deploy
```

---

## Monitoring & Logging

### Sentry Setup

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === 'production',
});

// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === 'production',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### Application Logging

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV === 'production' && {
    // Production: structured JSON logs
    transport: undefined,
  }),
  ...(process.env.NODE_ENV === 'development' && {
    // Development: pretty print
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
});

// Usage
logger.info({ userId: '123' }, 'User logged in');
logger.error({ error: err }, 'Failed to process payment');
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      redis: false,
    },
  };

  try {
    // Check database
    await db.$queryRaw`SELECT 1`;
    checks.checks.database = true;
  } catch (error) {
    checks.status = 'unhealthy';
    console.error('Database health check failed:', error);
  }

  try {
    // Check Redis
    await redis.ping();
    checks.checks.redis = true;
  } catch (error) {
    checks.status = 'unhealthy';
    console.error('Redis health check failed:', error);
  }

  return NextResponse.json(checks, {
    status: checks.status === 'healthy' ? 200 : 503,
  });
}
```

---

## Performance Monitoring

### Vercel Analytics (if using Vercel)

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Performance Tracking

```typescript
// lib/analytics.ts
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Usage
trackEvent('booking_created', 'booking', service.id, service.price);
```

---

## Backup Strategy

### Backup Strategy

Railway provides automatic daily backups. For additional safety:

```bash
# Manual backup script
#!/bin/bash

# Set variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/bnb_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Export database
railway run --service bnb-postgres-production -- \
  pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" \
  s3://bnb-backups/database/$TIMESTAMP/ \
  --region us-east-1

# Delete local file
rm "$BACKUP_FILE.gz"

# Keep only recent backups in S3
aws s3 ls s3://bnb-backups/database/ | \
  while read -r line; do
    createDate=$(echo $line | awk '{print $1}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "retention period" +%s)
    if [[ $createDate -lt $olderThan ]]; then
      fileName=$(echo $line | awk '{print $4}')
      aws s3 rm s3://bnb-backups/database/$fileName
    fi
  done
```

Schedule with automated backup system (configure based on needs)

---

## Rollback Procedures

### Application Rollback

```bash
# Via Railway Dashboard:
1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Redeploy"

# Via Railway CLI:
railway rollback --service bnb-app-production
```

### Database Rollback

```bash
# Revert last migration
pnpm prisma migrate resolve --rolled-back <migration-name>

# Apply previous schema state
railway run --service bnb-app-production -- \
  pnpm prisma migrate deploy
```

---

## Scaling Strategies

### Horizontal Scaling

Railway auto-scales based on:
- CPU usage
- Memory usage
- Request volume

Configure in Railway dashboard:
```yaml
# railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Database Scaling

1. **Connection Pooling**: Already configured via Prisma
2. **Read Replicas**: Add through Railway for read-heavy operations
3. **Caching**: Use Redis for frequently accessed data

### CDN Optimization

CloudFront automatically handles:
- Geographic distribution
- Automatic compression
- HTTP/2 and HTTP/3 support
- DDoS protection

---

## Security Checklist

### Pre-Deployment Security

- [ ] All secrets stored in environment variables
- [ ] No hardcoded API keys or passwords
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (via Prisma)
- [ ] XSS prevention (React default + CSP headers)
- [ ] CSRF protection enabled
- [ ] Security headers configured

### Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Deployment Checklist

### Before Each Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Dependencies updated (security patches)
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Team notified

### After Deployment

- [ ] Health check endpoint responding
- [ ] Database connections stable
- [ ] No errors in logs
- [ ] Key user flows tested
- [ ] Performance metrics normal
- [ ] Monitoring alerts configured
- [ ] Team notified of completion

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025