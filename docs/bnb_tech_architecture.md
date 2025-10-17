# Beauty N Brushes - Technical Architecture Document

> **📌 NEW PROJECT**: This is the complete architecture for a brand new project. All database schemas, payment providers (Stripe + Paystack), and multi-regional support are included from the start. No migrations needed - everything is built fresh!

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5.0+
- **UI Library**: React 18+
- **Component Library**: Shadcn/ui
- **Styling**: Tailwind CSS 3.4+
- **Form Management**: React Hook Form
- **Validation**: Zod
- **State Management**: Zustand (for global state) + React Context
- **API Client**: TanStack Query (React Query)
- **Date Handling**: date-fns
- **Image Optimization**: Next.js Image component
- **Rich Text Editor**: Tiptap or Lexical

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js API Routes + Express.js (for complex API logic)
- **Language**: TypeScript 5.0+
- **ORM**: **Prisma** (Recommended)
  - **Why Prisma over alternatives**:
    - Best TypeScript support with auto-generated types
    - Excellent migration system
    - Great developer experience
    - Strong community and documentation
    - Built-in connection pooling
    - Supports PostgreSQL fully
  - Alternatives considered:
    - MikroORM: Good but smaller community
    - TypeORM: Older, less modern API
    - Drizzle: Newer, still maturing
    
### Database
- **Primary Database**: PostgreSQL 15+
- **Caching**: Redis 7+ (for sessions, rate limiting, caching)
- **Search**: PostgreSQL Full-Text Search + pg_trgm for fuzzy matching
- **Future**: Consider Elasticsearch for advanced search if needed

### AI & Machine Learning
- **AI SDK**: Vercel AI SDK 3.0+
- **LLM Provider**: OpenAI GPT-4
- **Vision API**: OpenAI Vision API / GPT-4 Vision
- **Image Processing**: Sharp (Node.js image processing)
- **Vector Database**: Pinecone or pgvector (PostgreSQL extension) for image embeddings

### File Storage
- **Service**: AWS S3
- **CDN**: AWS CloudFront
- **Upload Handling**: aws-sdk v3
- **Image Processing Pipeline**: 
  - Sharp for compression and resizing
  - Multiple size variants generation
  - WebP conversion for modern browsers

### Payment Processing
- **Providers**:
  - **Stripe** (North America & Europe)
  - **Paystack** (Ghana & Nigeria)

- **Integration**:
  - Stripe: Payment Intents + Subscriptions API
  - Paystack: Transactions + Subscriptions API

- **Features**:
  - Card-based subscription billing ($19/month solo, $49/month salon)
  - Multi-currency support (USD, GHS, NGN)
  - Regional payment optimization
  - Service fee collection (charged to clients)
  - Automated payout processing to providers
  - Refund handling
  - No provider account connection required (Stripe Connect/Paystack Subaccounts)
  - Simple card entry during onboarding
  - Platform-managed transactions

- **Paystack-Specific** (Ghana & Nigeria):
  - Mobile Money payments (MTN, Vodafone, AirtelTigo)
  - Bank Transfer (Pay with Transfer)
  - USSD payments (Nigeria)
  - Card payments (Verve, Visa, Mastercard)
  - Recurring billing via Subscriptions API

### Communication
- **Email**: SendGrid API
- **SMS**: Twilio (optional, for critical notifications)
- **Push Notifications**: Firebase Cloud Messaging (for future mobile app)
- **Real-time**: Socket.io or Pusher for live messaging

### Authentication & Authorization
- **Auth Provider**: NextAuth.js (Auth.js)
- **Strategy**: JWT + Session tokens
- **OAuth**: Google, Apple Sign-In
- **Password Hashing**: bcrypt
- **2FA**: speakeasy (TOTP)

### Deployment & Infrastructure
- **Platform**: Railway
- **Container**: Docker
- **CI/CD**: GitHub Actions
- **Domain**: Custom domain with SSL
- **Environment Variables**: Railway secrets + .env files

### Monitoring & Analytics
- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics + Web Vitals
- **Application Monitoring**: Better Stack (formerly Logtail)
- **Analytics**: Google Analytics 4 + Mixpanel
- **Logging**: Winston or Pino

