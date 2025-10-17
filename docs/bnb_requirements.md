# Beauty N Brushes (BNB) – Complete Platform Requirements Document

## Executive Summary

Beauty N Brushes is an AI-powered, visual-first beauty services marketplace that connects clients with beauty professionals through real work examples. The platform enables clients to book exact looks they desire by matching them with professionals who have demonstrable experience creating those specific styles.

---

## Core Value Proposition

**Problem Solved**: Traditional beauty booking platforms lack visual search capabilities and real work examples, making it difficult for clients to find professionals who can deliver their desired look.

**Solution**: A visual-first marketplace where every service is backed by real photos/videos, enhanced with AI-powered matching to connect clients with the perfect professional.

---

## User Roles & Personas

### 1. Beauty Professionals (Providers)
- **Solo Professionals**: Individual stylists, makeup artists, nail technicians
- **Salon Accounts**: Multi-stylist businesses with team management
- **Service Types**:
  - Hair Stylists: Natural hair, braids, weaves, cuts, color, treatments
  - Makeup Artists: Bridal, special events, everyday makeup
  - Nail Technicians: Manicures, pedicures, nail art
  - Lash Technicians: Extensions, lifts, tints
  - Brow Artists: Shaping, tinting, microblading
  - Estheticians: Facials, skincare treatments

### 2. Clients (Consumers)
- First-time bookers needing visual guidance
- Regular clients booking recurring appointments
- Event-driven clients requiring specific looks

### 3. Platform Administrators
- Monitor platform health and user activity
- Handle flagged content and accounts
- Manage platform settings

---

## Complete Feature Specification

### A. Beauty Professional Features

#### 1. Registration & Onboarding

**Account Type Selection**:
- Solo beauty professional
- Salon/business (multi-stylist account)

**Registration Flow**:
- Email/phone verification required
- Business details:
  - Business name and address
  - Service specializations
  - Contact information
  - Multiple locations support (Yes)
- Profile media:
  - Profile photo upload
  - Logo upload
  - Cover photo upload (optional)
  - Instagram account link (optional)

**Brand Customization**:
- Color palette:
  - Primary: #B06F64 (Dusty Rose)
  - Accent: #FFB09E (Peach Blush)
  - Secondary: #CA8D80 (Warm Taupe)
  - Tertiary: #DF9C8C (Blush Clay)
  - Buttons: #2A3F4D (Dark Slate Blue-Grey) and #FFB09E (Peach Blush)
- Typography selection
- Logo placement

**AI-Assisted Policy Generation**:
- After entering basic details, AI prompts: "Would you like help creating your policies (cancellation, lateness, deposits, refunds)?"
- Provider can accept AI suggestions or edit manually
- Policies include:
  - Cancellation policy
  - Late arrival policy
  - Deposit requirements
  - Refund terms

**Payment Account Connection**:
- **North America & Europe**: Stripe
- **African Countries**: Paystack
  - Ghana
  - Nigeria
- Platform does NOT take fees from providers
- Service fees charged to clients
- Providers don't pay payment processing fees
- No provider account connection required (Stripe Connect/Paystack Subaccounts)
- Simple card/mobile money entry during onboarding

**Profile Approval**:
- Manual approval by admin: Not required for booking link
- Profile live on marketplace: After automated review
- Can be easily deactivated if flagged

#### 2. Service Management

**Service Creation**:
- Service title and description
- **AI Auto-Description**: When provider enters service title, AI generates description draft based on style and past listings
- Optional add-ons with separate pricing
- Pricing options:
  - Fixed price
  - Price range
  - Starting at price
- Duration setting
- Category and subcategory selection
- Deposit requirement:
  - Type: Flat amount or percentage
  - Deposits are MANDATORY
- **AI-Generated Suggestions**:
  - Hashtags and keywords
  - Estimated duration (editable)

**Service Templates**:
Two flows available:

**A) Preset Service Flow**:
1. Provider selects category → subcategory → service template
2. AI auto-fills description, duration, and suggested price
3. Provider edits fields and uploads media

**B) Custom Service Flow**:
1. Provider enters new service name
2. Selects category for classification
3. AI generates draft description, tags, and price range
4. All services must map to parent category

