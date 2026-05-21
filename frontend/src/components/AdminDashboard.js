/**
 * components/AdminDashboard.js
 *
 * Secure admin panel showing:
 *  - Overall daily stats (total orders, revenue, paid/pending/failed)
 *  - Item-quantity summary (aggregated from today's orders)
 *  - Full orders table (student details, items, payment status)
 *
 * Requires admin JWT token in localStorage ("adminToken").
 * Auto-refreshes every 30 seconds to get near-real-time data.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  <div className="card p-4">
    <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
    <p className={`font-display text-3xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate  = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [summary, setSummary] = useState({ items: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all"); // "all" | "paid" | "pending" | "failed" | "cod"
  const [search,  setSearch]  = useState("");

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
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
        navigate("/admin/login");
      } else {
        toast.error("Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  // ── Derived data ───────────────────────────────────────────────────────────
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

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-canteen-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-canteen-dark p-4 md:p-8 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            🍽️ <span className="text-canteen-primary">Admin</span> Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Today: {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="btn-secondary text-sm px-4 py-2"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleLogout}
            className="border border-red-500/40 text-red-400 hover:bg-red-500/10 font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <StatCard label="Total Orders"   value={stats.totalOrders}                                           sub="today"              />
          <StatCard label="Revenue"        value={`₹${(stats.totalRevenue || 0).toFixed(2)}`}                 sub="today"              color="text-canteen-secondary" />
          <StatCard label="Paid"           value={stats.paidOrders}                                            sub="orders"             color="text-green-400" />
          <StatCard label="COD"            value={stats.codOrders || 0}                                        sub="orders"             color="text-blue-400" />
          <StatCard label="Pending"        value={stats.pendingOrders}                                         sub="orders"             color="text-yellow-400" />
          <StatCard label="Failed"         value={stats.failedOrders}                                          sub="orders"             color="text-red-400" />
        </div>
      )}

      {/* ── Item Summary Panel ─────────────────────────────────────────────── */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          📊 Today's Item Summary
          <span className="text-xs text-gray-500 font-normal">(all orders)</span>
        </h2>

        {summary.items.length === 0 ? (
          <p className="text-gray-500 text-sm">No items ordered yet today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-center">Qty Ordered</th>
                  <th className="pb-2 font-medium text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary.items.map((item) => (
                  <tr key={item.itemId || item.name} className="hover:bg-white/2">
                    <td className="py-2.5 text-white font-medium">{item.name}</td>
                    <td className="py-2.5 text-center">
                      <span className="bg-canteen-primary/20 text-canteen-primary border border-canteen-primary/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {item.totalQuantity}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-canteen-secondary font-semibold">
                      ₹{item.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Orders Table ───────────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">📋 All Orders Today</h2>

          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no..."
              className="input-field py-2 text-sm w-48"
            />

            {/* Status filter */}
            {["all", "paid", "pending", "failed", "cod"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize
                  ${filter === s
                    ? "bg-canteen-primary text-white"
                    : "bg-canteen-dark text-gray-400 hover:text-white border border-white/10"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-3">📭</span>
            <p>No orders match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-left">
                  <th className="px-4 py-3 rounded-tl-xl font-medium">Order Ref</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 rounded-tr-xl font-medium">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-white/3 transition-colors">
                    {/* Order Ref */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-canteen-secondary">
                        {order.orderRef || order._id.slice(-6).toUpperCase()}
                      </span>
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{order.student.name}</p>
                      <p className="text-gray-400 text-xs">{order.student.rollNumber}</p>
                      <p className="text-gray-500 text-xs truncate max-w-[140px]">{order.student.department}</p>
                      <p className="text-gray-500 text-xs">📞 {order.student.phone}</p>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 max-w-[200px]">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-gray-300 text-xs">
                            {item.name} <span className="text-gray-500">×{item.quantity}</span>
                          </p>
                        ))}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-canteen-secondary">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={order.paymentStatus} />
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <p className="text-gray-300 font-medium">
                        {new Date(order.orderedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-gray-500 mt-0.5">
                        {new Date(order.orderedAt).toLocaleTimeString("en-IN", {
                          hour:   "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-gray-500 text-xs mt-4 text-right">
          Showing {filteredOrders.length} of {orders.length} orders · Auto-refreshes every 30s
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
