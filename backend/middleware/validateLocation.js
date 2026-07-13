/**
 * middleware/validateLocation.js
 *
 * Express middleware that enforces the delivery radius restriction
 * on the server side. This is the SECURITY layer — the frontend also
 * checks distance, but this middleware prevents API tampering via
 * Postman, cURL, or browser DevTools.
 *
 * Flow:
 *  1. Extract latitude & longitude from req.body
 *  2. Validate they are valid GPS coordinates
 *  3. Calculate distance from restaurant using Haversine formula
 *  4. If distance > MAX_DELIVERY_RADIUS_KM → reject with 403
 *  5. If within range → attach location data to req and call next()
 */

const {
  isWithinDeliveryRadius,
  MAX_DELIVERY_RADIUS_KM,
} = require("../utils/distanceUtils");

const validateLocation = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(403).json({
      success: false,
      message: "Location coordinates are required.",
    });
  }

  const { distance, isWithin } = isWithinDeliveryRadius(latitude, longitude);

  if (!isWithin) {
    return res.status(403).json({
      success: false,
      message: `Delivery is not available outside ${MAX_DELIVERY_RADIUS_KM} KM radius.`,
    });
  }

  req.userLocation = {
    latitude,
    longitude,
    distanceFromRestaurant: distance,
  };

  next();
};

module.exports = { validateLocation };