**Media Management**:
- Upload photos/videos of work
- Maximum 10 images per service
- Videos allowed: Maximum 60 seconds
- Reorder images
- Set featured image
- Add captions/descriptions
- Link uploaded media to specific services

**Instagram Integration** (Must Have):
- Securely connect Instagram account
- Import selected photos/videos from profile
- Display as part of portfolio
- Link to services

**AI Tagging for Matching**:
- Hair type/texture
- Style type
- Color information
- Complexity level

**Add-ons/Variations**:
- Yes - with separate pricing
- Example: Home service at additional cost

#### 3. Calendar & Availability

**Weekly Schedule**:
- Set working hours per day
- Block off dates (vacation, personal time)
- Set recurring unavailability
- Override specific dates

**Booking Settings**:
- Advance booking window: Provider decides
- Minimum notice required: Provider decides
- Maximum bookings per day: Provider decides (optional limit)
- Buffer time between appointments
- Can block specific time slots: Yes

**Calendar Integration**:
- **Must Have**: Google Calendar
- **Phase 2**: Apple Calendar
- **Phase 3**: Microsoft 365 Calendar

**Real-time Updates**:
- Available slots update instantly
- Clients only see available times

#### 4. Booking Management

**Booking Dashboard**:
- View all bookings (upcoming, past, cancelled)
- Booking details include:
  - Client information
  - Service requested
  - Date and time
  - Special requests
  - Deposit payment status
  - Photo inspiration
  - Balance owed
  - Home service location (if add-on selected)

**Booking Actions**:
- Instant booking: Auto-confirmed
- Request booking: Accept/decline with reason
- Request different date/time
- Add internal notes (not visible to client)
- Message client
- Mark as completed
- No-show button: Yes
- Can reschedule bookings: Only with client approval
- View client booking history: Yes

**Provider Penalties** (Not required at launch):
- 3+ last-minute cancellations (within 60 days):
  - Temporary drop in search ranking for 14 days
  - Reduced featured visibility
- Repeated abuse:
  - Account review
  - Potential temporary deactivation

#### 5. Financial Management

**Finance Dashboard** (Activated after first booking):
- Total earnings
- Deposits received
- Balance owed
- Cash collected
- Platform commission breakdown
- Initially displays $0 until first booking

**Payout Details**:
- Payment timing: Immediately after completion OR 24 hours
- Platform holds funds: 1-2 days
- Platform fee structure (charged to client):

| Region | Formula | Minimum | Cap | Purpose |
|--------|---------|---------|-----|---------|
| North America | $1.25 + 3.6% of total | $1.25 | $8.00 | Small jobs stay profitable; large ones capped fairly |
| Ghana | ₵10 + 2.9% of total | ₵10 | ₵60 | Covers Paystack fees (~3%) while keeping fees reasonable |
| Nigeria | ₦1,500 + 2.9% of total | ₦1,500 | ₦6,224 | Protects profitability while staying fair |

**Minimum Payout Amount**:
- North America: $20 USD
- Ghana: ₵250 GHS
- Nigeria: ₦15,000 NGN

**Refunds**:
- Provider can manually initiate refunds
- Deposit refundable only if policy allows
- System calculates based on policy
- Automatic processing through Stripe/Paystack

**Subscription Fees**:
- Solo beauty professionals: $19/month
- Salons: $49/month
- 2-month free trial offered
- No payment processing fees

#### 6. Messaging System

**Messaging Capabilities**:
- Clients can message at ANY time (not just after booking)
- In-app messaging (not SMS/email)
- Both parties receive notifications
- Message history saved
- Can attach images (max 5MB)
- Read receipts: Yes
- Messages accessible after appointment completion

**AI Messaging Assistant** (Key Differentiator):
- AI auto-drafts replies based on:
  - Provider's policies (cancellation, deposits, late arrival)
  - Previous communication tone/style
  - Availability calendar (auto-responds with next open slot)

**AI Assistant Features**:
- Instant draft reply suggestions
- Provider taps "Send" or "Edit"
- Smart context detection
- Example: "Hi, are you available Saturday?" → auto response includes availability + deposit policy
- Multilingual support (detects client language)

**Automated Responses**:
- Providers can set: Yes

#### 7. Analytics Dashboard (Must Have)

- Total bookings
- Revenue tracking
- Popular services
- Client demographics
- Booking trends
- Profile views
- Conversion rates

