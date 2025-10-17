# Beauty N Brushes - Technical Architecture Updates (DEPRECATED)

> **⚠️ DEPRECATION NOTICE**
>
> This document is **OUTDATED** and contains incorrect information about:
> - Flutterwave integration (REPLACED WITH PAYSTACK)
> - Old payment processing approach
> - Stripe Connect requirements (NOT REQUIRED)
>
> **Current System**:
> - **Payment**: Stripe (NA/EU) + Paystack (Ghana/Nigeria)
> - **Provider Onboarding**: Simple card/mobile money entry (no Connect/Subaccounts)
> - **Subscription**: $19/month (solo) or $49/month (salon) with 2-month free trial
> - **Service Fees**: Regional rates (charged to clients)
>   - North America: $1.25 + 3.6% (max $8.00)
>   - Ghana: ₵10 + 2.9% (max ₵60)
>   - Nigeria: ₦1,500 + 2.9% (max ₦6,224)
>
> **Please refer to these updated documents**:
> 1. [bnb_requirements.md](bnb_requirements.md) - Official requirements
> 2. [bnb_tech_architecture.md](bnb_tech_architecture.md) - Current architecture  
> 3. [bnb_cursor_rules.md](bnb_cursor_rules.md) - Development standards
> 4. [bnb_setup_guide.md](bnb_setup_guide.md) - Setup instructions
> 5. [bnb_executive_summary.md](bnb_executive_summary.md) - Project overview
>
> ---
> **This file is kept for historical reference only.**
> ---

# Beauty N Brushes - Technical Architecture Updates (Client Confirmed)

## Critical Changes from Client Confirmation

### Payment Processing

**DUAL PAYMENT PROVIDERS** (CRITICAL):

**Stripe** (North America & Europe):

- Stripe Connect for marketplace
- Provider receives 100% of payment (no fees)
- Service fees charged to CLIENT, not provider

**Flutterwave** (African Countries):

- Ghana
- Nigeria
- Provider receives 100% of payment (no fees)
- Service fees charged to CLIENT, not provider

**Platform Fee Structure** (Charged to Clients):

| Region        | Formula                | Minimum | Cap    |
| ------------- | ---------------------- | ------- | ------ |
| North America | $1.25 + 3.6% of total  | $1.25   | $8.00  |
| Ghana         | ₵10 + 2.9% of total    | ₵10     | ₵60    |
| Nigeria       | ₦1,500 + 2.9% of total | ₦1,500  | ₦6,224 |

**Minimum Payout Amounts**:

- North America: $20 USD
- Ghana: ₵250 GHS
- Nigeria: ₦15,000 NGN

---

### Database Schema Additions

#### New Tables Required:

**1. salon_profiles** (NEW - Multi-Stylist Accounts):

