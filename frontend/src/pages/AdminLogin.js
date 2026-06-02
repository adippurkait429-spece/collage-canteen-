/**
 * pages/AdminLogin.js
 * Login form for canteen admin staff.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please fill in both fields.");
      return;
    }

    try {
      const { data } = await api.post("/admin/login", form);
      localStorage.setItem("adminToken", data.token);
      toast.success("Welcome back! Loading dashboard...");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canteen-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src="/gkcem-logo-new.jpg"
            alt=""
            className="w-[400px] h-[400px] object-contain"
            style={{ opacity: 0.03 }}
          />
        </div>
        <div className="absolute top-20 -right-32 w-96 h-96 rounded-full bg-canteen-primary/[0.04] blur-3xl" />
        <div className="absolute -bottom-20 -left-32 w-80 h-80 rounded-full bg-canteen-accent/[0.06] blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-canteen-primary to-orange-500 rounded-2xl blur-xl opacity-20" />
            <img
              src="/gkcem-logo-new.jpg"
              alt="GKCEM Canteen"
              className="relative w-20 h-20 object-contain rounded-full border-2 border-white/20 mx-auto"
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            GKCEM <span className="text-gradient">Canteen Admin</span>
          </h1>
          <p className="text-gray-200 text-sm mt-1">Greater Kolkata College Of Engineering & Management</p>
          <p className="text-gray-400 text-xs mt-0.5">Staff access only</p>
        </div>

        <form onSubmit={handleSubmit} className="glass border border-white/[0.08] rounded-2xl p-7 space-y-5" noValidate>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="admin_username"
              className="input-field"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-field pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
              Rules: Min. 8 characters, must contain 1 uppercase letter, 1 lowercase letter, and 1 number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Logging in...
              </>
            ) : "Login to Dashboard →"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors text-center"
          >
            ← Back to Canteen Menu
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
