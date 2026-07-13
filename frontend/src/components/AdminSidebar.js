/**
 * components/AdminSidebar.js
 *
 * Slide-in panel for Admins containing both the Login form and the Dashboard.
 * Opens from the home page navbar, allowing staff to manage orders without leaving the home page.
 */

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cls = {
    paid:    "badge-paid",
    pending: "badge-pending",
    failed:  "badge-failed",
    cod:     "badge-cod",
  }[status] || "badge-pending";

  const label = { paid: "✅ Paid", pending: "⏳ Pending", failed: "❌ Failed", cod: "💵 COD" }[status] || status;
  return <span className={cls}>{label}</span>;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = "text-white" }) => (
  <div className="glass border border-white/[0.06] rounded-xl p-3.5 bg-white/[0.01]">
    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    <p className={`font-display text-2xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
  </div>
);

const AdminSidebar = ({ isOpen, onClose }) => {
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  
  // Login Form States
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Dashboard States
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ items: [], stats: null });
  const [dashLoading, setDashLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Reset token on open so password is required every time they open the panel
  useEffect(() => {
    if (isOpen) {
      localStorage.removeItem("adminToken");
      setToken(null);
      setLoginForm({ username: "", password: "" });
    }
  }, [isOpen]);

  // ── Fetch Dashboard Data ───────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [ordersRes, summaryRes] = await Promise.all([
        api.get(`/admin/orders?date=${today}`),
        api.get("/admin/summary"),
      ]);
      setOrders(ordersRes.data.orders);
      setSummary({ items: summaryRes.data.items, stats: summaryRes.data.stats });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        handleLogout();
      } else {
        toast.error("Failed to load admin data.");
      }
    } finally {
      setDashLoading(false);
    }
  }, [token]);

  // Auto-refresh when dashboard is open and active
  useEffect(() => {
    if (isOpen && token) {
      setDashLoading(true);
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30_000);
      return () => clearInterval(interval);
    }
  }, [isOpen, token, fetchDashboardData]);

  // ── Login Handler ──────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast.error("Please fill in both fields.");
      return;
    }

    try {
      const { data } = await api.post("/admin/login", loginForm);
      localStorage.setItem("adminToken", data.token);
      setToken(data.token);
      toast.success("Welcome back! Loading dashboard...");
      setLoginForm({ username: "", password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Logout Handler ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
    toast.success("Logged out successfully");
  };

  // ── Derived Dashboard Data ─────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const matchStatus = filter === "all" || o.paymentStatus === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.student.name.toLowerCase().includes(q) ||
      o.student.rollNumber.toLowerCase().includes(q) ||
      o.student.department.toLowerCase().includes(q) ||
      o.orderRef?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = summary.stats;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[650px] lg:w-[750px] bg-canteen-card/95 backdrop-blur-2xl border-l border-white/[0.06]
          z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-canteen-primary/20 to-blue-500/10 flex items-center justify-center text-xl">
              🔑
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Canteen Portal</h2>
              <p className="text-gray-500 text-xs">
                {token ? "Dashboard Overview" : "Security Verification"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all duration-300"
              >
                Logout
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Close canteen portal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {!token ? (
            // ─── LOGIN VIEW ───
            <div className="flex flex-col justify-center min-h-[70%] max-w-sm mx-auto space-y-6">
              <div className="text-center">
                <img
                  src="/gkcem-logo-new.jpg"
                  alt="GKCEM Canteen"
                  className="w-16 h-16 object-contain rounded-full border-2 border-white/10 mx-auto mb-3"
                />
                <h3 className="text-white font-bold text-lg">Staff Verification Required</h3>
                <p className="text-gray-500 text-xs mt-1">Enter credentials to unlock the dashboard features.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="glass border border-white/[0.06] rounded-2xl p-6 space-y-4" noValidate>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder="Enter username"
                    className="input-field py-2.5 text-sm"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="input-field py-2.5 pr-10 text-sm"
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
                  <p className="text-[9px] text-gray-500 mt-1 leading-snug">
                    Rules: Min. 8 characters, 1 uppercase, 1 lowercase letter, 1 number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
                >
                  {loginLoading ? "Verifying..." : "Access Dashboard →"}
                </button>
              </form>
            </div>
          ) : (
            // ─── DASHBOARD VIEW ───
            <div className="space-y-6">
              {dashLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-3 border-canteen-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-gray-400 text-xs">Loading dashboard data...</p>
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  {stats && (
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard label="Total Orders" value={stats.totalOrders} sub="Today" />
                      <StatCard label="Revenue" value={`₹${(stats.totalRevenue || 0).toFixed(0)}`} sub="Today" color="text-canteen-glow" />
                      <StatCard label="Paid (Online)" value={stats.paidOrders} sub="Orders" color="text-green-400" />
                      <StatCard label="COD" value={stats.codOrders || 0} sub="Orders" color="text-blue-400" />
                      <StatCard label="Pending" value={stats.pendingOrders} sub="Orders" color="text-yellow-400" />
                      <StatCard label="Failed" value={stats.failedOrders} sub="Orders" color="text-red-400" />
                    </div>
                  )}

                  {/* Items Summary Table */}
                  <div className="glass border border-white/[0.06] rounded-2xl p-4 bg-white/[0.01]">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      📊 Today's Item Summary
                    </h3>
                    {summary.items.length === 0 ? (
                      <p className="text-gray-500 text-xs">No items ordered yet today.</p>
                    ) : (
                      <div className="overflow-x-auto max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-400 border-b border-white/10">
                              <th className="pb-2 font-medium">Item</th>
                              <th className="pb-2 font-medium text-center">Qty</th>
                              <th className="pb-2 font-medium text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {summary.items.map((item) => (
                              <tr key={item.itemId || item.name} className="hover:bg-white/[0.01]">
                                <td className="py-2 text-white font-medium">{item.name}</td>
                                <td className="py-2 text-center">
                                  <span className="bg-canteen-primary/20 text-canteen-secondary px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {item.totalQuantity}
                                  </span>
                                </td>
                                <td className="py-2 text-right text-canteen-glow font-semibold">
                                  ₹{item.totalRevenue.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Orders Table */}
                  <div className="glass border border-white/[0.06] rounded-2xl p-4 bg-white/[0.01] space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-sm">📋 All Orders Today ({filteredOrders.length})</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search orders..."
                          className="input-field py-1 px-3 text-xs w-36"
                        />
                        <select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          className="input-field py-1 px-2 text-xs bg-canteen-dark"
                        >
                          <option value="all">All Status</option>
                          <option value="paid">Paid</option>
                          <option value="cod">COD</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                      <p className="text-gray-500 text-xs py-8 text-center">No orders match your filter.</p>
                    ) : (
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-xl border border-white/[0.04]">
                        <table className="w-full text-xs min-w-[500px]">
                          <thead>
                            <tr className="bg-white/5 text-gray-400 text-left">
                              <th className="px-3 py-2 font-medium">Ref</th>
                              <th className="px-3 py-2 font-medium">Student</th>
                              <th className="px-3 py-2 font-medium">Items</th>
                              <th className="px-3 py-2 font-medium text-right">Amount</th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-white/[0.01]">
                                <td className="px-3 py-2.5 font-mono text-[10px] text-canteen-glow">
                                  {order.orderRef || order._id.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-3 py-2.5">
                                  <p className="font-semibold text-white">{order.student.name}</p>
                                  <p className="text-gray-500 text-[10px]">{order.student.rollNumber} • {order.student.department}</p>
                                  <p className="text-gray-500 text-[10px]">📞 {order.student.phone}</p>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="space-y-0.5">
                                    {order.items.map((item, idx) => (
                                      <p key={idx} className="text-gray-300 text-[10px]">
                                        {item.name} <span className="text-gray-500">×{item.quantity}</span>
                                      </p>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-right text-canteen-glow font-semibold">
                                  ₹{order.totalAmount.toFixed(2)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <StatusBadge status={order.paymentStatus} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </aside>
    </>
  );
};

export default AdminSidebar;
