# Beauty N Brushes - Security & Compliance Guide

## Security Overview

This document outlines the security measures, compliance requirements, and best practices for the Beauty N Brushes platform.

---

## Security Architecture

### Defense in Depth Strategy

```
User Browser
    ↓ [HTTPS/TLS]
CloudFlare CDN (DDoS Protection)
    ↓ [Web Application Firewall]
Load Balancer (Railway)
    ↓ [Rate Limiting]
Application Server (Next.js)
    ↓ [Authentication & Authorization]
API Layer
    ↓ [Input Validation]
Business Logic
    ↓ [Encryption]
Database (PostgreSQL)
```

---

## Authentication & Authorization

### Authentication Strategy

**Technology**: NextAuth.js (Auth.js)

**Supported Methods**:
1. Email/Password (with bcrypt hashing)
2. OAuth (Google, Apple)
3. Magic Links (future)

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Maximum 128 characters
- Not in common password list

**Implementation**:
```typescript
// Password hashing
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Session Management

**Token Type**: JWT (JSON Web Token)  
**Token Expiration**: 15 minutes (access token)  
**Refresh Token**: 7 days  
**Storage**: HTTP-only cookies

**Security Features**:
- Automatic token refresh
- Secure token rotation
- Device tracking
- Suspicious activity detection

### Role-Based Access Control (RBAC)

**Roles**:
- `CLIENT`: Can book services, leave reviews
- `PROVIDER`: Can create services, manage bookings
- `ADMIN`: Full system access

**Permission Matrix**:

| Action | CLIENT | PROVIDER | ADMIN |
|--------|--------|----------|-------|
| View services | ✓ | ✓ | ✓ |
| Create booking | ✓ | ✗ | ✓ |
| Create service | ✗ | ✓ | ✓ |
| Manage bookings | Own only | Own only | All |
| Moderate content | ✗ | ✗ | ✓ |
| View financials | ✗ | Own only | All |

---

## Data Protection

### Encryption at Rest

**Database**: PostgreSQL with encryption enabled  
**Encryption Type**: AES-256  
**Key Management**: Railway managed keys

**Encrypted Fields**:
- Payment information (via Stripe)
- Social security numbers (if collected)
- Bank account details (for payouts)

### Encryption in Transit

**Protocol**: TLS 1.3  
**Certificate**: Let's Encrypt (auto-renewed)  
**Minimum TLS Version**: 1.2

**HTTPS Enforcement**:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
```

### Data Minimization

**Principles**:
- Only collect necessary data
- Regular data cleanup
- Clear retention policies
- User data export available

**Data Retention Policy**:
- Active user data: Indefinite
- Deleted user data: 30 days (soft delete)
- Booking data: 7 years (tax compliance)
- Payment data: Per PCI DSS requirements
- Logs: 90 days

---

## Input Validation & Sanitization

### Server-Side Validation

**Framework**: Zod

**Validation Strategy**:
1. Validate all inputs at API boundary
2. Sanitize HTML content
3. Validate file uploads
4. Check content length limits

**Example**:
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Input schema
const ServiceSchema = z.object({
  title: z.string().min(3).max(255).trim(),
  description: z.string().min(20).max(5000),
  priceMin: z.number().positive().max(10000),
  email: z.string().email(),
});

// Sanitize HTML
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}
```

### SQL Injection Prevention

**ORM**: Prisma (automatically prevents SQL injection)

**Safe Queries**:
```typescript
// ✅ Safe - Prisma parameterizes
const user = await db.user.findUnique({
  where: { email: userInput },
});

// ❌ Never do raw queries with user input
// await db.$executeRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`);

// ✅ If raw queries needed, use parameterization
const users = await db.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

### XSS Prevention

**React Protection**: Automatic escaping  
**CSP Headers**: Content Security Policy enabled