### Testing
- **Unit Testing**: Vitest
- **Integration Testing**: Vitest + MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **API Testing**: Supertest
- **Code Coverage**: Vitest coverage

### Development Tools
- **Package Manager**: pnpm (faster, disk efficient)
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Type Checking**: TypeScript strict mode
- **API Documentation**: OpenAPI/Swagger (for public APIs)

---

## Database Schema Design

### Core Entities

#### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255), -- nullable for OAuth users
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'provider', 'admin')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  date_of_birth DATE,
  
  -- OAuth fields
  oauth_provider VARCHAR(50), -- 'google', 'apple', etc.
  oauth_id VARCHAR(255),
  
  -- Account status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  sms_notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
);
```

#### 2. Provider Profiles Table
```sql
CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(50), -- 'individual', 'salon', 'mobile'
  slug VARCHAR(255) UNIQUE NOT NULL, -- for custom URL
  tagline VARCHAR(255),
  description TEXT,
  
  -- Location
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(50) NOT NULL DEFAULT 'US',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact
  business_phone VARCHAR(20),
  website_url VARCHAR(500),
  instagram_handle VARCHAR(100),
  tiktok_handle VARCHAR(100),
  facebook_url VARCHAR(500),
  
  -- Business Details
  years_experience INT,
  license_number VARCHAR(100),
  license_verified BOOLEAN DEFAULT FALSE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  
  -- Branding
  logo_url VARCHAR(500),
  brand_color_primary VARCHAR(7), -- hex color
  brand_color_secondary VARCHAR(7),
  brand_color_accent VARCHAR(7),
  brand_font_heading VARCHAR(100),
  brand_font_body VARCHAR(100),
  
  -- Settings
  instant_booking_enabled BOOLEAN DEFAULT FALSE,
  accepts_new_clients BOOLEAN DEFAULT TRUE,
  mobile_service_available BOOLEAN DEFAULT FALSE,
  parking_available BOOLEAN,
  wheelchair_accessible BOOLEAN,
  
  -- Advance booking window
  advance_booking_days INT DEFAULT 30, -- how far ahead clients can book
  min_advance_hours INT DEFAULT 24, -- minimum notice required
  
  -- Calendar settings
  booking_buffer_minutes INT DEFAULT 0, -- time between appointments
  same_day_booking_enabled BOOLEAN DEFAULT FALSE,
  
  -- Financial & Regional
  payment_provider VARCHAR(20) NOT NULL CHECK (payment_provider IN ('stripe', 'paystack')), -- Payment provider based on region
  region_code VARCHAR(5) NOT NULL CHECK (region_code IN ('NA', 'EU', 'GH', 'NG')), -- Region code
  currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- USD, GHS, NGN

  -- Stripe (NA/EU)
  stripe_customer_id VARCHAR(255) UNIQUE, -- Stripe Customer ID
  stripe_subscription_id VARCHAR(255) UNIQUE, -- Stripe Subscription ID

  -- Paystack (GH/NG)
  paystack_customer_code VARCHAR(255) UNIQUE, -- Paystack Customer Code
  paystack_subscription_code VARCHAR(255) UNIQUE, -- Paystack Subscription Code

  -- Payment Method Info
  payment_method_id VARCHAR(255), -- Default payment method
  last_4_digits VARCHAR(4), -- Last 4 digits of card
  card_brand VARCHAR(20), -- visa, mastercard, verve, etc.

  -- Subscription
  subscription_tier VARCHAR(20) NOT NULL CHECK (subscription_tier IN ('solo', 'salon')),
  subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  trial_end_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  monthly_fee DECIMAL(10, 2), -- $19 for solo, $49 for salon
  
  -- Verification & Status
  profile_completed BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  featured BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  total_bookings INT DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  profile_views INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  UNIQUE (user_id),
  INDEX idx_provider_slug (slug),
  INDEX idx_provider_location (latitude, longitude),
  INDEX idx_provider_city (city, state),
  INDEX idx_provider_verification (verification_status),
  INDEX idx_provider_featured (featured)
);
```

#### 3. Provider Policies Table
```sql
CREATE TABLE provider_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  
  -- Cancellation Policy
  cancellation_window_hours INT NOT NULL DEFAULT 24,
  cancellation_fee_percentage DECIMAL(5, 2) DEFAULT 50.00,
  cancellation_policy_text TEXT,
  
  -- Late Policy
  late_grace_period_minutes INT DEFAULT 15,
  late_cancellation_after_minutes INT DEFAULT 15,
  late_policy_text TEXT,
  
  -- No-Show Policy
  no_show_fee_percentage DECIMAL(5, 2) DEFAULT 100.00,
  no_show_policy_text TEXT,
  
  -- Rescheduling Policy
  reschedule_allowed BOOLEAN DEFAULT TRUE,
  reschedule_window_hours INT DEFAULT 24,
  max_reschedules INT DEFAULT 2,
  reschedule_policy_text TEXT,
  
  -- Refund Policy
  refund_policy_text TEXT,
  
  -- General Policies
  consultation_required BOOLEAN DEFAULT FALSE,
  deposit_required BOOLEAN DEFAULT TRUE,
  requires_client_products BOOLEAN DEFAULT FALSE,
  touch_up_policy_text TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (provider_id)
);
```

#### 4. Service Categories Table
```sql
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 'Hair', 'Makeup', 'Nails', etc.
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon_name VARCHAR(50), -- for UI icons
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_category_slug (slug),
  INDEX idx_category_active (active)
);

