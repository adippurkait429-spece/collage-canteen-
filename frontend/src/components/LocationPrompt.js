import React from "react";
import { useLocation } from "../context/LocationContext";

const LocationPrompt = () => {
  const { hasRequested, retryLocation, loading } = useLocation();

  if (hasRequested) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-orange-500/20 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-canteen-primary/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 bg-canteen-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-sm">
            <span className="text-4xl">📍</span>
          </div>

          <h2 className="text-2xl font-bold font-display text-white mb-3">
            Location Required
          </h2>

          <p className="text-gray-300 text-sm mb-8 leading-relaxed">
            To ensure your food is fresh and hot, we only accept orders within a <strong className="text-white">5km radius</strong> of the canteen. Please enable your location to continue.
          </p>

          <button
            onClick={retryLocation}
            disabled={loading}
            className="w-full bg-gradient-to-r from-canteen-primary to-orange-500 hover:from-canteen-primary/90 hover:to-orange-500/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-glow-sm hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting Location...
              </>
            ) : (
              "Turn On Location"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPrompt;