**CSP Configuration**:
```typescript
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://api.stripe.com;
  frame-src https://js.stripe.com;
`;
```

---

## File Upload Security

### Upload Validation

**Allowed File Types**:
- Images: JPEG, PNG, WebP, GIF
- Documents: PDF
- Maximum size: 10MB per file

**Validation Steps**:
1. Check MIME type
2. Verify file extension
3. Scan file size
4. Virus scan (ClamAV)
5. Image validation (dimensions, metadata)

**Implementation**:
```typescript
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function validateUpload(file: File): Promise<void> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File too large');
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError('Invalid file type');
  }

  // Check file signature (magic bytes)
  const buffer = await file.arrayBuffer();
  const isValid = await verifyFileSignature(buffer, file.type);
  
  if (!isValid) {
    throw new ValidationError('File signature mismatch');
  }
}
```

### Storage Security

**Provider**: AWS S3  
**Access Control**: Private buckets with signed URLs  
**URL Expiration**: 1 hour for signed URLs  
**Bucket Policy**: Deny public access

**S3 Configuration**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function generateUploadUrl(
  fileName: string,
  fileType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `uploads/${userId}/${fileName}`,
    ContentType: fileType,
    ServerSideEncryption: 'AES256',
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

---

## Payment Security

### PCI DSS Compliance

**Level**: Level 4 (Stripe handles all card data)  
**Card Data**: Never stored on our servers  
**Integration**: Stripe Elements (PCI compliant UI)

**Implementation**:
- Use Stripe Payment Intents API
- No raw card data touches our servers
- Stripe handles 3D Secure authentication
- All payment webhooks verified

**Webhook Verification**:
```typescript
import Stripe from 'stripe';

async function verifyStripeWebhook(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    throw new Error('Invalid webhook signature');
  }
}
```

---

## API Security

### Rate Limiting

**Strategy**: Token bucket algorithm  
**Storage**: Redis

**Limits**:
- Anonymous: 60 requests/hour
- Authenticated: 1000 requests/hour
- AI endpoints: 100 requests/hour

**Implementation**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 h'),
  analytics: true,
});

export async function checkRateLimit(
  identifier: string
): Promise<boolean> {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

### CORS Configuration

**Allowed Origins**: Whitelist only

```typescript
const allowedOrigins = [
  'https://beautyandbrushes.com',
  'https://www.beautyandbrushes.com',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean);

export const corsConfig = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};
```

### CSRF Protection

**Method**: Double-submit cookie pattern  
**Implementation**: Built into NextAuth.js

---

## Security Headers

### Recommended Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
];
```

---

## Compliance Requirements

### GDPR (EU Users)

**Required Features**:
- [ ] Cookie consent banner
- [ ] Privacy policy
- [ ] Data processing agreements
- [ ] Right to access data
- [ ] Right to delete data
- [ ] Right to data portability
- [ ] Data breach notification (72 hours)

**Implementation**:
```typescript
// Data export API
export async function exportUserData(userId: string) {
  const userData = await db.user.findUnique({
    where: { id: userId },
    include: {
      bookings: true,
      reviews: true,
      messages: true,
      favorites: true,
    },
  });

  return {
    format: 'JSON',
    data: userData,
    generatedAt: new Date().toISOString(),
  };
}

// Data deletion API
export async function deleteUserData(userId: string) {
  await db.$transaction([
    db.message.deleteMany({ where: { senderId: userId } }),
    db.review.deleteMany({ where: { clientId: userId } }),
    db.booking.updateMany({
      where: { clientId: userId },
      data: { clientId: null }, // Anonymize bookings
    }),
    db.user.delete({ where: { id: userId } }),
  ]);
}
```

### CCPA (California Users)

**Required Features**:
- [ ] Do Not Sell My Personal Information
- [ ] Privacy policy with data categories
- [ ] Opt-out mechanism
- [ ] Data disclosure
- [ ] Non-discrimination clause

### PCI DSS

**Compliance Level**: Level 4 (via Stripe)

**Requirements Met**:
- ✓ Secure network (HTTPS)
- ✓ Cardholder data protection (not stored)
- ✓ Vulnerability management
- ✓ Access control
- ✓ Network monitoring
- ✓ Security policy

### ADA Compliance (Accessibility)

**WCAG 2.1 Level AA**:
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ratios
- [ ] Alt text for images
- [ ] ARIA labels
- [ ] Focus indicators
- [ ] Form validation

---

## Security Monitoring

