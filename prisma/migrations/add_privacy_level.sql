-- Add the privacyLevel column to the Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "privacyLevel" TEXT DEFAULT 'PUBLIC';

-- Update existing private events to have the PRIVATE privacy level
UPDATE "Event" SET "privacyLevel" = 'PRIVATE' WHERE "isPrivate" = true;

-- Add the privacyChanged column to track when privacy was last changed
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "privacyChanged" TIMESTAMP; 