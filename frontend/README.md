# Beauty N Brushes - Frontend

Next.js 14 + TypeScript + Shadcn UI Application

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit: http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run type-check` - TypeScript type checking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn components
│   │   └── shared/      # Shared components
│   ├── lib/             # Utilities
│   ├── hooks/           # Custom hooks
│   └── types/           # TypeScript types
├── public/              # Static assets
└── package.json
```

## Setup Shadcn UI

```bash
# Initialize Shadcn UI
npx shadcn-ui@latest init

# Add components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
# ... etc
```

## Color Palette

The project uses the official Beauty N Brushes color palette:

- **Primary**: #B06F64 (Dusty Rose)
- **Accent**: #FFB09E (Peach Blush)
- **Secondary**: #CA8D80 (Warm Taupe)
- **Tertiary**: #DF9C8C (Blush Clay)
- **Button Dark**: #2A3F4D
- **Button Light**: #FFB09E

Use these in your components via Tailwind classes:
- `bg-primary`, `text-primary`, `border-primary`
- `bg-accent`, `text-accent`
- `btn-primary`, `btn-secondary` (custom utility classes)

