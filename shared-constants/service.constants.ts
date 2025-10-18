/**
 * Service-related constants
 * Shared between frontend and backend
 * Complete service catalog with categories, subcategories, and templates
 */

// ============================================
// SERVICE CATEGORIES WITH SUBCATEGORIES & TEMPLATES
// ============================================

export interface ServiceTemplate {
  id: string;
  name: string;
  description?: string;
  suggestedDuration?: number; // minutes
  suggestedPriceMin?: number; // USD
  suggestedPriceMax?: number; // USD
}

export interface ServiceSubcategory {
  id: string;
  name: string;
  slug: string;
  templates: ServiceTemplate[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  isEssential: boolean; // Essential vs Optional
  subcategories?: ServiceSubcategory[];
  templates?: ServiceTemplate[]; // For categories without subcategories
}

// ============================================
// ESSENTIAL CATEGORIES (8)
// ============================================

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  // 1. HAIR SERVICES
  {
    id: 'hair',
    name: 'Hair Services',
    slug: 'hair',
    icon: 'Scissors',
    isEssential: true,
    subcategories: [
      // a. Natural & Relaxed Hair
      {
        id: 'hair-natural-relaxed',
        name: 'Natural & Relaxed Hair',
        slug: 'natural-relaxed',
        templates: [
          {
            id: 'invisible-ponytail',
            name: 'Invisible Ponytail',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'flexi-rod-set',
            name: 'Flexi Rod Set',
            suggestedDuration: 60,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'finger-curling',
            name: 'Finger Curling',
            suggestedDuration: 90,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'blow-out',
            name: 'Blow Out',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'bantu-knots',
            name: 'Bantu Knots',
            suggestedDuration: 60,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'bantu-knot-out',
            name: 'Bantu Knot-Out',
            suggestedDuration: 30,
            suggestedPriceMin: 30,
            suggestedPriceMax: 60,
          },
          {
            id: 'perm-rod-set',
            name: 'Perm Rod Set',
            suggestedDuration: 75,
            suggestedPriceMin: 55,
            suggestedPriceMax: 110,
          },
          {
            id: 'jerry-curls',
            name: 'Jerry Curls',
            suggestedDuration: 90,
            suggestedPriceMin: 70,
            suggestedPriceMax: 140,
          },
          {
            id: 'relaxer',
            name: 'Relaxer',
            suggestedDuration: 120,
            suggestedPriceMin: 80,
            suggestedPriceMax: 150,
          },
          {
            id: 'relaxer-touch-up',
            name: 'Relaxer Touch-Up',
            suggestedDuration: 90,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'wash-style',
            name: 'Wash & Style',
            suggestedDuration: 60,
            suggestedPriceMin: 45,
            suggestedPriceMax: 90,
          },
          {
            id: 'wash-roller-set',
            name: 'Wash & Roller Set',
            suggestedDuration: 75,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'wash-go',
            name: 'Wash & Go',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'updo',
            name: 'Updo',
            suggestedDuration: 60,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'texturiser',
            name: 'Texturiser',
            suggestedDuration: 90,
            suggestedPriceMin: 70,
            suggestedPriceMax: 130,
          },
          {
            id: 'styling',
            name: 'Styling',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'silk-press',
            name: 'Silk Press',
            suggestedDuration: 120,
            suggestedPriceMin: 80,
            suggestedPriceMax: 160,
          },
          {
            id: 'shingling',
            name: 'Shingling',
            suggestedDuration: 90,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
        ],
      },
      // b. Braids, Twists & Extensions
      {
        id: 'hair-braids-twists',
        name: 'Braids, Twists & Extensions',
        slug: 'braids-twists-extensions',
        templates: [
          {
            id: 'box-braids-small',
            name: 'Small Box Braids',
            suggestedDuration: 360,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'box-braids-medium',
            name: 'Medium Box Braids',
            suggestedDuration: 300,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'box-braids-large',
            name: 'Large Box Braids',
            suggestedDuration: 240,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
          {
            id: 'micro-braids',
            name: 'Micro Braids',
            suggestedDuration: 480,
            suggestedPriceMin: 200,
            suggestedPriceMax: 400,
          },
          {
            id: 'tree-braids',
            name: 'Tree Braids',
            suggestedDuration: 300,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'single-braids',
            name: 'Single Braids',
            suggestedDuration: 300,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'sisterlocs',
            name: 'Sisterlocs',
            suggestedDuration: 360,
            suggestedPriceMin: 200,
            suggestedPriceMax: 400,
          },
          {
            id: 'traditional-locs',
            name: 'Traditional Locs',
            suggestedDuration: 180,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
          {
            id: 'microlocs',
            name: 'Microlocs',
            suggestedDuration: 360,
            suggestedPriceMin: 180,
            suggestedPriceMax: 350,
          },
          {
            id: 'loc-extensions',
            name: 'Loc Extensions',
            suggestedDuration: 240,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'loc-repair',
            name: 'Loc Repair',
            suggestedDuration: 120,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'starter-locs',
            name: 'Starter Locs',
            suggestedDuration: 180,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
          {
            id: 'loc-retwist',
            name: 'Loc Retwist',
            suggestedDuration: 120,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'faux-locs',
            name: 'Faux Locs',
            suggestedDuration: 360,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'two-strand-twists',
            name: 'Two-Strand Twists',
            suggestedDuration: 180,
            suggestedPriceMin: 80,
            suggestedPriceMax: 160,
          },
          {
            id: 'marley-twists',
            name: 'Marley Twists',
            suggestedDuration: 300,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'havana-twists',
            name: 'Havana Twists',
            suggestedDuration: 300,
            suggestedPriceMin: 130,
            suggestedPriceMax: 260,
          },
          {
            id: 'knotless-twists',
            name: 'Knotless Twists',
            suggestedDuration: 360,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'flat-twists',
            name: 'Flat Twists',
            suggestedDuration: 120,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'senegalese-twists',
            name: 'Senegalese Twists',
            suggestedDuration: 300,
            suggestedPriceMin: 130,
            suggestedPriceMax: 260,
          },
          {
            id: 'knotless-braids',
            name: 'Knotless Braids',
            suggestedDuration: 360,
            suggestedPriceMin: 180,
            suggestedPriceMax: 350,
          },
          {
            id: 'cornrows',
            name: 'Cornrows',
            suggestedDuration: 120,
            suggestedPriceMin: 60,
            suggestedPriceMax: 150,
          },
          {
            id: 'lemonade-braids',
            name: 'Lemonade Braids',
            suggestedDuration: 240,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'crochet-braids',
            name: 'Crochet Braids',
            suggestedDuration: 180,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
          {
            id: 'ghana-braids',
            name: 'Ghana Braids',
            suggestedDuration: 240,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'feed-in-braids',
            name: 'Feed-In Braids',
            suggestedDuration: 240,
            suggestedPriceMin: 130,
            suggestedPriceMax: 260,
          },
          {
            id: 'goddess-braids',
            name: 'Goddess Braids',
            suggestedDuration: 180,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
        ],
      },
      // c. Colour & Treatment
      {
        id: 'hair-color-treatment',
        name: 'Colour & Treatment',
        slug: 'color-treatment',
        templates: [
          {
            id: 'moisturising-treatment',
            name: 'Moisturising Treatment',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'hot-oil-treatment',
            name: 'Hot Oil Treatment',
            suggestedDuration: 30,
            suggestedPriceMin: 30,
            suggestedPriceMax: 60,
          },
          {
            id: 'deep-conditioner',
            name: 'Deep Conditioner',
            suggestedDuration: 45,
            suggestedPriceMin: 35,
            suggestedPriceMax: 70,
          },
          {
            id: 'protein-treatment',
            name: 'Protein Treatment',
            suggestedDuration: 60,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'custom-color',
            name: 'Custom Colour',
            suggestedDuration: 180,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'curly-color',
            name: 'Curly Colour',
            suggestedDuration: 180,
            suggestedPriceMin: 140,
            suggestedPriceMax: 280,
          },
          {
            id: 'weave-dye',
            name: 'Weave Dye',
            suggestedDuration: 90,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'partial-highlights',
            name: 'Partial Highlights',
            suggestedDuration: 120,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
          {
            id: 'ombre',
            name: 'Ombre',
            suggestedDuration: 180,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'full-highlights',
            name: 'Full Highlights',
            suggestedDuration: 180,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'full-color',
            name: 'Full Colour',
            suggestedDuration: 150,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'color-retouch',
            name: 'Colour Retouch',
            suggestedDuration: 90,
            suggestedPriceMin: 70,
            suggestedPriceMax: 140,
          },
          {
            id: 'bundle-color',
            name: 'Bundle Colour',
            suggestedDuration: 90,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'balayage',
            name: 'Balayage',
            suggestedDuration: 180,
            suggestedPriceMin: 150,
            suggestedPriceMax: 350,
          },
        ],
      },
      // d. Wigs, Weaves & Extensions
      {
        id: 'hair-wigs-weaves',
        name: 'Wigs, Weaves & Extensions',
        slug: 'wigs-weaves-extensions',
        templates: [
          {
            id: 'wig-u-part',
            name: 'Wig (U-Part)',
            suggestedDuration: 90,
            suggestedPriceMin: 80,
            suggestedPriceMax: 160,
          },
          {
            id: 'wig-frontal',
            name: 'Wig (Frontal)',
            suggestedDuration: 120,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
          {
            id: 'wig-closure',
            name: 'Wig (Closure)',
            suggestedDuration: 90,
            suggestedPriceMin: 80,
            suggestedPriceMax: 160,
          },
          {
            id: 'hollywood-waves',
            name: 'Hollywood Waves',
            suggestedDuration: 60,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'clip-ins',
            name: 'Clip-Ins',
            suggestedDuration: 30,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'frontal-touch-up',
            name: 'Frontal Touch-Up',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'full-head-weave',
            name: 'Full Head Weave',
            suggestedDuration: 240,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'fusion-extensions',
            name: 'Fusion Extensions',
            suggestedDuration: 180,
            suggestedPriceMin: 200,
            suggestedPriceMax: 400,
          },
          {
            id: 'half-up-down',
            name: 'Half Up & Down',
            suggestedDuration: 60,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'half-weave',
            name: 'Half Weave',
            suggestedDuration: 120,
            suggestedPriceMin: 100,
            suggestedPriceMax: 200,
          },
          {
            id: 'lace-closure-tighten',
            name: 'Lace Closure Tighten',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'quick-weave',
            name: 'Quick Weave',
            suggestedDuration: 90,
            suggestedPriceMin: 80,
            suggestedPriceMax: 160,
          },
          {
            id: 'u-part-sew-in',
            name: 'U-Part Sew-In',
            suggestedDuration: 180,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'versatile-weave',
            name: 'Versatile Weave',
            suggestedDuration: 180,
            suggestedPriceMin: 130,
            suggestedPriceMax: 260,
          },
          {
            id: 'weave-frontal',
            name: 'Weave + Frontal',
            suggestedDuration: 240,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'weave-leave-out',
            name: 'Weave Installation (Leave Out)',
            suggestedDuration: 180,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'weave-closure',
            name: 'Weave Installation (Closure)',
            suggestedDuration: 180,
            suggestedPriceMin: 120,
            suggestedPriceMax: 250,
          },
          {
            id: 'weave-360-frontal',
            name: 'Weave Installation (360 Frontal)',
            suggestedDuration: 240,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'wig-installation',
            name: 'Wig Installation',
            suggestedDuration: 90,
            suggestedPriceMin: 80,
            suggestedPriceMax: 160,
          },
        ],
      },
      // e. Specials & Consultations
      {
        id: 'hair-specials',
        name: 'Specials & Consultations',
        slug: 'specials-consultations',
        templates: [
          {
            id: 'extension-removal',
            name: 'Extension Removal',
            suggestedDuration: 60,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'wedding-hairstyle',
            name: 'Wedding Hairstyle',
            suggestedDuration: 120,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'special-occasion-styling',
            name: 'Special Occasion Styling',
            suggestedDuration: 90,
            suggestedPriceMin: 80,
            suggestedPriceMax: 160,
          },
          {
            id: 'hair-consultation',
            name: 'Hair Consultation',
            suggestedDuration: 30,
            suggestedPriceMin: 0,
            suggestedPriceMax: 50,
          },
        ],
      },
      // f. Cuts
      {
        id: 'hair-cuts',
        name: 'Cuts',
        slug: 'cuts',
        templates: [
          {
            id: 'bob-cut',
            name: 'Bob Cut',
            suggestedDuration: 60,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'color-cut',
            name: 'Colour & Cut',
            suggestedDuration: 180,
            suggestedPriceMin: 150,
            suggestedPriceMax: 300,
          },
          {
            id: 'lob-cut',
            name: 'Lob Cut',
            suggestedDuration: 60,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'precision-cut',
            name: 'Precision Cut',
            suggestedDuration: 75,
            suggestedPriceMin: 60,
            suggestedPriceMax: 120,
          },
          {
            id: 'short-cut',
            name: 'Short Cut',
            suggestedDuration: 45,
            suggestedPriceMin: 40,
            suggestedPriceMax: 80,
          },
          {
            id: 'tapered-cut',
            name: 'Tapered Cut',
            suggestedDuration: 60,
            suggestedPriceMin: 50,
            suggestedPriceMax: 100,
          },
          {
            id: 'trim',
            name: 'Trim',
            suggestedDuration: 30,
            suggestedPriceMin: 25,
            suggestedPriceMax: 50,
          },
        ],
      },
    ],
  },

  // 2. MAKEUP SERVICES
  {
    id: 'makeup',
    name: 'Makeup Services',
    slug: 'makeup',
    icon: 'Palette',
    isEssential: true,
    templates: [
      {
        id: 'bridal-makeup',
        name: 'Bridal Makeup',
        suggestedDuration: 120,
        suggestedPriceMin: 150,
        suggestedPriceMax: 300,
      },
      {
        id: 'special-events-makeup',
        name: 'Special Events Makeup',
        suggestedDuration: 90,
        suggestedPriceMin: 80,
        suggestedPriceMax: 150,
      },
      {
        id: 'everyday-makeup',
        name: 'Everyday Makeup',
        suggestedDuration: 45,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'birthday-makeup',
        name: 'Birthday Makeup',
        suggestedDuration: 60,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'film-tv-makeup',
        name: 'Film & Television Makeup',
        suggestedDuration: 90,
        suggestedPriceMin: 120,
        suggestedPriceMax: 250,
      },
      {
        id: 'full-glam',
        name: 'Full Glam',
        suggestedDuration: 90,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'halloween-makeup',
        name: 'Halloween Makeup',
        suggestedDuration: 120,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'natural-glam',
        name: 'Natural Glam',
        suggestedDuration: 60,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'photoshoot-glam',
        name: 'Photoshoot Glam',
        suggestedDuration: 90,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'shimmery-glitter-look',
        name: 'Shimmery / Glitter Look',
        suggestedDuration: 75,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
      {
        id: 'soft-glam',
        name: 'Soft Glam',
        suggestedDuration: 60,
        suggestedPriceMin: 70,
        suggestedPriceMax: 140,
      },
      {
        id: 'sfx-makeup',
        name: 'SFX Makeup',
        suggestedDuration: 150,
        suggestedPriceMin: 150,
        suggestedPriceMax: 350,
      },
      {
        id: 'theatre-makeup',
        name: 'Theatre Makeup',
        suggestedDuration: 90,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
    ],
  },

  // 3. NAIL SERVICES
  {
    id: 'nails',
    name: 'Nail Services',
    slug: 'nails',
    icon: 'Hand',
    isEssential: true,
    templates: [
      {
        id: 'manicure',
        name: 'Manicure',
        suggestedDuration: 45,
        suggestedPriceMin: 25,
        suggestedPriceMax: 50,
      },
      {
        id: 'pedicure',
        name: 'Pedicure',
        suggestedDuration: 60,
        suggestedPriceMin: 35,
        suggestedPriceMax: 70,
      },
      {
        id: 'mani-pedi',
        name: 'Mani & Pedi',
        suggestedDuration: 90,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'french-tips',
        name: 'French Tips',
        suggestedDuration: 60,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'nail-art-design',
        name: 'Nail Art Design',
        suggestedDuration: 75,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'polish-change-hands',
        name: 'Polish Change (Hands)',
        suggestedDuration: 30,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
      {
        id: 'polish-change-toes',
        name: 'Polish Change (Toes)',
        suggestedDuration: 30,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
      {
        id: 'shellac-mani',
        name: 'Shellac Manicure',
        suggestedDuration: 60,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'shellac-pedi',
        name: 'Shellac Pedicure',
        suggestedDuration: 75,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'shellac-chrome',
        name: 'Shellac Chrome',
        suggestedDuration: 75,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'dipping-ombre',
        name: 'Dipping Ombre',
        suggestedDuration: 90,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'dipping-french-tip',
        name: 'Dipping French Tip',
        suggestedDuration: 90,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: '3d-nail-art',
        name: '3D Nail Art',
        suggestedDuration: 90,
        suggestedPriceMin: 70,
        suggestedPriceMax: 140,
      },
      {
        id: 'acrylic-overlay',
        name: 'Acrylic Overlay',
        suggestedDuration: 75,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'acrylic-refill',
        name: 'Acrylic Refill',
        suggestedDuration: 60,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'acrylic-repair',
        name: 'Acrylic Repair',
        suggestedDuration: 30,
        suggestedPriceMin: 20,
        suggestedPriceMax: 40,
      },
      {
        id: 'uv-gel-overlay',
        name: 'UV Gel Overlay',
        suggestedDuration: 75,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'uv-gel-refill',
        name: 'UV Gel Refill',
        suggestedDuration: 60,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'uv-gel-repair',
        name: 'UV Gel Repair',
        suggestedDuration: 30,
        suggestedPriceMin: 20,
        suggestedPriceMax: 40,
      },
      {
        id: 'bio-gel-overlay',
        name: 'Bio Gel Overlay',
        suggestedDuration: 75,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'bio-gel-refill',
        name: 'Bio Gel Refill',
        suggestedDuration: 60,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'nail-take-off',
        name: 'Nail Take-Off',
        suggestedDuration: 30,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
      {
        id: 'pink-white',
        name: 'Pink & White',
        suggestedDuration: 90,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'mens-nails',
        name: "Men's Nails",
        suggestedDuration: 45,
        suggestedPriceMin: 30,
        suggestedPriceMax: 60,
      },
      {
        id: 'kids-nails',
        name: 'Kids Nails',
        suggestedDuration: 30,
        suggestedPriceMin: 20,
        suggestedPriceMax: 40,
      },
    ],
  },

  // 4. LASH SERVICES
  {
    id: 'lashes',
    name: 'Lash Services',
    slug: 'lashes',
    icon: 'Eye',
    isEssential: true,
    templates: [
      {
        id: 'lash-extensions',
        name: 'Lash Extensions',
        suggestedDuration: 120,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'lash-lift',
        name: 'Lash Lift',
        suggestedDuration: 60,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'lash-tint',
        name: 'Lash Tint',
        suggestedDuration: 30,
        suggestedPriceMin: 30,
        suggestedPriceMax: 60,
      },
      {
        id: 'classic-set',
        name: 'Classic Set',
        suggestedDuration: 120,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'classic-refill',
        name: 'Classic Refill',
        suggestedDuration: 90,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'hybrid-set',
        name: 'Hybrid Set',
        suggestedDuration: 150,
        suggestedPriceMin: 120,
        suggestedPriceMax: 250,
      },
      {
        id: 'hybrid-refill',
        name: 'Hybrid Refill',
        suggestedDuration: 90,
        suggestedPriceMin: 70,
        suggestedPriceMax: 140,
      },
      {
        id: 'mega-volume-set',
        name: 'Mega Volume Set',
        suggestedDuration: 180,
        suggestedPriceMin: 150,
        suggestedPriceMax: 300,
      },
      {
        id: 'mega-volume-refill',
        name: 'Mega Volume Refill',
        suggestedDuration: 120,
        suggestedPriceMin: 90,
        suggestedPriceMax: 180,
      },
      {
        id: 'volume-set',
        name: 'Volume Set',
        suggestedDuration: 150,
        suggestedPriceMin: 130,
        suggestedPriceMax: 260,
      },
      {
        id: 'volume-refill',
        name: 'Volume Refill',
        suggestedDuration: 90,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
      {
        id: 'full-set-removal',
        name: 'Full Set + Removal',
        suggestedDuration: 180,
        suggestedPriceMin: 150,
        suggestedPriceMax: 300,
      },
    ],
  },

  // 5. BROW SERVICES
  {
    id: 'brows',
    name: 'Brow Services',
    slug: 'brows',
    icon: 'Sparkles',
    isEssential: true,
    templates: [
      {
        id: 'brow-shaping',
        name: 'Brow Shaping',
        suggestedDuration: 30,
        suggestedPriceMin: 20,
        suggestedPriceMax: 40,
      },
      {
        id: 'brow-tinting',
        name: 'Brow Tinting',
        suggestedDuration: 30,
        suggestedPriceMin: 25,
        suggestedPriceMax: 50,
      },
      {
        id: 'microblading',
        name: 'Microblading',
        suggestedDuration: 180,
        suggestedPriceMin: 300,
        suggestedPriceMax: 600,
      },
      {
        id: 'henna-brow',
        name: 'Henna Brow',
        suggestedDuration: 45,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'hd-brow-lamination',
        name: 'HD Brow Lamination',
        suggestedDuration: 60,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'hd-brow-lamination-tint',
        name: 'HD Brow Lamination + Tint',
        suggestedDuration: 75,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
      {
        id: 'eyebrow-wax',
        name: 'Eyebrow Wax',
        suggestedDuration: 20,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
    ],
  },

  // 6. SKINCARE & ESTHETICIAN SERVICES
  {
    id: 'skincare',
    name: 'Skincare Services',
    slug: 'skincare',
    icon: 'Heart',
    isEssential: true,
    templates: [
      {
        id: 'facial-basic',
        name: 'Basic Facial',
        suggestedDuration: 60,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'facial-deep-cleanse',
        name: 'Deep Cleansing Facial',
        suggestedDuration: 75,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
      {
        id: 'facial-anti-aging',
        name: 'Anti-Aging Facial',
        suggestedDuration: 90,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'facial-hydrating',
        name: 'Hydrating Facial',
        suggestedDuration: 60,
        suggestedPriceMin: 70,
        suggestedPriceMax: 140,
      },
      {
        id: 'corrective-facial',
        name: 'Corrective Facial',
        suggestedDuration: 90,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'advanced-skincare',
        name: 'Advanced Skincare Treatment',
        suggestedDuration: 90,
        suggestedPriceMin: 120,
        suggestedPriceMax: 250,
      },
      {
        id: 'acne-treatment',
        name: 'Acne Treatment',
        suggestedDuration: 75,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
      {
        id: 'chemical-peel',
        name: 'Chemical Peel',
        suggestedDuration: 60,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
    ],
  },

  // 7. WAXING SERVICES
  {
    id: 'waxing',
    name: 'Waxing Services',
    slug: 'waxing',
    icon: 'Flame',
    isEssential: true,
    templates: [
      {
        id: 'brow-wax',
        name: 'Brow Wax',
        suggestedDuration: 15,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
      {
        id: 'upper-lip-wax',
        name: 'Upper Lip Wax',
        suggestedDuration: 15,
        suggestedPriceMin: 10,
        suggestedPriceMax: 20,
      },
      {
        id: 'chin-wax',
        name: 'Chin Wax',
        suggestedDuration: 15,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
      {
        id: 'beard-wax',
        name: 'Beard Wax',
        suggestedDuration: 30,
        suggestedPriceMin: 25,
        suggestedPriceMax: 50,
      },
      {
        id: 'full-body-wax',
        name: 'Full Body Wax',
        suggestedDuration: 180,
        suggestedPriceMin: 200,
        suggestedPriceMax: 400,
      },
      {
        id: 'arm-wax',
        name: 'Arms Wax',
        suggestedDuration: 30,
        suggestedPriceMin: 30,
        suggestedPriceMax: 60,
      },
      {
        id: 'leg-wax',
        name: 'Legs Wax',
        suggestedDuration: 45,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'sugaring',
        name: 'Sugaring',
        suggestedDuration: 45,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'bikini-wax',
        name: 'Bikini Wax',
        suggestedDuration: 30,
        suggestedPriceMin: 30,
        suggestedPriceMax: 60,
      },
      {
        id: 'brazilian-wax',
        name: 'Brazilian Wax',
        suggestedDuration: 45,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
    ],
  },

  // 8. KIDS / TEENS SERVICES
  {
    id: 'kids-teens',
    name: 'Kids / Teens Services',
    slug: 'kids-teens',
    icon: 'Users',
    isEssential: true,
    templates: [
      {
        id: 'kids-braids',
        name: 'Kids Braids',
        suggestedDuration: 120,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'gentle-haircut',
        name: 'Gentle Haircut',
        suggestedDuration: 30,
        suggestedPriceMin: 25,
        suggestedPriceMax: 50,
      },
      {
        id: 'teen-facial',
        name: 'Teen Facial',
        suggestedDuration: 45,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'nail-polish-kids',
        name: 'Nail Polish (Kids)',
        suggestedDuration: 20,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
      {
        id: 'kids-updo',
        name: 'Kids Updo',
        suggestedDuration: 45,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
    ],
  },

  // ============================================
  // OPTIONAL CATEGORIES (8)
  // ============================================

  // 9. BARBERING SERVICES
  {
    id: 'barbering',
    name: 'Barbering Services',
    slug: 'barbering',
    icon: 'Scissors',
    isEssential: false,
    templates: [
      {
        id: 'mens-haircut',
        name: "Men's Haircut",
        suggestedDuration: 45,
        suggestedPriceMin: 30,
        suggestedPriceMax: 60,
      },
      {
        id: 'beard-trim',
        name: 'Beard Trim',
        suggestedDuration: 30,
        suggestedPriceMin: 20,
        suggestedPriceMax: 40,
      },
      {
        id: 'beard-grooming',
        name: 'Beard Grooming',
        suggestedDuration: 45,
        suggestedPriceMin: 30,
        suggestedPriceMax: 60,
      },
      {
        id: 'line-up',
        name: 'Line Up',
        suggestedDuration: 20,
        suggestedPriceMin: 15,
        suggestedPriceMax: 30,
      },
      {
        id: 'hot-shave',
        name: 'Hot Shave',
        suggestedDuration: 45,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'hair-color-men',
        name: 'Hair Colour (Men)',
        suggestedDuration: 60,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'fade',
        name: 'Fade',
        suggestedDuration: 45,
        suggestedPriceMin: 35,
        suggestedPriceMax: 70,
      },
    ],
  },

  // 10. SPA & WELLNESS
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    slug: 'spa-wellness',
    icon: 'Flower',
    isEssential: false,
    templates: [
      {
        id: 'massage-therapy',
        name: 'Massage Therapy',
        suggestedDuration: 60,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
      {
        id: 'aromatherapy',
        name: 'Aromatherapy',
        suggestedDuration: 60,
        suggestedPriceMin: 70,
        suggestedPriceMax: 140,
      },
      {
        id: 'reflexology',
        name: 'Reflexology',
        suggestedDuration: 45,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'hot-stone-massage',
        name: 'Hot Stone Massage',
        suggestedDuration: 90,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'deep-tissue-massage',
        name: 'Deep Tissue Massage',
        suggestedDuration: 75,
        suggestedPriceMin: 90,
        suggestedPriceMax: 180,
      },
    ],
  },

  // 11. MEN'S GROOMING
  {
    id: 'mens-grooming',
    name: "Men's Grooming",
    slug: 'mens-grooming',
    icon: 'User',
    isEssential: false,
    templates: [
      {
        id: 'mens-haircut-premium',
        name: "Men's Premium Haircut",
        suggestedDuration: 60,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'beard-care-package',
        name: 'Beard Care Package',
        suggestedDuration: 60,
        suggestedPriceMin: 60,
        suggestedPriceMax: 120,
      },
      {
        id: 'mens-facial',
        name: "Men's Facial",
        suggestedDuration: 60,
        suggestedPriceMin: 70,
        suggestedPriceMax: 140,
      },
      {
        id: 'scalp-treatment-men',
        name: 'Scalp Treatment',
        suggestedDuration: 45,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
    ],
  },

  // 12. PERMANENT MAKEUP / COSMETIC TATTOOING
  {
    id: 'permanent-makeup',
    name: 'Permanent Makeup',
    slug: 'permanent-makeup',
    icon: 'Droplet',
    isEssential: false,
    templates: [
      {
        id: 'lip-blushing',
        name: 'Lip Blushing',
        suggestedDuration: 180,
        suggestedPriceMin: 400,
        suggestedPriceMax: 800,
      },
      {
        id: 'eyeliner-tattoo',
        name: 'Eyeliner Tattoo',
        suggestedDuration: 150,
        suggestedPriceMin: 300,
        suggestedPriceMax: 600,
      },
      {
        id: 'scalp-micropigmentation',
        name: 'Scalp Micropigmentation',
        suggestedDuration: 240,
        suggestedPriceMin: 500,
        suggestedPriceMax: 1000,
      },
      {
        id: 'freckle-tattooing',
        name: 'Freckle Tattooing',
        suggestedDuration: 90,
        suggestedPriceMin: 200,
        suggestedPriceMax: 400,
      },
    ],
  },

  // 13. BODY TREATMENTS
  {
    id: 'body-treatments',
    name: 'Body Treatments',
    slug: 'body-treatments',
    icon: 'Activity',
    isEssential: false,
    templates: [
      {
        id: 'body-scrub',
        name: 'Body Scrub',
        suggestedDuration: 60,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
      {
        id: 'body-wrap',
        name: 'Body Wrap',
        suggestedDuration: 90,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'cellulite-treatment',
        name: 'Cellulite Treatment',
        suggestedDuration: 75,
        suggestedPriceMin: 100,
        suggestedPriceMax: 200,
      },
      {
        id: 'back-facial',
        name: 'Back Facial',
        suggestedDuration: 60,
        suggestedPriceMin: 80,
        suggestedPriceMax: 160,
      },
    ],
  },

  // 14. TRAINING & CLASSES
  {
    id: 'training-classes',
    name: 'Training & Classes',
    slug: 'training-classes',
    icon: 'BookOpen',
    isEssential: false,
    templates: [
      {
        id: 'makeup-class',
        name: 'Makeup Class',
        suggestedDuration: 180,
        suggestedPriceMin: 150,
        suggestedPriceMax: 300,
      },
      {
        id: 'braiding-workshop',
        name: 'Hair Braiding Workshop',
        suggestedDuration: 240,
        suggestedPriceMin: 200,
        suggestedPriceMax: 400,
      },
      {
        id: 'nail-tech-training',
        name: 'Nail Tech Training',
        suggestedDuration: 480,
        suggestedPriceMin: 500,
        suggestedPriceMax: 1000,
      },
      {
        id: 'lash-certification',
        name: 'Lash Certification',
        suggestedDuration: 480,
        suggestedPriceMin: 600,
        suggestedPriceMax: 1200,
      },
    ],
  },

  // 15. TATTOO & PIERCING SERVICES
  {
    id: 'tattoo-piercing',
    name: 'Tattoo & Piercing',
    slug: 'tattoo-piercing',
    icon: 'Zap',
    isEssential: false,
    templates: [
      {
        id: 'ear-piercing',
        name: 'Ear Piercing',
        suggestedDuration: 15,
        suggestedPriceMin: 30,
        suggestedPriceMax: 60,
      },
      {
        id: 'nose-piercing',
        name: 'Nose Piercing',
        suggestedDuration: 15,
        suggestedPriceMin: 40,
        suggestedPriceMax: 80,
      },
      {
        id: 'body-piercing',
        name: 'Body Piercing',
        suggestedDuration: 30,
        suggestedPriceMin: 50,
        suggestedPriceMax: 100,
      },
      {
        id: 'small-tattoo',
        name: 'Small Tattoo',
        suggestedDuration: 60,
        suggestedPriceMin: 80,
        suggestedPriceMax: 200,
      },
    ],
  },

  // 16. RETAIL & PRODUCT SALES
  {
    id: 'retail-products',
    name: 'Retail & Product Sales',
    slug: 'retail-products',
    icon: 'ShoppingBag',
    isEssential: false,
    templates: [
      {
        id: 'hair-care-products',
        name: 'Hair Care Products',
        suggestedDuration: 0,
        suggestedPriceMin: 10,
        suggestedPriceMax: 100,
      },
      {
        id: 'skincare-products',
        name: 'Skincare Products',
        suggestedDuration: 0,
        suggestedPriceMin: 20,
        suggestedPriceMax: 150,
      },
      {
        id: 'lash-brow-products',
        name: 'Lash & Brow Products',
        suggestedDuration: 0,
        suggestedPriceMin: 15,
        suggestedPriceMax: 80,
      },
      {
        id: 'accessories',
        name: 'Accessories',
        suggestedDuration: 0,
        suggestedPriceMin: 5,
        suggestedPriceMax: 50,
      },
    ],
  },
];

// ============================================
// LEGACY / HELPER EXPORTS
// ============================================

export const SERVICE_SPECIALIZATIONS = [
  'Hair Styling & Cutting',
  'Hair Coloring & Highlights',
  'Braids & Extensions',
  'Makeup Artistry',
  'Nail Services',
  'Lash Services',
  'Brow Services',
  'Skincare & Facials',
  'Waxing Services',
  'Bridal Services',
  'Special Event Styling',
  'Hair Treatments',
] as const;

export const BUSINESS_TYPES = [
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'home-based', label: 'Home-Based' },
  { value: 'mobile', label: 'Mobile Service' },
  { value: 'studio', label: 'Studio' },
  { value: 'other', label: 'Other' },
] as const;

export const DEPOSIT_TYPES = [
  { value: 'percentage', label: 'Percentage of Service Price' },
  { value: 'fixed', label: 'Fixed Amount' },
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all essential categories
 */
export const getEssentialCategories = () => {
  return SERVICE_CATEGORIES.filter((cat) => cat.isEssential);
};

/**
 * Get all optional categories
 */
export const getOptionalCategories = () => {
  return SERVICE_CATEGORIES.filter((cat) => !cat.isEssential);
};

/**
 * Get category by ID
 */
export const getCategoryById = (categoryId: string) => {
  return SERVICE_CATEGORIES.find((cat) => cat.id === categoryId);
};

/**
 * Get subcategory by ID
 */
export const getSubcategoryById = (categoryId: string, subcategoryId: string) => {
  const category = getCategoryById(categoryId);
  return category?.subcategories?.find((sub) => sub.id === subcategoryId);
};

/**
 * Get service template by ID
 */
export const getServiceTemplate = (
  categoryId: string,
  subcategoryId: string | null,
  templateId: string
) => {
  const category = getCategoryById(categoryId);
  if (!category) return null;

  if (subcategoryId && category.subcategories) {
    const subcategory = category.subcategories.find((sub) => sub.id === subcategoryId);
    return subcategory?.templates.find((t) => t.id === templateId);
  }

  return category.templates?.find((t) => t.id === templateId);
};

/**
 * Get all templates for a category (flattened)
 */
export const getAllTemplatesForCategory = (categoryId: string): ServiceTemplate[] => {
  const category = getCategoryById(categoryId);
  if (!category) return [];

  if (category.subcategories) {
    return category.subcategories.flatMap((sub) => sub.templates);
  }

  return category.templates || [];
};

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type ServiceSpecialization = (typeof SERVICE_SPECIALIZATIONS)[number];
export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]['id'];
export type BusinessType = (typeof BUSINESS_TYPES)[number]['value'];
export type DepositType = (typeof DEPOSIT_TYPES)[number]['value'];
