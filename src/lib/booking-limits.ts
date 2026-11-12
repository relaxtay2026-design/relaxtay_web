/**
 * Booking guard rails — the ONE place these numbers live. Imported by the
 * server (createBooking, the booking page, the expiry sweep) and by the
 * client calendar, so the UI and the server always agree.
 */

/** Longest stay a single request may cover. */
export const MAX_NIGHTS = 30;

/** How far ahead a stay may end, in days from today (also the calendar horizon). */
export const MAX_ADVANCE_DAYS = 550;

/** Open (pending) requests one email address may hold at a time. */
export const MAX_PENDING_PER_EMAIL = 3;

/** A pending request nobody has answered is declined after this long. */
export const PENDING_EXPIRY_HOURS = 72;

/** Booking requests one IP address may submit per hour. */
export const BOOKINGS_PER_IP_PER_HOUR = 5;
