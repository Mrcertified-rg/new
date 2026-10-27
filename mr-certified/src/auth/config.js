/**
 * auth/config.js
 * Central settings and constants for the account system.
 * Change values here instead of hunting through the code.
 */

/** DEMO_MODE = the account system runs fully inside the browser (no server). */
export const DEMO_MODE = true;

/** Buyers stay signed in this long (days) after signing in / registering. */
export const SESSION_DAYS = 30;

/** Seller / Marketer mode locks itself after this many idle minutes. */
export const ROLE_IDLE_MINUTES = 15;

/** Brute-force protection: lock a login after N wrong passwords for N seconds. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 60;

export const ROLE_LABEL = { buyer: 'Buyer', seller: 'Seller', marketer: 'Marketer' };

/** Role application states (same wording as the product spec). */
export const STATUS_LABEL = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

/** Kenya's 47 counties - used for the delivery address dropdown. */
export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay',
  'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii',
  'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', "Murang'a", 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];
