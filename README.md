# Beauty N Brushes

AI-powered, visual-first beauty services marketplace

## 🏗️ Project Structure

```
beauty-n-brushes/
├── backend/          # Express + TypeScript + Prisma API
├── frontend/         # Next.js 14 + TypeScript + Shadcn UI
├── docs/            # Complete documentation
└── package.json     # Monorepo workspace config
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start database
docker-compose up -d

# Setup database
npm run db:generate && npm run db:migrate && npm run db:seed

# Start development (both servers)
npm run dev
```

**Servers:**

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Database: `npm run db:studio` → http://localhost:5555

## 🎯 What's Included

### ✅ Complete Backend

- Express + TypeScript API server
- Prisma ORM with **complete database schema** (15+ tables)
- Authentication (JWT + bcrypt)
- Regional payment utilities (Stripe + Paystack)
- Service layer stubs (email, storage, AI, payment)

### ✅ Complete Frontend

- Next.js 14 (App Router)
- **30 Shadcn UI components** installed and ready
- **BNB theme colors** fully configured
- TypeScript strict mode
- API client with Axios
- Custom hooks and stores

### ✅ Database Schema

- Users (clients, providers, admins)
- Provider profiles & policies
- Services with categories & subcategories
- Service media & add-ons
- Bookings with **regional payment support**
- Reviews, Messages, Favorites
- Multi-currency (USD, GHS, NGN)

## 🎨 Theme

**Official Color Palette (Configured):**

- Primary: #B06F64 (Dusty Rose)
- Accent: #FFB09E (Peach Blush)
- Secondary: #CA8D80 (Warm Taupe)
- Tertiary: #DF9C8C (Blush Clay)
- Buttons: #2A3F4D & #FFB09E

**Fonts:**

- Heading: Playfair Display
- Body: Inter

## 📚 Documentation

Complete guides in `docs/` directory:

| Document                               | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `bnb_complete_implementation_guide.md` | **Step-by-step development tasks** |
| `bnb_requirements.md`                  | Feature requirements               |
| `bnb_tech_architecture.md`             | Database & API design              |
| `bnb_setup_guide.md`                   | Detailed setup                     |
| `bnb_shadcn_ui_guide.md`               | UI components                      |
| `bnb_paystack_integration_guide.md`    | Paystack integration               |
| `bnb_security_compliance.md`           | Security guidelines                |
| `bnb_deployment_guide.md`              | Deployment                         |

## 🧪 Test Accounts

| Email                      | Password    | Role     |
| -------------------------- | ----------- | -------- |
| admin@beautyandbrushes.com | admin123    | Admin    |
| client@example.com         | client123   | Client   |
| provider@example.com       | provider123 | Provider |

## 🛠️ Scripts

```bash
# Development
npm run dev                 # Start both
npm run dev:backend         # Backend only
npm run dev:frontend        # Frontend only

# Database
npm run db:generate         # Generate Prisma Client
npm run db:migrate          # Run migrations
npm run db:seed             # Seed data
npm run db:studio           # Database UI

# Build
npm run build              # Build both
npm start                  # Start production

# Quality
npm run lint               # Lint all
npm run type-check         # TypeScript check
```

## 🎯 Next: Start Building

1. **See**: `START_HERE.md` for setup verification
2. **Follow**: `docs/bnb_complete_implementation_guide.md` for tasks
3. **Start with**: Phase 1 - Authentication System

---

Built with Next.js, Express, Prisma, and Shadcn UI
