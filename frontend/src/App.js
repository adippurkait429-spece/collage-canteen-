/**
 * src/App.js
 *
 * Root component. Sets up:
 *  - React Router v6 routes
 *  - CartProvider context
 *  - Toast notifications
 *  - The main layout (Navbar + page content)
 */

import React, { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider, useCart } from "./context/CartContext";

// Page & Component imports
import Timer from "./components/Timer";
import Menu from "./components/Menu";
import CartSidebar from "./components/CartSidebar";
import CheckoutForm from "./components/CheckoutForm";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import PaymentSuccess from "./pages/PaymentSuccess";

// ── Protected Route wrapper (admin only) ─────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/admin/login" replace />;
};

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = ({ onCartOpen, isOrderOpen }) => {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-30 glass border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-all duration-300 group"
        >
          <img
            src="/gkcem-logo-new.jpg"
            alt="GKCEM Canteen"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full ring-2 ring-canteen-primary/30 group-hover:ring-canteen-primary/60 transition-all duration-300"
          />
          <div className="leading-tight">
            <p className="font-display text-base sm:text-lg font-bold text-white">
              GKCEM <span className="text-gradient">Canteen</span>
            </p>
            <p className="hidden sm:block text-[10px] text-gray-200 -mt-0.5 tracking-wide">
              Greater Kolkata College Of Engineering & Management
            </p>
          </div>
        </button>

        {/* Cart button */}
        <button
          onClick={onCartOpen}
          className="relative flex items-center gap-2.5 glass border border-white/[0.08] hover:border-canteen-primary/40 rounded-xl px-4 py-2.5 transition-all duration-300 group hover:shadow-glow-sm"
          aria-label="Open cart"
        >
          <span className="text-xl group-hover:scale-110 transition-transform duration-300">🛒</span>
          {itemCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
              <span className="text-canteen-secondary font-bold text-sm">₹{total.toFixed(2)}</span>
            </div>
          )}
          {itemCount === 0 && (
            <span className="text-gray-400 text-sm">Cart</span>
          )}
          {/* Badge */}
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-canteen-primary to-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-glow-sm">
              {itemCount > 9 ? "9+" : itemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

// ── Footer ────────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="border-t border-white/[0.06] glass mt-auto">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
        {/* College Info */}
        <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 flex-1">
          <img
            src="/gkcem-logo-new.jpg"
            alt="GKCEM"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full ring-1 ring-white/10 flex-shrink-0"
          />
          <div className="text-left">
            <p className="font-display text-xs sm:text-sm font-semibold text-white">
              Greater Kolkata College Of Engineering & Management
            </p>
            <p className="text-[10px] sm:text-xs text-gray-300 mt-0.5">
              Campus Canteen Pre-Order System
            </p>
          </div>
        </div>

        {/* Middle Logo */}
        <div className="flex items-center justify-center flex-shrink-0 my-2 md:my-0">
          <img
            src="/jis-logo.png"
            alt="JIS University"
            className="h-16 md:h-20 object-contain rounded-lg"
          />
        </div>

        {/* Helpline */}
        <div className="flex items-center justify-center md:justify-end flex-1">
          <div className="flex items-center gap-3 glass border border-white/[0.08] rounded-xl px-5 py-3 hover:border-canteen-primary/30 transition-all duration-300">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-canteen-primary/20 to-orange-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📞</span>
            </div>
            <div className="leading-tight text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Canteen Helpline</p>
              <a
                href="tel:9800233225"
                className="text-canteen-primary font-bold text-sm hover:text-orange-400 transition-colors"
              >
                9800233225
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="border-t border-white/[0.04] mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} GKCEM Canteen. All rights reserved.
        </p>
        <p className="text-[10px] text-gray-700">
          Designed for GKCEM Students & Faculty
        </p>
      </div>
    </div>
  </footer>
);

// ── Home / Menu page ──────────────────────────────────────────────────────────
const HomePage = ({ isOrderOpen, onOrderStatusChange }) => {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onCartOpen={() => setCartOpen(true)} isOrderOpen={isOrderOpen} />

      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {/* Large logo watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <img
              src="/gkcem-logo-new.jpg"
              alt=""
              className="w-[300px] h-[300px] md:w-[600px] md:h-[600px] object-contain animate-float"
              style={{ opacity: 0.035 }}
            />
          </div>
          {/* Gradient orbs */}
          <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-canteen-primary/[0.04] blur-3xl" />
          <div className="absolute -bottom-20 -left-32 w-80 h-80 rounded-full bg-canteen-accent/[0.06] blur-3xl" />
        </div>

        <main className="max-w-6xl mx-auto px-4 py-10 flex-1 relative" style={{ zIndex: 1 }}>
          {/* Hero header */}
          <div className="mb-8 md:mb-10">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-6 mb-6">
              {/* College Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-canteen-primary to-orange-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <img
                  src="/gkcem-logo-new.jpg"
                  alt="GKCEM Canteen Logo"
                  className="relative w-24 h-24 md:w-28 md:h-28 object-contain rounded-full p-1 border-2 border-white/20"
                />
              </div>

              <div className="space-y-3 md:space-y-2 flex flex-col items-center md:items-start">
                <div className="inline-flex items-center gap-2 bg-canteen-primary/10 border border-canteen-primary/20 rounded-full px-3 py-1">
                  <span className="w-2 h-2 bg-canteen-primary rounded-full animate-pulse" />
                  <span className="text-canteen-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                    Now Accepting Orders
                  </span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold leading-[1.1] text-white">
                  Good Morning,{" "}
                  <span className="text-gradient">Hungry?</span>
                </h1>

                <p className="text-gray-100 font-medium text-base sm:text-lg max-w-lg">
                  Pre-order your meal! Open daily from 8:00 AM to 11:00 AM — pick up at the counter 🎓
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
                  <div className="hidden sm:block w-4 h-[2px] bg-gradient-to-r from-canteen-primary to-transparent rounded-full" />
                  <p className="text-gray-200 text-sm font-semibold">
                    Greater Kolkata College Of Engineering & Management
                  </p>
                </div>
              </div>
            </div>

            {/* Deadline timer */}
            <div className="max-w-md">
              <Timer onStatusChange={onOrderStatusChange} />
            </div>
          </div>

          {/* Menu */}
          <Menu isOrderOpen={isOrderOpen} />
        </main>
      </div>

      <Footer />

      {/* Cart sidebar */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        isOrderOpen={isOrderOpen}
      />
    </div>
  );
};

// ── Checkout page wrapper ─────────────────────────────────────────────────────
const CheckoutPage = ({ isOrderOpen }) => {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onCartOpen={() => setCartOpen(true)} isOrderOpen={isOrderOpen} />
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1">
        <CheckoutForm isOrderOpen={isOrderOpen} />
      </main>
      <Footer />
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        isOrderOpen={isOrderOpen}
      />
    </div>
  );
};

// ── Root App ──────────────────────────────────────────────────────────────────
const AppInner = () => {
  // isOrderOpen is set by the Timer component and passed down
  // so every page reacts to the deadline crossing without re-mounting
  const [isOrderOpen, setIsOrderOpen] = useState(true);
  const handleOrderStatus = useCallback((open) => setIsOrderOpen(open), []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(12px)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
          success: { iconTheme: { primary: "#E65C00", secondary: "#fff" } },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage isOrderOpen={isOrderOpen} onOrderStatusChange={handleOrderStatus} />} />
        <Route path="/checkout" element={<CheckoutPage isOrderOpen={isOrderOpen} />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <CartProvider>
      <AppInner />
    </CartProvider>
  </BrowserRouter>
);

export default App;
