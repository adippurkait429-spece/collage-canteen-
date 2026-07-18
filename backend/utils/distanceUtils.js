/**
 * utils/distanceUtils.js
 *
 * Reusable utility for calculating the great-circle distance between two
 * GPS coordinates using the Haversine formula. Also exports the restaurant's
 * fixed location and maximum delivery radius.
 *
 * Used by:
 *  - middleware/validateLocation.js  (server-side order gating)
 *  - routes/orderRoutes.js           (distance stored in order document)
 */

// ── Restaurant Configuration ──────────────────────────────────────────────────
// GKCEM (Greater Kolkata College Of Engineering & Management) canteen location.
// Override via environment variables if the restaurant moves.
const RESTAURANT_LOCATION = {
  lat: parseFloat(process.env.RESTAURANT_LAT) || 22.345662499343057,
  lng: parseFloat(process.env.RESTAURANT_LNG) || 88.463790742079,
};

// Maximum allowed distance for delivery (in kilometres)
const MAX_DELIVERY_RADIUS_KM = parseFloat(process.env.MAX_DELIVERY_RADIUS_KM) || 5;

// ── Haversine Formula ─────────────────────────────────────────────────────────
/**
 * Calculates the great-circle distance between two points on Earth
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lng1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lng2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometres (rounded to 2 decimal places)
 */
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const EARTH_RADIUS_KM = 6371; // Mean radius of Earth in km

  // Convert degrees to radians
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;

  return parseFloat(distance.toFixed(2));
};

// ── Convenience Wrapper ───────────────────────────────────────────────────────
/**
 * Checks whether a user's location falls within the delivery radius
 * of the restaurant.
 *
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @returns {{ distance: number, isWithin: boolean }}
 */
const isWithinDeliveryRadius = (userLat, userLng) => {
  const distance = calculateHaversineDistance(
    RESTAURANT_LOCATION.lat,
    RESTAURANT_LOCATION.lng,
    userLat,
    userLng
  );

  return {
    distance,
    isWithin: distance <= MAX_DELIVERY_RADIUS_KM,
  };
};

module.exports = {
  RESTAURANT_LOCATION,
  MAX_DELIVERY_RADIUS_KM,
  calculateHaversineDistance,
  isWithinDeliveryRadius,
};