```sql
CREATE TABLE salon_profiles (
  id UUID PRIMARY KEY,
  provider_profile_id UUID REFERENCES provider_profiles(id),
  is_salon BOOLEAN DEFAULT FALSE,
  team_member_limit INT DEFAULT 10,
  subscription_tier VARCHAR(20), -- 'solo' or 'salon'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE salon_team_members (
  id UUID PRIMARY KEY,
  salon_id UUID REFERENCES salon_profiles(id),
  stylist_user_id UUID REFERENCES users(id),
  stylist_profile_id UUID REFERENCES provider_profiles(id),
  role VARCHAR(20), -- 'stylist', 'assistant', etc.
  can_manage_own_services BOOLEAN DEFAULT TRUE,
  can_manage_own_calendar BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  invited_email VARCHAR(255),
  invitation_status VARCHAR(20), -- 'pending', 'accepted', 'declined'
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**2. service_addons** (NEW - Add-on Services):

```sql
CREATE TABLE service_addons (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  addon_name VARCHAR(255) NOT NULL,
  addon_description TEXT,
  addon_price DECIMAL(10, 2) NOT NULL,
  addon_duration_minutes INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE booking_addons (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  addon_id UUID REFERENCES service_addons(id),
  addon_name VARCHAR(255),
  addon_price DECIMAL(10, 2),
  created_at TIMESTAMP
);
```

**3. payment_regions** (NEW - Multi-Region Support):

```sql
CREATE TABLE payment_regions (
  id UUID PRIMARY KEY,
  region_code VARCHAR(10) NOT NULL, -- 'NA', 'GH', 'NG'
  region_name VARCHAR(100),
  currency_code VARCHAR(3), -- 'USD', 'GHS', 'NGN'
  payment_provider VARCHAR(20), -- 'stripe', 'flutterwave'
  service_fee_formula JSONB, -- {base: 1.25, percentage: 3.6, cap: 8.00}
  minimum_payout_amount DECIMAL(10, 2),
  active BOOLEAN DEFAULT TRUE
);
```

**4. instagram_connections** (NEW - Instagram Integration):

```sql
CREATE TABLE instagram_connections (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id),
  instagram_username VARCHAR(255),
  instagram_user_id VARCHAR(255),
  access_token TEXT,
  token_expires_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(20), -- 'connected', 'disconnected', 'error'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE instagram_media_imports (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id),
  instagram_media_id VARCHAR(255),
  media_url VARCHAR(500),
  media_type VARCHAR(20), -- 'image', 'video'
  thumbnail_url VARCHAR(500),
  caption TEXT,
  imported_to_service_id UUID REFERENCES services(id),
  linked_to_portfolio BOOLEAN DEFAULT FALSE,
  import_date TIMESTAMP,
  created_at TIMESTAMP
);
```

**5. ai_generated_content** (NEW - Track AI Usage):

```sql
CREATE TABLE ai_generated_content (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50), -- 'service_description', 'policy', 'message_draft'
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  original_input TEXT,
  ai_generated_output TEXT,
  was_edited BOOLEAN DEFAULT FALSE,
  final_content TEXT,
  ai_model_used VARCHAR(50),
  generation_cost DECIMAL(10, 4),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**6. client_preferences** (NEW - Store Client Hair Type Info):

```sql
CREATE TABLE client_preferences (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  hair_type VARCHAR(50), -- '4c', '3b', 'relaxed', etc.
  hair_length VARCHAR(50),
  skin_tone VARCHAR(50),
  preferred_styles TEXT[], -- array of style preferences
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(client_id)
);
```

**7. waitlist** (NEW - Booking Waitlist):