CREATE TABLE service_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 'Braids', 'Color', 'Extensions', etc.
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (category_id, slug),
  INDEX idx_subcategory_slug (slug),
  INDEX idx_subcategory_category (category_id)
);
```

#### 5. Services Table
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id),
  subcategory_id UUID REFERENCES service_subcategories(id),
  
  -- Service Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('fixed', 'range', 'starting_at')),
  price_min DECIMAL(10, 2) NOT NULL,
  price_max DECIMAL(10, 2), -- for range pricing
  currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- USD, GHS, NGN (inherited from provider)

  -- Deposit
  deposit_required BOOLEAN DEFAULT TRUE,
  deposit_type VARCHAR(20) CHECK (deposit_type IN ('fixed', 'percentage')),
  deposit_amount DECIMAL(10, 2), -- fixed amount or percentage value

  -- Note: Currency is set based on provider's region during service creation
  
  -- Duration
  duration_minutes INT NOT NULL,
  buffer_time_minutes INT DEFAULT 0,
  
  -- Availability
  active BOOLEAN DEFAULT TRUE,
  accepts_new_clients BOOLEAN DEFAULT TRUE,
  
  -- Featured Media
  featured_image_id UUID, -- references media table
  
  -- Search & Discovery
  tags TEXT[], -- array of tags for AI matching
  searchable_text TSVECTOR, -- full-text search
  
  -- Analytics
  booking_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_service_provider (provider_id),
  INDEX idx_service_category (category_id, subcategory_id),
  INDEX idx_service_active (active),
  INDEX idx_service_search (searchable_text) USING GIN
);
```

#### 6. Service Media Table
```sql
CREATE TABLE service_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- File Information
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
  file_url VARCHAR(500) NOT NULL, -- S3 URL
  thumbnail_url VARCHAR(500), -- for videos
  
  -- Multiple Size Variants (for images)
  url_small VARCHAR(500), -- 400px
  url_medium VARCHAR(500), -- 800px
  url_large VARCHAR(500), -- 1200px
  
  -- Metadata
  file_size_bytes BIGINT,
  width INT,
  height INT,
  duration_seconds INT, -- for videos
  mime_type VARCHAR(100),
  
  -- AI Tags (for image matching)
  ai_tags TEXT[], -- ['braided', 'box_braids', 'long_hair', 'black_hair']
  ai_embedding VECTOR(1536), -- vector embedding for similarity search
  color_palette JSONB, -- dominant colors extracted
  
  -- Organization
  display_order INT DEFAULT 0,
  is_before_photo BOOLEAN DEFAULT FALSE,
  is_after_photo BOOLEAN DEFAULT FALSE,
  paired_media_id UUID REFERENCES service_media(id), -- for before/after pairs
  
  -- Status
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_media_service (service_id),
  INDEX idx_media_type (media_type),
  INDEX idx_media_status (processing_status, moderation_status),
  INDEX idx_media_ai_embedding (ai_embedding) USING ivfflat -- for vector similarity search
);
```

