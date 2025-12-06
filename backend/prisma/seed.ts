import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ================================
  // Service Categories & Subcategories
  // ================================

  console.log('📂 Creating service categories...');

  const hairCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'hair' },
    update: {},
    create: {
      name: 'Hair',
      slug: 'hair',
      description: 'Hair styling, braiding, cuts, and color',
      iconName: 'scissors',
      displayOrder: 1,
    },
  });

  const makeupCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'makeup' },
    update: {},
    create: {
      name: 'Makeup',
      slug: 'makeup',
      description: 'Makeup artistry for all occasions',
      iconName: 'palette',
      displayOrder: 2,
    },
  });

  const nailsCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'nails' },
    update: {},
    create: {
      name: 'Nails',
      slug: 'nails',
      description: 'Manicures, pedicures, and nail art',
      iconName: 'hand',
      displayOrder: 3,
    },
  });

  const lashesCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'lashes' },
    update: {},
    create: {
      name: 'Lashes',
      slug: 'lashes',
      description: 'Lash extensions, lifts, and tints',
      iconName: 'eye',
      displayOrder: 4,
    },
  });

  const browsCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'brows' },
    update: {},
    create: {
      name: 'Brows',
      slug: 'brows',
      description: 'Brow shaping, tinting, and microblading',
      iconName: 'eyebrow',
      displayOrder: 5,
    },
  });

  console.log('✅ Categories created');

  // Create subcategories for Hair
  const hairSubcategories = [
    { name: 'Braids', slug: 'braids', description: 'Box braids, cornrows, and more' },
    { name: 'Weaves', slug: 'weaves', description: 'Sew-ins, quick weaves, closures' },
    { name: 'Natural Hair', slug: 'natural-hair', description: 'Silk press, wash & go, twists' },
    { name: 'Cuts & Styling', slug: 'cuts-styling', description: 'Haircuts, trims, styling' },
    {
      name: 'Color & Treatment',
      slug: 'color-treatment',
      description: 'Hair color, highlights, treatments',
    },
  ];

  for (const sub of hairSubcategories) {
    await prisma.serviceSubcategory.upsert({
      where: {
        categoryId_slug: {
          categoryId: hairCategory.id,
          slug: sub.slug,
        },
      },
      update: {},
      create: {
        categoryId: hairCategory.id,
        ...sub,
        displayOrder: hairSubcategories.indexOf(sub),
      },
    });
  }

  console.log('✅ Subcategories created');

  // ================================
  // Test Admin User
  // ================================

  console.log('👤 Creating test admin user...');

  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@beautyandbrushes.com' },
    update: {},
    create: {
      email: 'admin@beautyandbrushes.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Admin user created (email: admin@beautyandbrushes.com, password: admin123)');

  // ================================
  // Test Client User
  // ================================

  console.log('👤 Creating test client user...');

  const clientPassword = await bcrypt.hash('client123', 10);

  await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      passwordHash: clientPassword,
      role: 'CLIENT',
      firstName: 'Jane',
      lastName: 'Doe',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Client user created (email: client@example.com, password: client123)');

  // ================================
  // Test Provider User
  // ================================

  console.log('👤 Creating test provider user...');

  const providerPassword = await bcrypt.hash('provider123', 10);

  const providerUser = await prisma.user.upsert({
    where: { email: 'provider@example.com' },
    update: {},
    create: {
      email: 'provider@example.com',
      passwordHash: providerPassword,
      role: 'PROVIDER',
      firstName: 'Sarah',
      lastName: 'Johnson',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  // Create provider profile
  await prisma.providerProfile.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      userId: providerUser.id,
      businessName: "Sarah's Hair Studio",
      slug: 'sarahs-hair-studio',
      tagline: 'Your Hair, Our Passion',
      description:
        'Professional hair care services specializing in natural hair, braids, and protective styles.',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30301',
      country: 'US',
      businessPhone: '404-555-0100',
      instagramHandle: '@sarahshairstudio',
      yearsExperience: 5,
      paymentProvider: 'STRIPE',
      regionCode: 'NA',
      currency: 'USD',
      subscriptionTier: 'SOLO',
      subscriptionStatus: 'TRIAL',
      verificationStatus: 'verified',
      instantBookingEnabled: true,
      acceptsNewClients: true,
      isSalon: false,
      profileCompleted: true,
    },
  });

  console.log('✅ Provider user created (email: provider@example.com, password: provider123)');

  // ================================
  // Platform Configuration
  // ================================

  console.log('⚙️  Creating platform configuration...');

  await prisma.platformConfig.upsert({
    where: { key: 'SERVICE_FEE_BASE' },
    update: {},
    create: {
      key: 'SERVICE_FEE_BASE',
      value: '1.25',
      dataType: 'number',
      category: 'payment',
      description: 'Base service fee in USD',
    },
  });

  await prisma.platformConfig.upsert({
    where: { key: 'SERVICE_FEE_PERCENTAGE' },
    update: {},
    create: {
      key: 'SERVICE_FEE_PERCENTAGE',
      value: '3.6',
      dataType: 'number',
      category: 'payment',
      description: 'Service fee percentage',
    },
  });

  await prisma.platformConfig.upsert({
    where: { key: 'SERVICE_FEE_CAP' },
    update: {},
    create: {
      key: 'SERVICE_FEE_CAP',
      value: '8.00',
      dataType: 'number',
      category: 'payment',
      description: 'Maximum service fee cap in USD',
    },
  });

  console.log('✅ Platform configuration created');


  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('  Admin:    admin@beautyandbrushes.com / admin123');
  console.log('  Client:   client@example.com / client123');
  console.log('  Provider: provider@example.com / provider123');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