```sql
CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES provider_profiles(id),
  service_id UUID REFERENCES services(id),
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  notified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20), -- 'active', 'notified', 'booked', 'expired'
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

**8. consultation_bookings** (NEW - Free/Virtual Consultations):

```sql
CREATE TABLE consultation_bookings (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES provider_profiles(id),
  consultation_type VARCHAR(20), -- 'free', 'paid'
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_meeting_link VARCHAR(500),
  date DATE,
  time TIME,
  duration_minutes INT DEFAULT 30,
  notes TEXT,
  status VARCHAR(20), -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMP
);
```

**9. subscription_plans** (NEW - Provider Subscriptions):

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  plan_name VARCHAR(50), -- 'solo', 'salon'
  plan_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  trial_days INT DEFAULT 60, -- 2 months free trial
  features JSONB,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE provider_subscriptions (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(20), -- 'trial', 'active', 'cancelled', 'expired'
  trial_start_date DATE,
  trial_end_date DATE,
  subscription_start_date DATE,
  next_billing_date DATE,
  cancelled_at TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  flutterwave_subscription_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**10. service_packages** (NEW - Bundled Services):

```sql
CREATE TABLE service_packages (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES provider_profiles(id),
  package_name VARCHAR(255) NOT NULL,
  package_description TEXT,
  total_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_duration_minutes INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE package_services (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES service_packages(id),
  service_id UUID REFERENCES services(id),
  service_order INT DEFAULT 0
);
```

---

### Updated Existing Tables

**services table - Add columns**:

```sql
ALTER TABLE services ADD COLUMN ai_generated_description BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN ai_suggested_price_min DECIMAL(10, 2);
ALTER TABLE services ADD COLUMN ai_suggested_price_max DECIMAL(10, 2);
ALTER TABLE services ADD COLUMN ai_suggested_duration INT;
ALTER TABLE services ADD COLUMN deposit_type VARCHAR(20); -- 'percentage' or 'flat'
ALTER TABLE services ADD COLUMN deposit_amount DECIMAL(10, 2);
```

**provider_profiles table - Add columns**:

```sql
ALTER TABLE provider_profiles ADD COLUMN is_salon BOOLEAN DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN can_pause_profile BOOLEAN DEFAULT TRUE;
ALTER TABLE provider_profiles ADD COLUMN profile_paused BOOLEAN DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN paused_at TIMESTAMP;
ALTER TABLE provider_profiles ADD COLUMN cover_photo_url VARCHAR(500);
ALTER TABLE provider_profiles ADD COLUMN instagram_handle VARCHAR(255);
ALTER TABLE provider_profiles ADD COLUMN payment_provider VARCHAR(20); -- 'stripe' or 'flutterwave'
ALTER TABLE provider_profiles ADD COLUMN flutterwave_account_id VARCHAR(255);
ALTER TABLE provider_profiles ADD COLUMN region_code VARCHAR(10); -- 'NA', 'GH', 'NG'
ALTER TABLE provider_profiles ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id);
```

**provider_policies table - Add columns**:

```sql
ALTER TABLE provider_policies ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE provider_policies ADD COLUMN policy_approved_by_provider BOOLEAN DEFAULT FALSE;
```

**bookings table - Add columns**:

```sql
ALTER TABLE bookings ADD COLUMN home_service_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN home_service_address TEXT;
ALTER TABLE bookings ADD COLUMN home_service_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN total_addons_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN service_fee_amount DECIMAL(10, 2); -- Platform fee charged to client
ALTER TABLE bookings ADD COLUMN balance_payment_method VARCHAR(20); -- 'online', 'cash', 'pending'
ALTER TABLE bookings ADD COLUMN balance_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN balance_paid_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN assigned_stylist_id UUID REFERENCES provider_profiles(id); -- For salon bookings
ALTER TABLE bookings ADD COLUMN any_available_stylist BOOLEAN DEFAULT FALSE;
```

**messages table - Add columns**:

```sql
ALTER TABLE messages ADD COLUMN ai_drafted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN ai_draft_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN ai_model_used VARCHAR(50);
```

**users table - Add columns**:

```sql
ALTER TABLE users ADD COLUMN region_code VARCHAR(10); -- 'NA', 'GH', 'NG'
ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(3); -- 'USD', 'GHS', 'NGN'
```

---

### API Architecture Updates

#### New API Endpoints Required:

**Salon Management**:

```
POST   /api/salons/create
GET    /api/salons/:salonId
POST   /api/salons/:salonId/invite-stylist
GET    /api/salons/:salonId/team-members
PATCH  /api/salons/:salonId/team-members/:memberId
DELETE /api/salons/:salonId/team-members/:memberId
POST   /api/salons/:salonId/assign-booking
```

**Service Add-ons**:

```
POST   /api/services/:serviceId/addons
GET    /api/services/:serviceId/addons
PATCH  /api/services/:serviceId/addons/:addonId
DELETE /api/services/:serviceId/addons/:addonId
```

**Instagram Integration**:

```
POST   /api/providers/instagram/connect
GET    /api/providers/instagram/media
POST   /api/providers/instagram/import-media
POST   /api/providers/instagram/link-to-service
DELETE /api/providers/instagram/disconnect
```

**AI Features**:

```
POST   /api/ai/generate-description
POST   /api/ai/generate-policy
POST   /api/ai/suggest-price
POST   /api/ai/draft-message
POST   /api/ai/match-inspiration
POST   /api/ai/analyze-image
POST   /api/ai/chatbot (inquiry assistant)
```

**Service Packages**:

```
POST   /api/packages/create
GET    /api/packages/:packageId
PATCH  /api/packages/:packageId
DELETE /api/packages/:packageId
GET    /api/providers/:providerId/packages
```

**Waitlist**:

```
POST   /api/waitlist/join
GET    /api/waitlist/my-entries
DELETE /api/waitlist/:entryId
POST   /api/waitlist/notify (admin/cron)
```

**Consultation Bookings**:

```
POST   /api/consultations/book
GET    /api/consultations/:consultationId
PATCH  /api/consultations/:consultationId
DELETE /api/consultations/:consultationId
```

**Payment Regions**:

```
GET    /api/regions (list available regions)
GET    /api/regions/:regionCode/fee-calculator
```

**Subscriptions**:

```
GET    /api/subscriptions/plans
POST   /api/subscriptions/subscribe
POST   /api/subscriptions/cancel
GET    /api/subscriptions/current
POST   /api/subscriptions/webhooks/stripe
POST   /api/subscriptions/webhooks/flutterwave
```

---

### Payment Integration Architecture

#### Dual Provider Setup:

**Region Detection Flow**:

```typescript
// Determine payment provider based on region
function getPaymentProvider(regionCode: string): "stripe" | "flutterwave" {
  const stripeRegions = ["NA", "EU"];
  const flutterwaveRegions = ["GH", "NG"];

  if (stripeRegions.includes(regionCode)) return "stripe";
  if (flutterwaveRegions.includes(regionCode)) return "flutterwave";

  return "stripe"; // default
}
```

**Service Fee Calculation**:

```typescript
interface RegionFeeStructure {
  base: number;
  percentage: number;
  cap: number;
  currency: string;
}