#### 7. Provider Availability Table
```sql
CREATE TABLE provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  
  -- Day of Week (0 = Sunday, 6 = Saturday)
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Time Slots
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Status
  is_available BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_availability_provider (provider_id),
  INDEX idx_availability_day (day_of_week),
  UNIQUE (provider_id, day_of_week, start_time)
);

CREATE TABLE provider_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  
  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Details
  reason VARCHAR(255), -- 'Vacation', 'Personal', etc.
  all_day BOOLEAN DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_timeoff_provider (provider_id),
  INDEX idx_timeoff_dates (start_date, end_date)
);
```

#### 8. Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  client_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  service_id UUID NOT NULL REFERENCES services(id),
  
  -- Appointment Details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_end_time TIME NOT NULL,
  
  -- Pricing
  service_price DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  service_fee DECIMAL(10, 2) NOT NULL, -- Service fee charged to client
  total_amount DECIMAL(10, 2) NOT NULL, -- Total = deposit + service_fee
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- USD, GHS, NGN

  -- Payment Provider Info
  payment_provider VARCHAR(20) NOT NULL CHECK (payment_provider IN ('stripe', 'paystack')),

  -- Payment Status
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'refunded', 'partially_refunded')),

  -- Stripe Fields (NA/EU)
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),

  -- Paystack Fields (GH/NG)
  paystack_reference VARCHAR(255),
  paystack_access_code VARCHAR(255),
  paystack_transaction_id VARCHAR(255),

  -- Payment Details
  payment_method VARCHAR(50), -- card, mobile_money, bank_transfer, ussd
  payment_channel VARCHAR(50), -- specific channel used
  paid_at TIMESTAMP,
  
  -- Booking Status
  booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN (
    'pending', 'confirmed', 'cancelled_by_client', 'cancelled_by_provider', 
    'completed', 'no_show', 'rescheduled'
  )),
  
  -- Booking Type
  booking_type VARCHAR(20) DEFAULT 'instant' CHECK (booking_type IN ('instant', 'request')),
  
  -- Special Requests
  special_requests TEXT,
  internal_notes TEXT, -- only visible to provider
  
  -- Cancellation/Rescheduling
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10, 2) DEFAULT 0,
  
  rescheduled_from_booking_id UUID REFERENCES bookings(id),
  reschedule_count INT DEFAULT 0,
  
  -- Reminders
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  
  -- Completion
  completed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_booking_client (client_id),
  INDEX idx_booking_provider (provider_id),
  INDEX idx_booking_service (service_id),
  INDEX idx_booking_date (appointment_date, appointment_time),
  INDEX idx_booking_status (booking_status),
  INDEX idx_booking_payment (payment_status)
);
```

#### 9. Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) UNIQUE,
  client_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  
  -- Ratings (1-5 scale)
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
  timeliness_rating INT CHECK (timeliness_rating BETWEEN 1 AND 5),
  professionalism_rating INT CHECK (professionalism_rating BETWEEN 1 AND 5),
  value_rating INT CHECK (value_rating BETWEEN 1 AND 5),
  
  -- Review Content
  review_text TEXT,
  
  -- Photos
  photo_urls TEXT[], -- array of S3 URLs
  
  -- Response
  provider_response TEXT,
  provider_response_date TIMESTAMP,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT TRUE, -- verified booking
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Helpful votes
  helpful_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_review_provider (provider_id),
  INDEX idx_review_client (client_id),
  INDEX idx_review_rating (overall_rating),
  INDEX idx_review_visible (is_visible)
);
```

