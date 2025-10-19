-- Add template tracking fields to Service table
ALTER TABLE "Service" 
ADD COLUMN "createdFromTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "templateId" TEXT,
ADD COLUMN "templateName" TEXT;

