-- Add storageKey column to EventPhoto table if it doesn't exist
ALTER TABLE "EventPhoto" ADD COLUMN IF NOT EXISTS "storageKey" TEXT; 