#### 10. Messages Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  booking_id UUID REFERENCES bookings(id), -- optional, if related to booking
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  
  -- Last Message Info
  last_message_at TIMESTAMP,
  last_message_preview TEXT,
  
  -- Unread Counts
  client_unread_count INT DEFAULT 0,
  provider_unread_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_conversation_client (client_id),
  INDEX idx_conversation_provider (provider_id),
  INDEX idx_conversation_last_message (last_message_at),
  UNIQUE (client_id, provider_id, booking_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  
  -- Message Content
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  content TEXT NOT NULL,
  attachment_urls TEXT[], -- for images or files
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- System Messages
  is_system_message BOOLEAN DEFAULT FALSE,
  system_message_type VARCHAR(50), -- 'booking_confirmed', 'booking_cancelled', etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_message_conversation (conversation_id),
  INDEX idx_message_sender (sender_id),
  INDEX idx_message_created (created_at)
);
```

#### 11. Client Favorites Table
```sql
CREATE TABLE client_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (client_id, provider_id),
  INDEX idx_favorites_client (client_id),
  INDEX idx_favorites_provider (provider_id)
);
```

#### 12. Saved Searches Table
```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Search Parameters
  search_name VARCHAR(255),
  category_id UUID REFERENCES service_categories(id),
  subcategory_id UUID REFERENCES service_subcategories(id),
  location_city VARCHAR(100),
  location_state VARCHAR(50),
  max_distance_miles INT,
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  
  -- Notifications
  notify_new_matches BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_saved_search_client (client_id)
);
```

#### 13. Inspiration Library Table
```sql
CREATE TABLE inspiration_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Image Data
  image_url VARCHAR(500) NOT NULL, -- S3 URL
  thumbnail_url VARCHAR(500),
  source_url VARCHAR(500), -- if from social media
  
  -- AI Analysis
  ai_tags TEXT[],
  ai_embedding VECTOR(1536),
  style_description TEXT,
  color_palette JSONB,
  
  -- Organization
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_inspiration_client (client_id),
  INDEX idx_inspiration_ai_embedding (ai_embedding) USING ivfflat
);
```

#### 14. Payment Transactions Table
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),

  -- Transaction Details
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'balance', 'tip', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD', -- USD, GHS, NGN

  -- Payment Provider
  payment_provider VARCHAR(20) NOT NULL CHECK (payment_provider IN ('stripe', 'paystack')),

  -- Stripe Details (NA/EU)
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),

  -- Paystack Details (GH/NG)
  paystack_reference VARCHAR(255),
  paystack_transaction_id VARCHAR(255),
  paystack_refund_id VARCHAR(255),

  -- Payment Method
  payment_method VARCHAR(50), -- card, mobile_money, bank_transfer, ussd
  payment_channel VARCHAR(50), -- MTN, Vodafone, card_brand, etc.

  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Metadata
  description TEXT,
  failure_reason TEXT,
  gateway_response JSONB, -- Store full gateway response

  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,

  INDEX idx_transaction_booking (booking_id),
  INDEX idx_transaction_status (status),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_transaction_provider (payment_provider),
  INDEX idx_transaction_reference (paystack_reference),
  INDEX idx_transaction_stripe_intent (stripe_payment_intent_id)
);

CREATE TABLE provider_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),

  -- Payout Details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD', -- USD, GHS, NGN

  -- Payment Provider
  payment_provider VARCHAR(20) NOT NULL CHECK (payment_provider IN ('stripe', 'paystack')),

  -- Stripe Payouts (NA/EU)
  stripe_payout_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),

  -- Paystack Payouts (GH/NG)
  paystack_transfer_code VARCHAR(255),
  paystack_transfer_reference VARCHAR(255),
  paystack_recipient_code VARCHAR(255),

  -- Bank Details (for reference)
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_name VARCHAR(200),

  -- Period
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'in_transit', 'paid', 'failed', 'cancelled')),

  -- Metadata
  booking_count INT,
  total_bookings_amount DECIMAL(10, 2),
  service_fees_collected DECIMAL(10, 2), -- Fees collected from clients
  net_amount DECIMAL(10, 2), -- Amount paid to provider

  -- Failure handling
  failure_reason TEXT,
  retry_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  paid_at TIMESTAMP,

  INDEX idx_payout_provider (provider_id),
  INDEX idx_payout_status (status),
  INDEX idx_payout_period (period_start_date, period_end_date),
  INDEX idx_payout_provider_payment (payment_provider),
  INDEX idx_payout_stripe (stripe_payout_id),
  INDEX idx_payout_paystack (paystack_transfer_reference)
);
```

