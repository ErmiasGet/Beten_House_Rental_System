-- AlterTable: Add emergency contact sub-fields
ALTER TABLE "Tenant" ADD COLUMN "emergencyName" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "emergencyPhone" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "emergencyAddress" TEXT;

-- Migrate existing emergencyContact data to emergencyName
UPDATE "Tenant" SET "emergencyName" = "emergencyContact" WHERE "emergencyContact" IS NOT NULL;

-- Drop old column
ALTER TABLE "Tenant" DROP COLUMN "emergencyContact";
