/**
 * components/CheckoutForm.js
 *
 * Collects student details (Name, Roll No, Department, Phone),
 * shows an order summary, and submits to POST /api/orders.
 * On success, redirects to PhonePe (or simulates payment in dev mode).
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import api from "../utils/api";

// ── Department options ────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Mathematics & Computing",
  "Physics",
  "Other",
];

// ── Validation helper ─────────────────────────────────────────────────────────
const validate = (fields) => {
  const errors = {};
  if (!fields.name.trim() || fields.name.trim().length < 2)
    errors.name = "Please enter your full name (min 2 characters)";
  if (!fields.rollNumber.trim())
    errors.rollNumber = "Roll number is required";
  if (!fields.department)
    errors.department = "Select your department";
  if (!/^[6-9]\d{9}$/.test(fields.phone))
    errors.phone = "Enter a valid 10-digit Indian mobile number";
  return errors;
};

// ── Component ─────────────────────────────────────────────────────────────────
const CheckoutForm = ({ isOrderOpen }) => {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:        "",
    rollNumber:  "",
    department:  "",
    phone:       "",
  });
  const [errors,        setErrors]        = useState({});
  const [loading,       setLoading]       = useState(false);
  const [devSimMode,    setDevSimMode]    = useState(process.env.NODE_ENV === "development"); // toggle for sandbox simulation
  const [paymentMethod, setPaymentMethod] = useState("phonepe"); // "phonepe" or "cod"

  // ── Redirect to menu if cart is empty ──────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-in">
        <span className="text-6xl">🛒</span>
        <h2 className="font-display text-2xl font-bold">Your cart is empty</h2>
        <p className="text-gray-400">Add some items before checking out.</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-2">
          ← Back to Menu
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side deadline check (server also enforces this)
    if (!isOrderOpen) {
      toast.error("Orders are closed for today (after 11:00 AM).");
      return;
    }

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      // Submit order to backend
      const { data } = await api.post("/orders", {
        student: {
          name:       form.name.trim(),
          rollNumber: form.rollNumber.trim().toUpperCase(),
          department: form.department,
          phone:      form.phone,
        },
        items: cart.map(({ itemId, name, price, quantity }) => ({
          itemId, name, price, quantity,
        })),
        paymentMethod,
      });

      clearCart();

      // ── Cash on Delivery ─────────────────────────────────────────────────
      if (paymentMethod === "cod") {
        toast.success("✅ Order placed! Pay at the counter when you pick up.");
        navigate(`/payment-success?orderId=${data.orderId}&method=cod`);
        return;
      }

      if (devSimMode) {
        // ── Development: simulate payment immediately ──────────────────────
        toast.loading("Simulating payment...", { id: "sim" });
        const simRes = await api.patch(`/orders/${data.orderId}/simulate-payment`);
        toast.dismiss("sim");

        if (simRes.data.success) {
          toast.success("✅ Payment simulated successfully!");
          navigate(`/payment-success?orderId=${data.orderId}&simulated=true`);
        }
      } else {
        // ── Production: redirect to PhonePe checkout ──────────────────────
        toast.success("Order placed! Redirecting to payment...");
        // Small delay so toast is visible
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate("/")}
        className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition-colors"
      >
        ← Back to Menu
      </button>

      <h1 className="font-display text-3xl font-bold mb-8">
        <span className="text-canteen-primary">Checkout</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Student Details Form ────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5" noValidate>
          <div className="card p-6 space-y-5">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              🎓 Student Details
            </h2>

            {/* Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5" htmlFor="name">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Priya Sharma"
                className={`input-field ${errors.name ? "border-red-500" : ""}`}
                autoComplete="name"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5" htmlFor="rollNumber">
                Roll Number <span className="text-red-400">*</span>
              </label>
              <input
                id="rollNumber"
                name="rollNumber"
                type="text"
                value={form.rollNumber}
                onChange={handleChange}
                placeholder="e.g. CS21B001"
                className={`input-field uppercase ${errors.rollNumber ? "border-red-500" : ""}`}
              />
              {errors.rollNumber && <p className="text-red-400 text-xs mt-1">{errors.rollNumber}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5" htmlFor="department">
                Department <span className="text-red-400">*</span>
              </label>
              <select
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                className={`input-field appearance-none ${errors.department ? "border-red-500" : ""}`}
              >
                <option value="" disabled>Select your department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-canteen-dark">{d}</option>
                ))}
              </select>
              {errors.department && <p className="text-red-400 text-xs mt-1">{errors.department}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5" htmlFor="phone">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <span className="input-field w-16 text-center text-white/40 cursor-default flex-shrink-0">+91</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`input-field flex-1 ${errors.phone ? "border-red-500" : ""}`}
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* ── Payment Method Selector ───────────────────────────────────── */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              💳 Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PhonePe Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("phonepe")}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${paymentMethod === "phonepe"
                    ? "border-canteen-primary bg-canteen-primary/10"
                    : "border-white/10 bg-canteen-dark hover:border-white/25"
                  }`}
              >
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-semibold text-white text-sm">PhonePe (UPI)</p>
                  <p className="text-xs text-gray-400">Pay online via UPI / Card</p>
                </div>
                {paymentMethod === "phonepe" && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-canteen-primary rounded-full flex items-center justify-center text-white text-xs">✓</span>
                )}
              </button>

              {/* Cash on Delivery Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${paymentMethod === "cod"
                    ? "border-green-500 bg-green-500/10"
                    : "border-white/10 bg-canteen-dark hover:border-white/25"
                  }`}
              >
                <span className="text-2xl">💵</span>
                <div>
                  <p className="font-semibold text-white text-sm">Cash on Delivery</p>
                  <p className="text-xs text-gray-400">Pay at the counter</p>
                </div>
                {paymentMethod === "cod" && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                )}
              </button>
            </div>
          </div>

          {/* Dev mode toggle (only for PhonePe) */}
          {process.env.NODE_ENV === "development" && paymentMethod === "phonepe" && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
              <input
                type="checkbox"
                id="devSim"
                checked={devSimMode}
                onChange={(e) => setDevSimMode(e.target.checked)}
                className="accent-canteen-primary w-4 h-4"
              />
              <label htmlFor="devSim" className="text-yellow-400 text-sm cursor-pointer">
                🧪 <strong>Dev mode:</strong> Simulate payment (skip PhonePe redirect)
              </label>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isOrderOpen}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : !isOrderOpen ? (
              "🚫 Orders Closed for Today"
            ) : paymentMethod === "cod" ? (
              `Place Order — ₹${total.toFixed(2)} (Cash on Delivery) →`
            ) : (
              `Pay ₹${total.toFixed(2)} via PhonePe →`
            )}
          </button>
        </form>

        {/* ── Order Summary ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-4">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              🧾 Order Summary
            </h2>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.itemId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>{item.emoji}</span>
                    <span className="text-gray-300 truncate max-w-[130px]">{item.name}</span>
                    <span className="text-gray-500">×{item.quantity}</span>
                  </div>
                  <span className="text-canteen-secondary font-semibold whitespace-nowrap">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-canteen-secondary">
                ₹{total.toFixed(2)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              {paymentMethod === "cod" ? (
                <>
                  <span className="text-lg">💵</span>
                  <span>Cash on Delivery — Pay at counter</span>
                </>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/PhonePe_Logo.svg/200px-PhonePe_Logo.svg.png"
                    alt="PhonePe"
                    className="h-4 object-contain opacity-70"
                  />
                  <span>Secured by PhonePe</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