#### 8. Marketing Tools

**AI Brand Customization** (Must Have):
- Natural language input for brand preferences
- AI generates color palette and typography
- Real-time preview
- Template library

**Private Booking Pages**:
- Unique URL: beautynbrushes.com/@username
- Can share booking links directly (bypassing marketplace)
- White-label appearance
- Custom branding

#### 9. Client Management System (Must Have)

- View client booking history
- Client preferences/hair type information stored
- Notes per client
- Repeat client tracking

---

### B. Salon Features (Multi-Stylist Accounts)

#### Salon Account Structure

**Primary Account Owner (Salon Admin)**:
- Manages business profile
- Uploads branding
- Sets general policies
- Oversees all bookings
- Connects payment account (all payments to salon's main account)
- Platform deducts fees automatically
- Salon handles internal stylist payouts manually

**Team Member Management**:
- Invite stylists via email
- Each stylist creates sub-profile
- Stylists can:
  - Add own services, pricing, duration
  - Set personal availability within salon hours
  - Upload portfolio photos/videos (tagged to their profile)
  - Manage their own calendar

**Admin Controls**:
- Edit or deactivate stylist profiles
- Assign appointments manually
- Override stylist settings if needed

**Service Configuration**:
- Salon-wide services (available from any stylist)
- Stylist-specific services (only under that provider)
- Real-time availability sync across dashboards
- Prevents double-booking

**Client Booking Options**:
1. Book specific stylist (based on profile, reviews, portfolio)
2. Book "Any Available Stylist"
   - System auto-assigns next available provider
   - OR salon admin assigns manually

**Salon Dashboard**:
- Overview of all bookings
- Team member performance
- Revenue by stylist
- Salon-wide analytics

---

### C. Client Features

#### 1. Homepage & Search

**Landing on Homepage**:
- Large visual gallery (photos/videos focused)
- Modern interface similar to existing site
- Pictures and videos displayed LARGE
- Not mirroring traditional directories

**Search Methods**:
- Location (city or zip code)
- Service type (Hair, Makeup, Nails, etc.)
- Business/Stylist name
- Text search
- Category/service type filters
- Visual gallery browse
- AI inspiration matching
- Price range filters
- Availability filters
- Rating filters

**Default Sort Order**:
- Relevance
- Distance
- Rating
- Price (low to high)
- Recently added

**Search Results Display**:
- Visual gallery of actual work
- Details displayed alongside photo (WITHOUT clicking):
  - Service description and pricing
  - Clickable provider name (to access full profile)
  - Provider reviews and ratings summary
  - Portfolio preview

#### 2. AI Inspiration Matching

**Flow**:
- Integrated into homepage/search page
- Client clicks "Find Your Look"
- Uploads inspiration photo
- AI analyzes:
  - Style type (braids, color, cut, etc.)
  - Hair texture/type
  - Complexity level
  - Color tones

**Results**:
- Matching providers with similar work
- Confidence score for each match (minimum 70%)
- Similar work example from provider's portfolio
- Sorted by match quality and location
- Client can refine with filters: Yes
- Explain how AI matching works: Yes

#### 3. Booking Journey

**Service Selection**:
- Click service photo/video
- View full details on page
- Click provider name for full profile
- Add optional add-ons (e.g., Home Service)
- Click "Book" button

**Booking Form**:
- Select date from available calendar
- Select time slot
- Fill booking details:
  - Contact information
  - Email: Required
  - Phone number: Required
  - Special requests: Optional
  - Reference photos: Optional
  - Option to add add-on services

**Account Creation**:
- No required account before booking
- During booking, client can choose:
  - Save info (creates account)
  - Continue as guest checkout

**Multiple Services**:
- Can book multiple services in one appointment: Yes
- Cannot book different providers in one transaction: No

**Review & Payment**:
- Booking summary with price breakdown
- Pay deposit via Stripe/Paystack
- Receive confirmation email
- Receive reminder notifications

**Booking Types**:
- Instant booking (auto-confirmed)
- Request booking (provider approval)
- Provider decides which type

#### 4. Client Dashboard

**Booking Management**:
- View all bookings (upcoming, past)
- Booking details:
  - Status
  - Provider information
  - Date/time
  - Location and directions
  - Payment status

**Client Actions**:
- Message provider
- Reschedule (within policy)
- Cancel (within policy)
- Add to calendar
- After appointment:
  - Leave review
  - Rebook same service
  - View before/after photos

**Saved Features** (Must Have):
- Favorite providers
- Saved searches
- Booking history

**Client Profile**:
- Not public: No
- Store preferences/hair type: Yes
- Personal information
- Payment methods

#### 5. Payment Options

**Deposit Payment**:
- Charged at booking
- Mandatory for all bookings

**Balance Payment**:
- Online before appointment: Yes
- At appointment time: Yes
- Pay by cash: Yes (client option)

**Client Visibility**:
- See provider's phone number: Only after booking confirmed
- Can tip through platform: Yes

**Photo Uploads**:
- Can upload photos after appointment: Yes (in reviews)

#### 6. Reviews & Ratings

**Review System**:
- Prompted after appointment completion
- Rate 1-5 stars on:
  - Overall experience
  - Quality of service
  - Timeliness
  - Professionalism
- Write optional text review
- Upload photos (before/after)

**Review Rules**:
- Time to leave review: 7 days after appointment
- Can edit reviews: Within first 24 hours only
- Reviews required: No
- Reviews permanent: Yes (cannot be deleted by provider)
- Provider can respond: Yes
- Provider can flag inappropriate: Yes

---

### D. AI Features

#### Core AI Features (Essential for Launch)

**1. Image-Based Inspiration Matching**:
- Upload inspiration photo
- AI analyzes style, texture, complexity, color
- Match to providers with similar work
- Confidence scoring
- Sorted results by match quality

**2. Automatic Image Tagging**:
- AI tags uploaded service images
- Hair type/texture detection
- Style categorization
- Color information
- Complexity assessment

**3. Style Categorization**:
- Automatic service classification
- Category and subcategory suggestions

**4. AI Auto-Description**:
- Service description generation
- Provider profile "About" section
- Based on title and past listings
- Editable by provider

**5. AI Beauty Pro Assistant**:
- Creates draft responses to client inquiries
- Based on policies, voice, and tone
- Learns from provider's communication style
- Suggests replies with "Send" or "Edit" options

**6. AI Inquiry Assistant (Chatbot)**:
- **On Provider Profile**: Answers questions about services, pricing, availability, policies
- **On Homepage**: Helps clients find services, navigate platform, discover stylists
- Instant responses using existing data
- Reduces manual messaging for providers
- Improves user experience

**7. Social Media Link Matching**:
- Instagram/TikTok link input
- AI extracts visual style
- Returns matching local providers

#### Enhanced AI Features (Can Be Added Later)

**1. AI Brand Theme Generation**:
- Natural language input
- Generate color palette and typography
- Real-time preview

**2. Personalized Recommendations**:
- Client preference learning
- Suggest providers based on history
- Style-based recommendations

**3. AI Price Approximation (Fast-Follow)**:
- Analyze service complexity
- Suggest price ranges
- Based on market data

#### AI Providers & Costs

**Primary**:
- OpenAI (GPT-4 Vision)

**Complementary**:
- Google Gemini Vision/Gemini (faster classification)

**Future/Optional**:
- OpenAI Moderation (for content moderation)

**Cost Management Question**:
Client asks: "What costs are associated with using this? How can we set this up affordably?"

---

### E. Service Categories

#### Essential Categories (Include from Start)

**1. Hair Services**

**a. Natural & Relaxed Hair**:
Invisible Ponytail, Flexi Rod Set, Finger Curling, Blow Out, Bantu Knots, Bantu Knot-Out, Perm Rod Set, Jerry Curls, Relaxer, Relaxer Touch-Up, Wash & Style, Wash & Roller Set, Wash & Go, Updo, Texturiser, Styling, Silk Press, Shingling

**b. Braids, Twists & Extensions**:
Small/Medium/Large Box Braids, Micro Braids, Tree Braids, Single Braids, Sisterlocs, Traditional Locs, Microlocs, Loc Extensions, Loc Repair, Starter Locs, Loc Retwist, Faux Locs, Two-Strand Twists, Marley Twists, Havana Twists, Knotless Twists, Flat Twists, Senegalese Twists, Knotless Braids, Cornrows, Lemonade Braids, Crochet Braids, Ghana Braids, Feed-In Braids, Goddess Braids

**c. Colour & Treatment**:
Moisturising Treatment, Hot Oil Treatment, Deep Conditioner, Protein Treatment, Custom Colour, Curly Colour, Weave Dye, Partial Highlights, Ombre, Full Highlights, Full Colour, Colour Retouch, Bundle Colour, Balayage

**d. Wigs, Weaves & Extensions**:
Wig (U-Part/Frontal/Closure), Hollywood Waves, Clip-Ins, Frontal Touch-Up, Full Head Weave, Fusion Extensions, Half Up & Down, Half Weave, Lace Closure Tighten, Quick Weave, U-Part Sew-In, Versatile Weave, Weave + Frontal, Weave Installation (Leave Out/Closure/360 Frontal), Wig Installation

**e. Specials & Consultations**:
Extension Removal, Wedding Hairstyle, Special Occasion Styling, Hair Consultation

**f. Cuts**:
Bob Cut, Colour & Cut, Lob Cut, Precision Cut, Short Cut, Tapered Cut, Trim

**2. Makeup Services**:
Bridal, Special Events, Everyday Makeup, Birthday Makeup, Film & Television, Full Glam, Halloween Makeup, Natural Glam, Photoshoot Glam, Shimmery/Glitter Look, Soft Glam, SFX Makeup, Theatre Makeup

**3. Nail Services**:
Manicure, Pedicure, Mani & Pedi, French Tips, Nail Art Design, Polish Change (Hands/Toes), Shellac (Mani/Pedi/Chrome), Dipping Ombre, Dipping French Tip, 3D Nail Art, Acrylic (Overlay/Refill/Repair), UV Gel (Overlay/Refill/Repair), Bio Gel (Overlay/Refill), Nail Take-Off, Pink & White, Men's Nails, Kids Nails

**4. Lash Services**:
Extensions, Lifts, Tints, Classic Set & Refill, Hybrid Set & Refill, Mega Volume Set & Refill, Volume Set & Refill, Full Set + Removal

**5. Brow Services**:
Shaping, Tinting, Microblading, Henna Brow, HD Brow Lamination, HD Brow Lamination + Tint, Eyebrow Wax

**6. Skincare & Esthetician Services**:
Facials, Treatments, Corrective Facials, Advanced Skincare

**7. Waxing Services** (Fast Follow):
Brow, Upper Lip, Chin, Beard, Full Body, Arms, Legs, Sugaring, Bikini, Brazilian

**8. Kids/Teens Services**:
Kids Braids, Gentle Haircuts, Teen Facials, Nail Polish

#### Optional Categories (Fast Follow or Later)

**9. Barbering Services**:
Haircuts, Beard Grooming, Line Ups, Shaves, Colour

**10. Spa & Wellness**:
Massage Therapy, Aromatherapy, Reflexology, Hot Stone Massage

**12. Men's Grooming**:
Haircuts, Beard Care, Facials for Men, Scalp Treatments

**13. Permanent Makeup/Cosmetic Tattooing**:
Lip Blushing, Eyeliner Tattoo, Scalp Micropigmentation, Freckle Tattooing

**14. Body Treatments**:
Body Scrubs, Wraps, Cellulite Treatments, Back Facials

**15. Training & Classes**:
Makeup Classes, Hair Braiding Workshops, Nail Tech Training, Lash Certification

**16. Tattoo & Piercing Services**:
Ear, Nose, Body Piercing, Small Tattoos

**17. Retail & Product Sales**:
Hair Care Products, Skincare Lines, Lash & Brow Products, Accessories

---

### F. Booking Policies & Business Rules

#### Deposit Requirements

**Deposit Structure**:
- Deposits are MANDATORY
- Default amount: Provider decides (25%, 50%, fixed amount)
- Type: Flat amount OR percentage (provider chooses)
- Charged: At booking time

#### Cancellation Policy

**Client Cancellation**:
- Minimum notice: Provider decides
- Default cancellation fee: Full deposit (provider can modify)
- Late cancellation: Provider decides fee structure
- Deposit refundable only if provider's policy allows

**Provider Cancellation**:
- Client receives: Full refund
- Provider can manually initiate refunds

#### Rescheduling Policy

**Rules**:
- Clients can reschedule: Yes, with restrictions
- Direct rescheduling through platform
- Within allowed notice period (e.g., 24 hours set by provider)
- Minimum notice: Provider decides
- Maximum reschedules: Provider decides
- Reschedule fee: Provider decides (default: no fee)

#### No-Show Policy

**Default Rules**:
- Client no-show: Forfeit full deposit (provider decides)
- Grace period for late arrivals: Provider decides (10/15/30 min options)

#### Dispute Resolution

**Process**:
1. Automatic hold when dispute opened
2. Funds frozen for that booking
3. Platform mediation (48 hours)
4. Both parties submit messages, proof, media evidence
5. Resolution:
   - Provider wins: Payout released instantly
   - Client wins: Refund issued per cancellation policy
   - Non-refundable deposits kept if late cancellation
6. BNB keeps service fee only if transaction fully completed

---

### G. Additional Platform Features

#### Service Packages

**Bundles**:
- Providers can create: Yes
- Example: Hair + Makeup package
- Discounted package pricing: Yes

#### Consultation Bookings

**Options**:
- Free consultation bookings: Yes
- Virtual consultations: Yes

#### Mobile Service

**Capabilities**:
- Providers can offer mobile services: Yes
- Come to client location
- Different pricing for mobile: Yes
- Add as add-on with separate fee

#### Wait Lists

**Functionality**:
- If provider fully booked: Yes
- Clients can join waitlist
- Notified when slot opens

---

### H. Content Moderation & Verification

#### Content Moderation

**What Needs Review**:
- Provider profiles: Before marketplace (available on booking link immediately)
- Service images/videos: Before marketplace (available on booking link immediately)
- Client reviews: Before posting
- Reported content: Manual review

**Moderation Process**:
- Manual review by admin: No
- Automated content scanning: Yes
- Community reporting: Yes

#### Provider Verification

**Required**:
- Email verification: Required
- Phone verification: Required
- Portfolio review: Required

**Optional**:
- Business license upload: Optional
- Liability insurance: Optional

---

### I. Marketing Landing Pages

**Beauty Pro Landing Pages** (Must Have):
- Emphasize who we are
- AI-first platform positioning
- All features overview
- Pricing packages display
- Similar to: https://www.fresha.com/for-business and https://www.fresha.com/pricing

**Key Messages**:
- 2-month free trial
- No payment processing fees for beauty pros
- AI-powered features
- High-converting copy (work with Edward: edagyemanji@gmail.com)

---

## Design System

### Color Palette

**Primary Colors**:
- Primary: #B06F64 (Dusty Rose)
- Accent: #FFB09E (Peach Blush)
- Secondary: #CA8D80 (Warm Taupe)
- Tertiary: #DF9C8C (Blush Clay)
- Buttons: #2A3F4D (Dark Slate Blue-Grey) and #FFB09E (Peach Blush)

**Note**: Work with Edward (edagyemanji@gmail.com) to get exact colors

### Typography

- **Heading Font**: Playfair Display (elegant serif)
- **Body Font**: Inter (modern sans-serif)

### Design Style

- Modern & Feminine
- Luxurious & Sophisticated
- Very modern interface
- Picture and video focused
- Large display of images/videos (similar to existing site)
- Not mirroring other beauty directories

**Reference**: https://beautynbrushes.com/

---

## Technical Stack

**Frontend**: Next.js, TypeScript  
**Backend**: Node.js, TypeScript  
**Database**: PostgreSQL  
**ORM**: Prisma  
**Payment Processing**:
- Stripe (North America & Europe)
- Paystack (African countries: Ghana, Nigeria)

**File Storage**: AWS S3 with CloudFront CDN  
**Email**: SendGrid  
**AI**: OpenAI (GPT-4 Vision), Google Gemini Vision  
**Deployment**: Railway  

---

## Success Metrics

### Launch Targets

- 50+ active providers
- 500+ client registrations
- 100+ completed bookings
- 99%+ system uptime

### Growth Targets

- Expand to multiple cities
- Increase provider base
- Build strong brand presence
- Achieve profitability

---

**Document Version**: 2.0  
**Last Updated**: Based on Client Confirmation Document  
**Status**: Approved - Ready for Development