const FEE_STRUCTURES: Record<string, RegionFeeStructure> = {
  NA: { base: 1.25, percentage: 3.6, cap: 8.0, currency: "USD" },
  GH: { base: 10, percentage: 2.9, cap: 60, currency: "GHS" },
  NG: { base: 1500, percentage: 2.9, cap: 6224, currency: "NGN" },
};

function calculateServiceFee(amount: number, regionCode: string): number {
  const structure = FEE_STRUCTURES[regionCode];
  const calculatedFee = structure.base + (amount * structure.percentage) / 100;
  return Math.min(calculatedFee, structure.cap);
}
```

**Payment Processing Flow**:

```typescript
async function processBookingPayment(booking: Booking) {
  const provider = await getProvider(booking.providerId);
  const paymentProvider = provider.paymentProvider;

  // Calculate service fee (charged to client)
  const serviceFee = calculateServiceFee(
    booking.depositAmount,
    provider.regionCode
  );

  // Total amount from client = deposit + service fee
  const totalCharge = booking.depositAmount + serviceFee;

  if (paymentProvider === "stripe") {
    return await processStripePayment({
      amount: totalCharge,
      providerAmount: booking.depositAmount,
      serviceFee: serviceFee,
      connectedAccountId: provider.stripeAccountId,
    });
  } else {
    return await processFlutterwavePayment({
      amount: totalCharge,
      providerAmount: booking.depositAmount,
      serviceFee: serviceFee,
      subaccountId: provider.flutterwaveAccountId,
    });
  }
}
```

---

### AI Integration Architecture

#### AI Cost Management:

**Usage Tracking**:

```typescript
interface AIUsageLog {
  userId: string;
  feature: string; // 'description', 'policy', 'message_draft', 'image_match'
  model: string; // 'gpt-4-vision', 'gemini-vision'
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  timestamp: Date;
}