### Logging Strategy

**What to Log**:
- Authentication attempts
- Authorization failures
- Payment transactions
- Data access (sensitive)
- API errors
- Rate limit violations
- Security events

**What NOT to Log**:
- Passwords
- Credit card numbers
- Session tokens
- Personal identifiable information (PII)

**Implementation**:
```typescript
import { logger } from '@/lib/logger';

// Security event logging
logger.warn({
  event: 'failed_login_attempt',
  userId: userId,
  ip: request.ip,
  timestamp: new Date().toISOString(),
});

// ❌ Never log sensitive data
// logger.info({ password: userInput }); // NO!
```

### Intrusion Detection

**Tools**:
- Sentry for error tracking
- CloudFlare for DDoS protection
- Railway for infrastructure monitoring

**Alerts**:
- Multiple failed login attempts
- Unusual API usage patterns
- Payment fraud attempts
- Data breach attempts
- System errors

---

## Incident Response Plan

### Security Incident Response

**Phase 1: Detection & Analysis** (Immediate)
1. Identify incident type and severity
2. Assemble incident response team
3. Isolate affected systems if needed
4. Begin evidence collection

**Phase 2: Containment** (Short-term)
1. Implement short-term containment
2. Backup affected systems
3. Implement long-term containment
4. Update security measures

**Phase 3: Eradication** (As needed)
1. Remove threat from environment
2. Patch vulnerabilities
3. Update security controls

**Phase 4: Recovery** (Progressive)
1. Restore affected systems
2. Verify system integrity
3. Monitor for repeated attack
4. Return to normal operations

**Phase 5: Post-Incident** (After resolution)
1. Document incident timeline
2. Identify root cause
3. Update security policies
4. Conduct team training
5. Notify affected parties if required

### Data Breach Response

**Immediate Actions**:
1. Assess scope of breach
2. Notify affected users (as required by law)
3. Report to authorities (if required by regulation)
4. Offer credit monitoring (if applicable)
5. Document incident

---

## Security Best Practices

### Development

- [ ] Code reviews for security issues
- [ ] Dependency vulnerability scanning
- [ ] Static code analysis
- [ ] Secrets in environment variables
- [ ] No hardcoded credentials
- [ ] Principle of least privilege

### Deployment

- [ ] Automated security scanning
- [ ] Infrastructure as code
- [ ] Immutable infrastructure
- [ ] Regular backups
- [ ] Disaster recovery testing

### Operations

- [ ] Regular security audits
- [ ] Penetration testing (annually)
- [ ] Security awareness training
- [ ] Incident response drills
- [ ] Vendor security reviews

---

## Security Checklist

### Pre-Launch

- [ ] Security audit completed
- [ ] Penetration test passed
- [ ] SSL/TLS configured
- [ ] Security headers set
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Authentication tested
- [ ] Authorization verified
- [ ] Input validation complete
- [ ] File upload security verified
- [ ] Payment integration tested
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie policy published
- [ ] GDPR compliance verified
- [ ] Backup system tested
- [ ] Monitoring configured
- [ ] Incident response plan ready

### Ongoing

- [ ] Regular dependency updates
- [ ] Ongoing security reviews
- [ ] Periodic penetration tests
- [ ] Regular security audits
- [ ] Continuous monitoring
- [ ] Regular backups
- [ ] Security training

---

## Third-Party Security

### Vendor Assessment

**Required for All Vendors**:
- [ ] SOC 2 Type II certification
- [ ] GDPR compliance
- [ ] Data processing agreement
- [ ] Security documentation review
- [ ] Incident response plan
- [ ] Data retention policy

**Current Vendors**:
- **Railway**: ✓ SOC 2, ISO 27001
- **AWS**: ✓ Multiple certifications
- **Stripe**: ✓ PCI DSS Level 1
- **SendGrid**: ✓ SOC 2
- **OpenAI**: ✓ SOC 2

---

## Security Contacts

**Security Email**: security@beautyandbrushes.com  
**Bug Bounty Program**: TBD (Phase 2)  
**Response Time**: 24 hours for critical issues

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025  
**Next Review**: As needed or per security audit schedule