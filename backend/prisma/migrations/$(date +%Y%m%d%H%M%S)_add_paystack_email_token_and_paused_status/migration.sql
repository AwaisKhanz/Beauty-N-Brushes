-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "ProviderProfile" ADD COLUMN "paystackEmailToken" TEXT;