// Track all AI usage for cost monitoring
async function logAIUsage(usage: AIUsageLog) {
  await db.aiUsageLog.create({ data: usage });
}
```

**Cost Optimization Strategy**:

```typescript
// Use cheaper models for simpler tasks
function selectAIModel(task: string): string {
  const simpleTasks = ["description", "policy", "message_draft"];
  const complexTasks = ["image_match", "style_detection"];

  if (simpleTasks.includes(task)) {
    return "gpt-4-turbo"; // Cheaper
  }

  if (complexTasks.includes(task)) {
    return "gpt-4-vision"; // More expensive but necessary
  }

  return "gpt-4-turbo";
}

// Implement caching for repeated AI requests
async function getCachedAIResponse(cacheKey: string) {
  const cached = await redis.get(`ai:${cacheKey}`);
  if (cached) return JSON.parse(cached);
  return null;
}

async function cacheAIResponse(
  cacheKey: string,
  response: any,
  ttl: number = 3600
) {
  await redis.setex(`ai:${cacheKey}`, ttl, JSON.stringify(response));
}
```

#### AI Feature Implementation:

**1. AI Auto-Description**:

```typescript
async function generateServiceDescription(
  title: string,
  category: string,
  providerStyle?: string
): Promise<string> {
  const cacheKey = `desc:${title}:${category}`;
  const cached = await getCachedAIResponse(cacheKey);
  if (cached) return cached;

  const prompt = `Generate a professional, engaging service description for a beauty service.
  
Service Title: ${title}
Category: ${category}
Provider Style: ${providerStyle || "professional and friendly"}

Requirements:
- 2-3 sentences
- Highlight benefits
- Include relevant details
- Professional tone
- No placeholder text`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const description = response.choices[0].message.content;
  await cacheAIResponse(cacheKey, description);

  await logAIUsage({
    userId: "system",
    feature: "description",
    model: "gpt-4-turbo",
    inputTokens: response.usage.prompt_tokens,
    outputTokens: response.usage.completion_tokens,
    estimatedCost: calculateCost(response.usage),
    timestamp: new Date(),
  });

  return description;
}
```

**2. AI Message Assistant**:

```typescript
async function generateMessageDraft(
  providerPolicies: any,
  providerTone: string,
  clientMessage: string,
  availability: any
): Promise<string> {
  const prompt = `You are drafting a reply for a beauty professional.

Provider's Communication Style: ${providerTone}
Provider's Policies: ${JSON.stringify(providerPolicies)}
Provider's Availability: ${JSON.stringify(availability)}

Client's Message: "${clientMessage}"

Generate a helpful, professional reply that:
- Answers the client's question
- References relevant policies if needed
- Suggests available time slots if asking about availability
- Matches the provider's communication style
- Is warm and friendly`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  return response.choices[0].message.content;
}
```

**3. AI Inquiry Assistant (Chatbot)**:

```typescript
async function handleChatbotQuery(
  query: string,
  context: "homepage" | "provider_profile",
  providerId?: string
): Promise<string> {
  let systemPrompt = "";

  if (context === "homepage") {
    systemPrompt = `You are a helpful assistant for Beauty N Brushes platform.
Help clients:
- Find services
- Navigate the platform
- Understand how booking works
- Answer general questions`;
  } else {
    const provider = await getProviderData(providerId);
    systemPrompt = `You are answering questions about ${provider.businessName}.

Services: ${JSON.stringify(provider.services)}
Pricing: ${JSON.stringify(provider.pricing)}
Availability: ${JSON.stringify(provider.availability)}
Policies: ${JSON.stringify(provider.policies)}

Answer client questions accurately based on this information.`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
```

---

### Instagram Integration Architecture

**OAuth Flow**:

```typescript
// Step 1: Redirect to Instagram OAuth
async function initiateInstagramConnection(providerId: string) {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`;
  const clientId = process.env.INSTAGRAM_CLIENT_ID;

  const authUrl = `https://api.instagram.com/oauth/authorize
    ?client_id=${clientId}
    &redirect_uri=${redirectUri}
    &scope=user_profile,user_media
    &response_type=code
    &state=${providerId}`;

  return authUrl;
}

// Step 2: Handle callback and exchange code for token
async function handleInstagramCallback(code: string, providerId: string) {
  const tokenResponse = await fetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`,
        code: code,
      }),
    }
  );

  const data = await tokenResponse.json();

  // Store connection
  await db.instagramConnection.create({
    data: {
      providerId,
      instagramUserId: data.user_id,
      instagramUsername: data.username,
      accessToken: data.access_token,
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  });
}

