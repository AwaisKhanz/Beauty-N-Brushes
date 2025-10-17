# Beauty N Brushes - Shadcn UI Setup & Configuration Guide

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Theme Colors](#theme-colors)
4. [Components to Install](#components-to-install)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)

---

## Installation

### Step 1: Initialize Shadcn UI

```bash
# Initialize Shadcn UI in your Next.js project
npx shadcn-ui@latest init
```

### Step 2: Configuration Prompts

When prompted, use these settings:

```
✔ Would you like to use TypeScript? › Yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? › src/app/globals.css
✔ Would you like to use CSS variables for colors? › Yes
✔ Where is your tailwind.config.js located? › tailwind.config.ts
✔ Configure the import alias for components? › @/components
✔ Configure the import alias for utils? › @/lib/utils
✔ Are you using React Server Components? › Yes
✔ Write configuration to components.json? › Yes
```

---

## Configuration

### 1. Tailwind Config (`tailwind.config.ts`)

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

        // Beauty N Brushes Official Color Palette
        primary: {
          DEFAULT: "hsl(var(--primary))", // Dusty Rose #B06F64
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))", // Warm Taupe #CA8D80
          foreground: "hsl(var(--secondary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))", // Blush Clay #DF9C8C
          foreground: "hsl(var(--tertiary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))", // Peach Blush #FFB09E
          foreground: "hsl(var(--accent-foreground))",
        },
        "button-dark": {
          DEFAULT: "hsl(var(--button-dark))", // Dark Slate Blue-Grey #2A3F4D
          foreground: "hsl(var(--button-dark-foreground))",
        },
        "button-light": {
          DEFAULT: "hsl(var(--button-light))", // Peach Blush #FFB09E
          foreground: "hsl(var(--button-light-foreground))",
        },

        // Shadcn default colors
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
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
      fontFamily: {
        sans: ["var(--font-inter)"],
        heading: ["var(--font-playfair)"],
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in-from-top 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 2. Global CSS (`src/app/globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Base colors */
    --background: 0 0% 100%;
    --foreground: 210 40% 8%;

    /* Card */
    --card: 0 0% 100%;
    --card-foreground: 210 40% 8%;

    /* Popover */
    --popover: 0 0% 100%;
    --popover-foreground: 210 40% 8%;

    /* Beauty N Brushes Official Colors */
    --primary: 11 36% 55%; /* #B06F64 - Dusty Rose */
    --primary-foreground: 0 0% 100%;

    --secondary: 12 36% 66%; /* #CA8D80 - Warm Taupe */
    --secondary-foreground: 0 0% 100%;

    --tertiary: 13 48% 72%; /* #DF9C8C - Blush Clay */
    --tertiary-foreground: 0 0% 100%;

    --accent: 18 100% 80%; /* #FFB09E - Peach Blush */
    --accent-foreground: 207 31% 23%; /* #2A3F4D */

    --button-dark: 207 31% 23%; /* #2A3F4D - Dark Slate Blue-Grey */
    --button-dark-foreground: 0 0% 100%;

    --button-light: 18 100% 80%; /* #FFB09E - Peach Blush */
    --button-light-foreground: 207 31% 23%;

    /* Muted */
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* Destructive */
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    /* Border */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 11 36% 55%; /* Primary color */

    /* Radius */
    --radius: 0.75rem;
  }

  .dark {
    --background: 210 40% 8%;
    --foreground: 0 0% 100%;

    --card: 210 40% 10%;
    --card-foreground: 0 0% 100%;

    --popover: 210 40% 10%;
    --popover-foreground: 0 0% 100%;

    --primary: 11 36% 55%;
    --primary-foreground: 0 0% 100%;

    --secondary: 12 36% 66%;
    --secondary-foreground: 0 0% 100%;

    --tertiary: 13 48% 72%;
    --tertiary-foreground: 0 0% 100%;

    --accent: 18 100% 80%;
    --accent-foreground: 207 31% 23%;

    --button-dark: 207 31% 23%;
    --button-dark-foreground: 0 0% 100%;

    --button-light: 18 100% 80%;
    --button-light-foreground: 207 31% 23%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 100%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
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
  /* Custom utility classes */
  .page-container {
    @apply container mx-auto px-4 py-8;
  }

  .section-heading {
    @apply font-heading text-3xl font-bold tracking-tight text-primary;
  }

  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
  }

  .btn-primary {
    @apply bg-button-dark text-button-dark-foreground hover:bg-button-dark/90;
  }

  .btn-secondary {
    @apply bg-button-light text-button-light-foreground hover:bg-button-light/90;
  }
}
```

### 3. Font Setup (`src/app/layout.tsx`)

```typescript
import { Inter } from 'next/font/google';
import { Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

## Theme Colors

### Official Beauty N Brushes Color Palette

| Color Name | Hex Code | HSL Value | Usage |
|------------|----------|-----------|-------|
| **Dusty Rose** | #B06F64 | 11° 36% 55% | Primary brand color, headings, main CTAs |
| **Peach Blush** | #FFB09E | 18° 100% 80% | Accent color, highlights, secondary CTAs |
| **Warm Taupe** | #CA8D80 | 12° 36% 66% | Secondary elements, borders, dividers |
| **Blush Clay** | #DF9C8C | 13° 48% 72% | Tertiary accents, badges, tags |
| **Dark Slate Blue-Grey** | #2A3F4D | 207° 31% 23% | Primary buttons, dark text |

### Color Usage Guidelines

```typescript
// Primary - Main brand elements
<h1 className="text-primary">Beauty N Brushes</h1>
<Button className="bg-primary text-primary-foreground">Primary Action</Button>

// Secondary - Supporting elements
<div className="border-secondary bg-secondary/10">
  <p className="text-secondary-foreground">Secondary content</p>
</div>

// Accent - Highlights and attention
<Badge className="bg-accent text-accent-foreground">New</Badge>
<div className="border-l-4 border-accent">Featured</div>

// Tertiary - Additional accents
<span className="text-tertiary">Special offer</span>

// Buttons
<Button className="btn-primary">Book Now</Button>
<Button className="btn-secondary">Learn More</Button>
<Button className="bg-button-dark text-button-dark-foreground">Dark Button</Button>
<Button className="bg-button-light text-button-light-foreground">Light Button</Button>
```

---

## Components to Install

### Essential Components (Install First)

```bash
# Core UI components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar

# Form components
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add switch

# Navigation
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add tabs

# Feedback
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add dialog

# Display
npx shadcn-ui@latest add table
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area

# Advanced
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add slider
```

### Install All at Once

```bash
# Install all essential components in one command
npx shadcn-ui@latest add button input label card badge avatar form select checkbox radio-group textarea switch dropdown-menu navigation-menu tabs toast alert alert-dialog dialog table skeleton separator scroll-area calendar popover tooltip sheet accordion slider
```

---

## Usage Examples

### 1. Button Examples

```tsx
import { Button } from '@/components/ui/button';

export function ButtonExamples() {
  return (
    <div className="space-y-4">
      {/* Primary Button (Dark) */}
      <Button className="bg-button-dark text-button-dark-foreground hover:bg-button-dark/90">
        Book Appointment
      </Button>

      {/* Secondary Button (Light) */}
      <Button className="bg-button-light text-button-light-foreground hover:bg-button-light/90">
        View Services
      </Button>

      {/* Primary Brand Color */}
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
        Get Started
      </Button>

      {/* Outline with Brand Color */}
      <Button
        variant="outline"
        className="border-primary text-primary hover:bg-primary/10"
      >
        Learn More
      </Button>

      {/* Accent Button */}
      <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
        Special Offer
      </Button>
    </div>
  );
}
```

### 2. Card Examples

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ServiceCard() {
  return (
    <Card className="card-hover border-secondary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex items-start justify-between">
          <CardTitle className="text-primary">Box Braids</CardTitle>
          <Badge className="bg-accent text-accent-foreground">Featured</Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          Professional box braids styling
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="text-sm font-medium">4-6 hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="text-lg font-bold text-primary">$150-200</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full btn-primary">
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 3. Form Examples

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export function ContactForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Your Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Jane Doe"
                  {...field}
                  className="focus:ring-primary focus:border-primary"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  {...field}
                  className="focus:ring-primary focus:border-primary"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us what you need..."
                  className="resize-none focus:ring-primary focus:border-primary"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-muted-foreground">
                We'll get back to you within 24 hours
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full btn-primary">
          Send Message
        </Button>
      </form>
    </Form>
  );
}
```

### 4. Badge Examples

```tsx
import { Badge } from '@/components/ui/badge';

export function BadgeExamples() {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Primary */}
      <Badge className="bg-primary text-primary-foreground">
        Featured
      </Badge>

      {/* Accent */}
      <Badge className="bg-accent text-accent-foreground">
        New
      </Badge>

      {/* Secondary */}
      <Badge className="bg-secondary text-secondary-foreground">
        Popular
      </Badge>

      {/* Tertiary */}
      <Badge className="bg-tertiary text-tertiary-foreground">
        Limited
      </Badge>

      {/* Outline */}
      <Badge variant="outline" className="border-primary text-primary">
        Verified
      </Badge>
    </div>
  );
}
```

### 5. Dialog/Modal Examples

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function BookingDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="btn-primary">Book Appointment</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Book Your Appointment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select your preferred date and time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add your booking form here */}
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-secondary">
            Cancel
          </Button>
          <Button className="btn-primary">
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 6. Navigation Menu Example

```tsx
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

export function MainNav() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-foreground hover:text-primary">
            Services
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    href="/services/braids"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-primary/5 p-6 no-underline outline-none focus:shadow-md hover:bg-primary/10 transition-colors"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium text-primary">
                      Braids
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Professional braiding services for all styles
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

---

## Best Practices

### 1. Always Use Theme Colors

```tsx
// ✅ CORRECT - Use theme colors
<Button className="bg-button-dark text-button-dark-foreground">
  Click Me
</Button>

<div className="bg-primary/10 border border-primary">
  Highlighted content
</div>

// ❌ WRONG - Never use arbitrary colors
<Button className="bg-pink-500">Click Me</Button>
<div className="bg-rose-100">Content</div>
```

### 2. Use Semantic Color Names

```tsx
// ✅ CORRECT - Use semantic names
<Alert className="border-primary bg-primary/5">
  <AlertTitle className="text-primary">Success!</AlertTitle>
  <AlertDescription>Your booking is confirmed</AlertDescription>
</Alert>

// ❌ WRONG - Don't hardcode hex colors
<Alert className="border-[#B06F64]">...</Alert>
```

### 3. Maintain Consistency

```tsx
// ✅ CORRECT - Consistent button styling
<div className="flex gap-2">
  <Button className="btn-primary">Primary Action</Button>
  <Button className="btn-secondary">Secondary Action</Button>
</div>

// ❌ WRONG - Inconsistent styling
<div className="flex gap-2">
  <Button className="bg-blue-600">Action 1</Button>
  <Button className="bg-green-500">Action 2</Button>
</div>
```

### 4. Use Opacity for Variations

```tsx
// ✅ CORRECT - Use opacity modifiers
<div className="bg-primary/5">Light background</div>
<div className="bg-primary/10">Medium background</div>
<div className="bg-primary/20">Darker background</div>
<div className="border-secondary/30">Subtle border</div>

// Hover states
<Button className="bg-primary hover:bg-primary/90">
  Hover Me
</Button>
```

### 5. Proper Component Imports

```tsx
// ✅ CORRECT - Named imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ❌ WRONG - Default imports or wrong paths
import Button from '@/components/ui/button';
import * as Card from '@/components/ui/card';
```

### 6. Responsive Design

```tsx
// ✅ CORRECT - Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="w-full">...</Card>
  <Card className="w-full">...</Card>
  <Card className="w-full">...</Card>
</div>

// Button sizing
<Button className="btn-primary w-full md:w-auto">
  Responsive Button
</Button>
```

### 7. Accessibility

```tsx
// ✅ CORRECT - Proper accessibility
<Button
  className="btn-primary"
  aria-label="Book appointment"
  disabled={isLoading}
>
  {isLoading ? 'Booking...' : 'Book Now'}
</Button>

<Dialog>
  <DialogTitle>Booking Confirmation</DialogTitle>
  <DialogDescription>
    Please review your booking details
  </DialogDescription>
  {/* Content */}
</Dialog>
```

---

## Component Checklist

Before using any component:

- [ ] Component installed via `npx shadcn-ui@latest add [component]`
- [ ] Using theme colors (primary, secondary, accent, etc.)
- [ ] Proper imports from `@/components/ui/*`
- [ ] TypeScript types defined
- [ ] Accessibility attributes added
- [ ] Responsive classes applied
- [ ] Hover/focus states using theme colors
- [ ] Consistent with existing components

---

## Quick Reference

### Color Variables

```css
/* Use these in your components */
bg-primary         /* Dusty Rose background */
text-primary       /* Dusty Rose text */
border-primary     /* Dusty Rose border */
bg-primary/10      /* 10% opacity Dusty Rose */

bg-secondary       /* Warm Taupe background */
bg-tertiary        /* Blush Clay background */
bg-accent          /* Peach Blush background */

bg-button-dark     /* Dark Slate Blue-Grey */
bg-button-light    /* Peach Blush (same as accent) */
```

### Utility Classes

```css
.btn-primary       /* Primary button style */
.btn-secondary     /* Secondary button style */
.card-hover        /* Card hover effect */
.section-heading   /* Section heading style */
.page-container    /* Page container with padding */
```

---

**Document Version**: 1.0
**Last Updated**: Shadcn UI Configuration with BNB Theme
**Status**: Production Ready
