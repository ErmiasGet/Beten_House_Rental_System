-- Remove endDate from RentalContract
ALTER TABLE "RentalContract" DROP COLUMN "endDate";
DROP INDEX IF EXISTS "RentalContract_startDate_endDate_idx";
