/**
 * utils/locationUtils.js
 *
 * Client-side location utilities for the delivery restriction feature.
 *
 * Exports:
 *  - RESTAURANT_LOCATION  — fixed GPS coordinates of the restaurant
 *  - MAX_DELIVERY_RADIUS_KM — delivery radius in kilometres
 *  - calculateHaversineDistance() — great-circle distance between two points
 *  - getUserLocation() — Promise wrapper around browser Geolocation API
 */

// ── Restaurant Configuration ──────────────────────────────────────────────────
// Must match backend/utils/distanceUtils.js
export const RESTAURANT_LOCATION = {
  lat: 22.345662499343057,
  lng: 88.463790742079,
};

export const MAX_DELIVERY_RADIUS_KM = 5;

// ── Haversine Formula ─────────────────────────────────────────────────────────
/**
 * Calculates the great-circle distance between two GPS points
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lng1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lng2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometres (rounded to 2 decimal places)
 */
export const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const EARTH_RADIUS_KM = 6371;

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

  return parseFloat((EARTH_RADIUS_KM * c).toFixed(2));
};

// ── Error Messages ────────────────────────────────────────────────────────────
const GEOLOCATION_ERRORS = {
  PERMISSION_DENIED:
    "Location access was denied. Please allow location permission in your browser settings to place orders.",
  POSITION_UNAVAILABLE:
    "Unable to determine your location. Please check your device's GPS settings and try again.",
  TIMEOUT:
    "Location request timed out. Please check your internet connection and try again.",
  NOT_SUPPORTED:
    "Your browser does not support geolocation. Please use a modern browser like Chrome or Firefox.",
};

// ── Browser Geolocation Wrapper ───────────────────────────────────────────────
/**
 * Prompts the user for GPS location using the browser Geolocation API.
 * Returns a promise that resolves with { latitude, longitude } or
 * rejects with a user-friendly error message.
 *
 * @param {object} [options] - PositionOptions for getCurrentPosition
 * @returns {Promise<{ latitude: number, longitude: number }>}
 */
export const getUserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported by the browser
    if (!navigator.geolocation) {
      reject(new Error(GEOLOCATION_ERRORS.NOT_SUPPORTED));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // ── Success callback ──────────────────────────────────────────────
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },

      // ── Error callback ────────────────────────────────────────────────
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error(GEOLOCATION_ERRORS.PERMISSION_DENIED));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error(GEOLOCATION_ERRORS.POSITION_UNAVAILABLE));
            break;
          case error.TIMEOUT:
            reject(new Error(GEOLOCATION_ERRORS.TIMEOUT));
            break;
          default:
            reject(new Error("An unknown error occurred while fetching your location."));
        }
      },

      // ── Options ───────────────────────────────────────────────────────
      {
        enableHighAccuracy: true,
        timeout: 10000,       // 10 second timeout
        maximumAge: 300000,   // Cache location for 5 minutes
        ...options,
      }
    );
  });
};