#### 15. Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- 'booking_confirmed', 'reminder', 'review_received', etc.
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  
  -- Links
  action_url VARCHAR(500), -- deep link to relevant page
  related_booking_id UUID REFERENCES bookings(id),
  
  -- Delivery
  delivered_via TEXT[], -- ['in_app', 'email', 'sms']
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_notification_user (user_id),
  INDEX idx_notification_read (is_read),
  INDEX idx_notification_type (notification_type)
);
```

#### 16. Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Action Details
  action VARCHAR(100) NOT NULL, -- 'user.login', 'booking.created', etc.
  entity_type VARCHAR(50), -- 'booking', 'service', 'user', etc.
  entity_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
);
```

---

## API Architecture

### API Structure

```
/api/v1/
├── auth/
│   ├── register
│   ├── login
│   ├── logout
│   ├── refresh
│   ├── forgot-password
│   ├── reset-password
│   ├── verify-email
│   └── oauth/[provider]
│
├── users/
│   ├── me
│   ├── [userId]
│   ├── profile
│   └── settings
│
├── providers/
│   ├── [providerId]
│   ├── [providerId]/profile
│   ├── [providerId]/services
│   ├── [providerId]/availability
│   ├── [providerId]/portfolio
│   ├── [providerId]/reviews
│   ├── [providerId]/stats
│   └── onboarding
│
├── services/
│   ├── [serviceId]
│   ├── search
│   ├── categories
│   ├── featured
│   └── [serviceId]/media
│
├── bookings/
│   ├── [bookingId]
│   ├── create
│   ├── [bookingId]/cancel
│   ├── [bookingId]/reschedule
│   ├── [bookingId]/complete
│   └── availability-check
│
├── payments/
│   ├── create-intent
│   ├── confirm
│   ├── refund
│   └── webhooks/stripe
│
├── reviews/
│   ├── [reviewId]
│   ├── create
│   └── [reviewId]/respond
│
├── messages/
│   ├── conversations
│   ├── [conversationId]
│   ├── [conversationId]/messages
│   └── send
│
├── ai/
│   ├── match-inspiration
│   ├── analyze-image
│   ├── generate-brand-theme
│   └── chat-assistant
│
├── search/
│   ├── visual
│   ├── text
│   └── filters
│
├── favorites/
│   ├── add
│   ├── remove
│   └── list
│
└── admin/
    ├── users
    ├── providers
    ├── bookings
    ├── analytics
    └── moderation
```

### API Response Format

```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  }
}

// Error Response
{
  success: false,
  error: {
    code: string; // 'VALIDATION_ERROR', 'NOT_FOUND', etc.
    message: string;
    details?: any;
  },
  meta: {
    timestamp: string;
    requestId: string;
  }
}
```

---

## Component Architecture

### Frontend Structure

```
src/
├── app/ (Next.js App Router)
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (client)/
│   │   ├── page.tsx (homepage with search)
│   │   ├── search/
│   │   ├── providers/[slug]/
│   │   ├── booking/[id]/
│   │   ├── dashboard/
│   │   └── messages/
│   │
│   ├── (provider)/
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── services/
│   │   ├── calendar/
│   │   ├── bookings/
│   │   ├── finances/
│   │   └── settings/
│   │
│   ├── api/ (API routes)
│   └── layout.tsx
│
├── components/
│   ├── ui/ (Shadcn components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (all Shadcn components)
│   │
│   ├── shared/ (Reusable components)
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ImageUpload.tsx
│   │
│   ├── client/ (Client-specific)
│   │   ├── SearchBar.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── ProviderCard.tsx
│   │   ├── BookingForm.tsx
│   │   └── InspirationUpload.tsx
│   │
│   ├── provider/ (Provider-specific)
│   │   ├── ServiceEditor.tsx
│   │   ├── CalendarView.tsx
│   │   ├── BookingsList.tsx
│   │   └── AnalyticsDashboard.tsx
│   │
│   └── admin/ (Admin-specific)
│
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   ├── db.ts (Prisma client)
│   ├── storage.ts (S3)
│   ├── email.ts (SendGrid)
│   ├── payment.ts (Stripe)
│   ├── ai.ts (Vercel AI SDK)
│   └── utils.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useBooking.ts
│   ├── useProviderProfile.ts
│   └── useMessages.ts
│
├── types/
│   ├── api.ts
│   ├── user.ts
│   ├── booking.ts
│   ├── service.ts
│   └── provider.ts
│
├── stores/ (Zustand)
│   ├── authStore.ts
│   ├── bookingStore.ts
│   └── uiStore.ts
│
└── styles/
    └── globals.css
```

