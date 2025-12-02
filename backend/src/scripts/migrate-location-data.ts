/**
 * Migration Script: Move ProviderProfile addresses to ProviderLocation
 * 
 * This script migrates existing address data from ProviderProfile table
 * to the ProviderLocation table to establish a single source of truth.
 * 
 * Run this BEFORE deploying the updated code.
 */

import { prisma } from '../config/database';

async function migrateLocationData() {
  console.log('Starting location data migration...');

  try {
    // Find all provider profiles with address data
    const profiles = await prisma.providerProfile.findMany({
      where: {
        addressLine1: { not: null },
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        latitude: true,
        longitude: true,
        businessPhone: true,
      },
    });

    console.log(`Found ${profiles.length} profiles with address data`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Check if location already exists
        const existingLocation = await prisma.providerLocation.findFirst({
          where: { providerId: profile.id },
        });

        if (existingLocation) {
          console.log(`Skipping profile ${profile.id} - location already exists`);
          skipped++;
          continue;
        }

        // Create ProviderLocation record
        await prisma.providerLocation.create({
          data: {
            providerId: profile.id,
            name: 'Primary Location',
            addressLine1: profile.addressLine1!,
            addressLine2: profile.addressLine2,
            city: profile.city,
            state: profile.state,
            zipCode: profile.zipCode,
            country: profile.country || 'US',
            latitude: profile.latitude,
            longitude: profile.longitude,
            phone: profile.businessPhone,
            isPrimary: true,
            isActive: true,
          },
        });

        migrated++;
        console.log(`✓ Migrated location for profile ${profile.id} (${profile.businessName})`);
      } catch (error) {
        errors++;
        console.error(`✗ Error migrating profile ${profile.id}:`, error);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total profiles: ${profiles.length}`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('========================\n');

    if (errors > 0) {
      throw new Error(`Migration completed with ${errors} errors`);
    }

    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateLocationData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
