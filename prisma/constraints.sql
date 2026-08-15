-- ============================================================
-- Hand-written constraints (PRD §5.3, decision D5).
-- Applied via: npx prisma migrate dev --create-only --name booking_constraints
-- then paste this file's contents into the generated migration.sql.
-- Prisma cannot express these; NEVER let a schema change drop them.
-- ============================================================

-- Required for equality + range in one exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Double-booking prevention: two bookings for the same property whose
-- [checkIn, checkOut) date ranges overlap cannot BOTH be pending/confirmed.
-- Concurrent transactions serialize here — exactly one commits.
ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "propertyId" WITH =,
    daterange("checkIn"::date, "checkOut"::date) WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

-- Sanity checks the app also enforces, kept at the DB as last line of defense
ALTER TABLE "Booking"
  ADD CONSTRAINT booking_dates_valid CHECK ("checkOut" > "checkIn");

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_guest_count_positive CHECK ("guestCount" >= 1);

ALTER TABLE "Review"
  ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE "AvailabilityBlock"
  ADD CONSTRAINT block_dates_valid CHECK ("endDate" > "startDate");