### Key Component Patterns

1. **Server Components by Default**: Use Server Components for data fetching
2. **Client Components**: Mark with 'use client' only when needed (interactivity, hooks)
3. **Loading States**: Use loading.tsx and Suspense boundaries
4. **Error Handling**: Use error.tsx for error boundaries
5. **Metadata**: Define metadata in layout.tsx and page.tsx

---

## AI Integration Details

### Using Vercel AI SDK

**Why Vercel AI SDK?**
- Seamless Next.js integration
- Streaming responses
- Built-in hooks for UI (useChat, useCompletion)
- Multi-provider support (OpenAI, Anthropic, etc.)
- Type-safe
- Edge runtime compatible

### AI Use Cases

#### 1. Image Matching
```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

async function analyzeInspirationImage(imageUrl: string) {
  const result = await generateObject({
    model: openai('gpt-4-vision-preview'),
    schema: z.object({
      styleType: z.string(),
      hairTexture: z.string(),
      hairLength: z.string(),
      colorTones: z.array(z.string()),
      complexity: z.enum(['simple', 'moderate', 'complex']),
      tags: z.array(z.string()),
    }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this hairstyle image' },
          { type: 'image', image: imageUrl }
        ]
      }
    ]
  });
  
  return result.object;
}
```

#### 2. AI Chatbot
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages, providerData } = await req.json();
  
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    system: `You are a helpful assistant for ${providerData.businessName}. 
             Services: ${JSON.stringify(providerData.services)}
             Policies: ${JSON.stringify(providerData.policies)}
             Answer client questions professionally.`,
    messages,
  });
  
  return result.toAIStreamResponse();
}
```

#### 3. Brand Theme Generation
```typescript
async function generateBrandTheme(input: string) {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({
      primaryColor: z.string(),
      secondaryColor: z.string(),
      accentColor: z.string(),
      fontHeading: z.string(),
      fontBody: z.string(),
      vibe: z.string(),
    }),
    prompt: `Generate a cohesive brand theme based on: "${input}"`,
  });
  
  return result.object;
}
```

---

## Security Considerations

### Authentication
- JWT tokens with short expiration (15 minutes)
- Refresh tokens (7 days)
- HTTP-only cookies for tokens
- CSRF protection
- Rate limiting on auth endpoints

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API key rotation
- Audit logging

### Data Protection
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS prevention (React's default escaping)
- CORS configuration
- Content Security Policy headers

### File Upload Security
- File type validation
- File size limits
- Virus scanning (ClamAV)
- Signed URLs with expiration
- Content-type verification

---

## Performance Optimization

### Frontend
- Image optimization (Next.js Image)
- Code splitting and lazy loading
- Static generation where possible
- ISR (Incremental Static Regeneration)
- Service Worker for offline support

### Backend
- Database query optimization
- Connection pooling
- Redis caching
- API response caching
- Database indexing

### CDN & Assets
- CloudFront for S3 assets
- Gzip/Brotli compression
- Cache headers
- Image format conversion (WebP, AVIF)

---

## Monitoring & Observability

### Key Metrics
- Response times (p50, p95, p99)
- Error rates
- Database query performance
- API endpoint usage
- User session duration
- Conversion rates

### Alerts
- High error rates
- Slow database queries
- Failed payments
- Downtime
- High resource usage

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025