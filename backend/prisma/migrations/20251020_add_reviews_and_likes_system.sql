-- Add likeCount to ProviderProfile
ALTER TABLE "ProviderProfile" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;

-- Rename favoriteCount to likeCount in Service
ALTER TABLE "Service" RENAME COLUMN "favoriteCount" TO "likeCount";

-- Create ReviewMedia table
CREATE TABLE "ReviewMedia" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ReviewMedia_pkey" PRIMARY KEY ("id")
);

-- Create ReviewHelpful table
CREATE TABLE "ReviewHelpful" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReviewHelpful_reviewId_userId_unique" UNIQUE ("reviewId", "userId")
);

-- Create ProviderLike table
CREATE TABLE "ProviderLike" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ProviderLike_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProviderLike_providerId_userId_unique" UNIQUE ("providerId", "userId")
);

-- Create ServiceLike table
CREATE TABLE "ServiceLike" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ServiceLike_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceLike_serviceId_userId_unique" UNIQUE ("serviceId", "userId")
);

-- Add foreign keys
ALTER TABLE "ReviewMedia" ADD CONSTRAINT "ReviewMedia_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderLike" ADD CONSTRAINT "ProviderLike_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceLike" ADD CONSTRAINT "ServiceLike_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "ReviewMedia_reviewId_idx" ON "ReviewMedia"("reviewId");
CREATE INDEX "ReviewHelpful_reviewId_idx" ON "ReviewHelpful"("reviewId");
CREATE INDEX "ReviewHelpful_userId_idx" ON "ReviewHelpful"("userId");
CREATE INDEX "ProviderLike_providerId_idx" ON "ProviderLike"("providerId");
CREATE INDEX "ProviderLike_userId_idx" ON "ProviderLike"("userId");
CREATE INDEX "ServiceLike_serviceId_idx" ON "ServiceLike"("serviceId");
CREATE INDEX "ServiceLike_userId_idx" ON "ServiceLike"("userId");

