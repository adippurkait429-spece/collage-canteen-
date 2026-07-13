/**
 * context/LocationContext.js
 *
 * Global location state using React Context.
 * On mount, requests the user's GPS location and calculates distance
 * from the restaurant using the Haversine formula.
 *
 * Provides to all child components:
 *  - latitude / longitude  — user's GPS coordinates (null if unavailable)
 *  - distance              — distance from restaurant in KM (null if unknown)
 *  - isWithinRange         — true if user is within delivery radius
 *  - loading               — true while waiting for GPS
 *  - error                 — error message string (null if no error)
 *  - retryLocation()       — function to re-request GPS permission
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getUserLocation,
  calculateHaversineDistance,
  RESTAURANT_LOCATION,
  MAX_DELIVERY_RADIUS_KM,
} from "../utils/locationUtils";

const LocationContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const LocationProvider = ({ children }) => {
  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    distance: null,
    isWithinRange: false,
    loading: false, // Initially false so prompt can be shown
    error: null,
    hasRequested: false, // Tracks if user has clicked "Turn On Location"
  });

  // ── Fetch user's GPS location ─────────────────────────────────────────────
  const fetchLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, hasRequested: true }));

    try {
      const { latitude, longitude } = await getUserLocation();
      const distance = calculateHaversineDistance(
        latitude,
        longitude,
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng
      );
      const isWithinRange = distance <= MAX_DELIVERY_RADIUS_KM;

      setState({
        latitude,
        longitude,
        distance,
        isWithinRange,
        loading: false,
        error: null,
        hasRequested: true,
      });
    } catch (err) {
      setState({
        latitude: null,
        longitude: null,
        distance: null,
        isWithinRange: false,
        loading: false,
        error: err.message || "Failed to get your location.",
        hasRequested: true,
      });
    }
  }, []);

  // ── Retry function (exposed so UI can offer a "Try Again" button) ─────────
  const retryLocation = useCallback(() => {
    fetchLocation();
  }, [fetchLocation]);

  return (
    <LocationContext.Provider value={{ ...state, retryLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return ctx;
};
