/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: {
          400: "#F3F4F6", // Much brighter (was #9CA3AF)
          500: "#E5E7EB", // Much brighter (was #6B7280)
          600: "#D1D5DB", // Much brighter (was #4B5563)
          700: "#9CA3AF", // Much brighter (was #374151)
        },
        canteen: {
          primary:   "#E65C00",  // warm orange
          secondary: "#F9A825",  // amber
          dark:      "#0A0E1A",  // deeper navy
          card:      "#111827",  // rich dark card
          accent:    "#0F3460",
          surface:   "#1A1F36",  // elevated surface
          glow:      "#FF6B1A",  // bright orange glow
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in":     "fadeIn 0.5s ease-out",
        "slide-up":    "slideUp 0.4s ease-out",
        "slide-in":    "slideIn 0.3s ease-out",
        "float":       "float 6s ease-in-out infinite",
        "glow":        "glow 2s ease-in-out infinite alternate",
        "shimmer":     "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn:   { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        slideUp:  { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        slideIn:  { "0%": { opacity: 0, transform: "translateX(20px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
        float:    { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        glow:     { "0%": { boxShadow: "0 0 5px rgba(230, 92, 0, 0.2)" }, "100%": { boxShadow: "0 0 20px rgba(230, 92, 0, 0.4), 0 0 40px rgba(230, 92, 0, 0.1)" } },
        shimmer:  { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #0A0E1A 0%, #111827 25%, #0F3460 50%, #111827 75%, #0A0E1A 100%)',
      },
      boxShadow: {
        'glow-sm':   '0 0 10px rgba(230, 92, 0, 0.15)',
        'glow-md':   '0 0 20px rgba(230, 92, 0, 0.2), 0 0 40px rgba(230, 92, 0, 0.1)',
        'glow-lg':   '0 0 30px rgba(230, 92, 0, 0.3), 0 0 60px rgba(230, 92, 0, 0.15)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
};