// Step 3: Fetch and import media
async function importInstagramMedia(providerId: string) {
  const connection = await db.instagramConnection.findUnique({
    where: { providerId },
  });

  if (!connection) throw new Error("Instagram not connected");

  const mediaResponse = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&access_token=${connection.accessToken}`
  );

  const data = await mediaResponse.json();

  // Store imported media
  for (const media of data.data) {
    await db.instagramMediaImport.create({
      data: {
        providerId,
        instagramMediaId: media.id,
        mediaUrl: media.media_url,
        mediaType: media.media_type.toLowerCase(),
        thumbnailUrl: media.thumbnail_url,
        caption: media.caption,
        importDate: new Date(),
      },
    });
  }

  return data.data;
}
```

---

### Subscription Management

**Subscription Plans Setup**:

```typescript
const SUBSCRIPTION_PLANS = [
  {
    planName: "solo",
    planPrice: 19.0,
    currency: "USD",
    billingCycle: "monthly",
    trialDays: 60, // 2 months free
    features: {
      maxServices: 50,
      maxPhotos: 500,
      aiFeatures: true,
      analytics: true,
      prioritySupport: false,
    },
  },
  {
    planName: "salon",
    planPrice: 49.0,
    currency: "USD",
    billingCycle: "monthly",
    trialDays: 60, // 2 months free
    features: {
      maxServices: "unlimited",
      maxPhotos: "unlimited",
      maxTeamMembers: 20,
      aiFeatures: true,
      analytics: true,
      prioritySupport: true,
      multiStylistBooking: true,
    },
  },
];
```

**Subscription Processing**:

```typescript
async function createSubscription(providerId: string, planName: string) {
  const provider = await getProvider(providerId);
  const plan = SUBSCRIPTION_PLANS.find((p) => p.planName === planName);

  // Create subscription in payment provider
  let subscriptionId;

  if (provider.paymentProvider === "stripe") {
    const subscription = await stripe.subscriptions.create({
      customer: provider.stripeCustomerId,
      items: [{ price: plan.stripePriceId }],
      trial_period_days: plan.trialDays,
      metadata: { providerId, planName },
    });
    subscriptionId = subscription.id;
  } else {
    // Flutterwave subscription
    const subscription = await createFlutterwaveSubscription({
      customer: provider.flutterwaveCustomerId,
      plan: plan.flutterwavePlanId,
      trialDays: plan.trialDays,
    });
    subscriptionId = subscription.id;
  }

  // Store in database
  await db.providerSubscription.create({
    data: {
      providerId,
      planId: plan.id,
      status: "trial",
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000),
      [provider.paymentProvider === "stripe"
        ? "stripeSubscriptionId"
        : "flutterwaveSubscriptionId"]: subscriptionId,
    },
  });
}
```

---

### Calendar Integration

**Google Calendar Sync** (Must Have):

```typescript
import { google } from "googleapis";

async function syncBookingToGoogleCalendar(booking: Booking) {
  const provider = await getProvider(booking.providerId);

  if (!provider.googleCalendarConnected) return;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: provider.googleAccessToken,
    refresh_token: provider.googleRefreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: `Booking: ${booking.service.title}`,
    description: `Client: ${booking.client.name}\nService: ${booking.service.title}\nPrice: ${booking.totalAmount}`,
    start: {
      dateTime: new Date(
        `${booking.appointmentDate}T${booking.appointmentTime}`
      ).toISOString(),
      timeZone: provider.timezone || "America/New_York",
    },
    end: {
      dateTime: new Date(
        new Date(
          `${booking.appointmentDate}T${booking.appointmentTime}`
        ).getTime() +
          booking.service.durationMinutes * 60000
      ).toISOString(),
      timeZone: provider.timezone || "America/New_York",
    },
    attendees: [{ email: booking.client.email }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  const result = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  // Store Google Calendar event ID
  await db.booking.update({
    where: { id: booking.id },
    data: { googleCalendarEventId: result.data.id },
  });
}
```

---

**Document Version**: 2.0  
**Last Updated**: Based on Client Confirmation  
**Status**: Critical Updates for Development# Beauty N Brushes - Technical Architecture Updates (Client Confirmed)

## Critical Changes from Client Confirmation

### Payment Processing

**DUAL PAYMENT PROVIDERS** (CRITICAL):

**Stripe** (North America & Europe):

- Stripe Connect for marketplace
- Provider receives 100% of payment (no fees)
- Service fees charged to CLIENT, not provider

**Flutterwave** (African Countries):

- Ghana
- Nigeria
- Provider receives 100% of payment (no fees)
- Service fees charged to CLIENT, not provider

**Platform Fee Structure** (Charged to Clients):

| Region        | Formula                | Minimum | Cap    |
| ------------- | ---------------------- | ------- | ------ |
| North America | $1.25 + 3.6% of total  | $1.25   | $8.00  |
| Ghana         | ₵10 + 2.9% of total    | ₵10     | ₵60    |
| Nigeria       | ₦1,500 + 2.9% of total | ₦1,500  | ₦6,224 |

**Minimum Payout Amounts**:

- North America: $20 USD
- Ghana: ₵250 GHS
- Nigeria: ₦15,000 NGN

---

### Database Schema Additions

#### New Tables Required:

**1. salon_profiles** (NEW - Multi-Stylist Accounts):

```sql
CREATE TABLE salon_profiles (
  id UUID PRIMARY KEY,
  provider_profile_id UUID REFERENCES provider_profiles(id),
  is_salon BOOLEAN DEFAULT FALSE,
  team_member_limit INT DEFAULT 10,
  subscription_tier VARCHAR(20), -- 'solo' or 'salon'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE salon_team_members (
  id UUID PRIMARY KEY,
  salon_id UUID REFERENCES salon_profiles(id),
  stylist_user_id UUID REFERENCES users(id),
  stylist_profile_id UUID REFERENCES provider_profiles(id),
  role VARCHAR(20), -- 'stylist', 'assistant', etc.
  can_manage_own_services BOOLEAN DEFAULT TRUE,
  can_manage_own_calendar BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  invited_email VARCHAR(255),
  invitation_status VARCHAR(20), -- 'pending', 'accepted', 'declined'
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**2. service_addons** (NEW - Add-on Services):

```sql
CREATE TABLE service_addons (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  addon_name VARCHAR(255) NOT NULL,
  addon_description TEXT,
  addon_price DECIMAL(10, 2) NOT NULL,
  addon_duration_minutes INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE booking_addons (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  addon_id UUID REFERENCES service_addons(id),
  addon_name VARCHAR(255),
  addon_price DECIMAL(10, 2),
  created_at TIMESTAMP
);
```

**3. payment_regions** (NEW - Multi-Region Support):

```sql
CREATE TABLE payment_regions (
  id UUID PRIMARY KEY,
  region_code VARCHAR(10) NOT NULL, -- 'NA', 'GH', 'NG'
  region_name VARCHAR(100),
  currency_code VARCHAR(3), -- 'USD', 'GHS', 'NGN'
  payment_provider VARCHAR(20), -- 'stripe', 'flutterwave'
  service_fee_formula JSONB, -- {base: 1.25, percentage: 3.6, cap: 8.00}
  minimum_payout_amount DECIMAL(10, 2),
  active BOOLEAN DEFAULT TRUE
);
```

**4. instagram_connections** (NEW - Instagram Integration):

```sql
CREATE TABLE instagram_connections (
  id UUID PRIMARY KEY,
  provider_
```
