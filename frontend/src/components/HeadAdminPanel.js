/**
 * components/HeadAdminPanel.js
 *
 * Right-side slide-in panel for the college HOD / Head Admin.
 * Shows all-time analytics:
 *   - Total Orders & Revenue summary cards
 *   - Most Popular Items (bar chart visualization)
 *   - Department-wise order breakdown
 *   - 7-day daily order trend (mini chart)
 *   - Payment method distribution
 */

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";

// ── Animated Number ───────────────────────────────────────────────────────────
const AnimatedValue = ({ value, prefix = "", suffix = "" }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = typeof value === "number" ? value : parseFloat(value) || 0;
    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      setDisplay(current);
      if (step >= steps) {
        setDisplay(target);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {Number.isInteger(value) ? Math.round(display) : display.toFixed(2)}
      {suffix}
    </span>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const HodStatCard = ({ icon, label, value, sub, gradient, delay = 0 }) => (
  <div
    className="relative overflow-hidden rounded-2xl p-4 border border-white/[0.06] animate-fade-in"
    style={{
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      animationDelay: `${delay}ms`,
    }}
  >
    {/* Background pattern */}
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
      style={{ background: gradient[0], filter: "blur(20px)", transform: "translate(30%, -30%)" }}
    />
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="font-display text-2xl sm:text-3xl font-bold text-white">
        <AnimatedValue value={typeof value === "string" ? parseFloat(value) || 0 : value} prefix={label.includes("Revenue") || label.includes("Avg") ? "₹" : ""} />
      </p>
      {sub && <p className="text-[10px] text-white/50 mt-1">{sub}</p>}
    </div>
  </div>
);

// ── Horizontal Bar ────────────────────────────────────────────────────────────
const HorizontalBar = ({ name, value, maxValue, revenue, rank, delay = 0 }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  // Top 3 get special gradient colors
  const barColors = [
    "from-amber-500 via-orange-500 to-red-500",     // #1 — Gold/Fire
    "from-canteen-primary via-orange-400 to-amber-400", // #2 — Orange
    "from-blue-500 via-cyan-400 to-teal-400",        // #3 — Blue
  ];
  const barColor = rank < 3 ? barColors[rank] : "from-gray-600 via-gray-500 to-gray-400";

  return (
    <div className="group animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {rank < 3 && (
            <span className="text-sm">
              {rank === 0 ? "🥇" : rank === 1 ? "🥈" : "🥉"}
            </span>
          )}
          <span className="text-sm text-white font-medium group-hover:text-canteen-secondary transition-colors">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-canteen-secondary font-bold">
            ₹{revenue.toFixed(0)}
          </span>
          <span className="text-xs bg-white/[0.06] text-white/80 px-2 py-0.5 rounded-full font-semibold min-w-[40px] text-center">
            {value}
          </span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out group-hover:shadow-glow-sm`}
          style={{ width: `${percentage}%`, transitionDelay: `${delay + 200}ms` }}
        />
      </div>
    </div>
  );
};

// ── Mini Trend Chart (CSS-based) ──────────────────────────────────────────────
const TrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-xs text-center py-4">No trend data available.</p>;
  }

  const maxOrders = Math.max(...data.map((d) => d.orders), 1);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="space-y-3">
      {data.map((day, i) => {
        const orderPct = (day.orders / maxOrders) * 100;
        const revPct = (day.revenue / maxRevenue) * 100;
        const [yr, mo, dy] = day.date.split("-");
        const dateLabel = new Date(yr, mo - 1, dy).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const isToday = day.date === new Date().toISOString().slice(0, 10);

        return (
          <div key={day.date} className={`group rounded-xl p-3 transition-all duration-300 ${isToday ? "bg-canteen-primary/10 border border-canteen-primary/20" : "hover:bg-white/[0.02]"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${isToday ? "text-canteen-primary" : "text-gray-400"}`}>
                {isToday ? "📍 Today" : dateLabel}
              </span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-gray-400">{day.orders} orders</span>
                <span className="text-canteen-secondary font-bold">₹{day.revenue.toFixed(0)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-10">Orders</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-canteen-primary to-orange-400 transition-all duration-700"
                    style={{ width: `${orderPct}%`, transitionDelay: `${i * 100}ms` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-10">Rev.</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${revPct}%`, transitionDelay: `${i * 100 + 50}ms` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Department Card ───────────────────────────────────────────────────────────
const DepartmentRow = ({ dept, maxOrders, index }) => {
  const pct = maxOrders > 0 ? (dept.orderCount / maxOrders) * 100 : 0;
  const colors = [
    "from-violet-500 to-purple-400",
    "from-blue-500 to-cyan-400",
    "from-emerald-500 to-green-400",
    "from-amber-500 to-yellow-400",
    "from-rose-500 to-pink-400",
    "from-teal-500 to-cyan-400",
  ];

  return (
    <div className="group flex items-center gap-3 py-2.5 animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {dept.department?.charAt(0) || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white font-medium truncate">{dept.department || "Unknown"}</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-400">{dept.orderCount} orders</span>
            <span className="text-canteen-secondary font-semibold">₹{dept.totalSpent.toFixed(0)}</span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-700`}
            style={{ width: `${pct}%`, transitionDelay: `${index * 100}ms` }}
          />
        </div>
      </div>
    </div>
  );
};

// ── Payment Distribution ──────────────────────────────────────────────────────
const PaymentDist = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const config = {
    paid: { color: "bg-emerald-500", label: "✅ Paid", textColor: "text-emerald-400" },
    cod: { color: "bg-sky-500", label: "💵 COD", textColor: "text-sky-400" },
    pending: { color: "bg-amber-500", label: "⏳ Pending", textColor: "text-amber-400" },
    failed: { color: "bg-red-500", label: "❌ Failed", textColor: "text-red-400" },
  };

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-4 rounded-full bg-white/[0.04] overflow-hidden flex">
        {data.map((d) => {
          const pct = (d.count / total) * 100;
          const cfg = config[d.status] || { color: "bg-gray-500" };
          return (
            <div
              key={d.status}
              className={`h-full ${cfg.color} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${pct}%` }}
              title={`${d.status}: ${d.count} orders`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((d) => {
          const cfg = config[d.status] || { color: "bg-gray-500", label: d.status, textColor: "text-gray-400" };
          return (
            <div key={d.status} className="flex items-center gap-2 text-xs">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
              <span className="text-gray-400">{cfg.label}</span>
              <span className={`${cfg.textColor} font-bold ml-auto`}>{d.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const HeadAdminPanel = ({ isOpen, onClose }) => {
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Login states
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: res } = await api.get("/admin/hod-analytics");
      setData(res);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setToken(null);
      } else {
        const msg = err.response?.data?.message || "Failed to load analytics.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync token when panel opens
  useEffect(() => {
    if (isOpen) {
      const currentToken = localStorage.getItem("adminToken");
      setToken(currentToken);
      if (currentToken) {
        fetchAnalytics();
      }
    }
  }, [isOpen, fetchAnalytics]);
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast.error("Please fill in both fields.");
      return;
    }

    setLoginLoading(true);
    try {
      const { data } = await api.post("/admin/login", loginForm);
      // Temporarily store token so standard request interceptor picks it up
      localStorage.setItem("adminToken", data.token);
      
      // Try to fetch HOD analytics first to confirm role and permissions
      const { data: res } = await api.get("/admin/hod-analytics");
      setData(res);
      
      // Set the states only when fetching analytics succeeds
      setToken(data.token);
      toast.success("Welcome back! Loading analytics...");
      setLoginForm({ username: "", password: "" });
    } catch (err) {
      // Clear token and clean up states if login or HOD access verification fails
      localStorage.removeItem("adminToken");
      setToken(null);
      setData(null);
      const msg = err.response?.data?.message || "Login failed. Check credentials.";
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
    toast.success("Logged out successfully");
  };

  const maxItemQty = data?.topItems?.[0]?.totalQuantity || 1;
  const maxDeptOrders = data?.departmentStats?.[0]?.orderCount || 1;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[580px] lg:w-[640px]
          bg-canteen-dark/95 backdrop-blur-2xl border-l border-white/[0.06]
          z-[70] flex flex-col transition-transform duration-400 ease-out shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-500/20 border border-violet-500/20 flex items-center justify-center text-xl shadow-lg">
              🎓
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Head Admin <span className="text-gradient">Analytics</span>
              </h2>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">
                HOD Overview • All-Time Data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all duration-300 mr-1"
              >
                Logout
              </button>
            )}
            {token && (
              <button
                onClick={fetchAnalytics}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Refresh"
              >
                🔄
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
          {!token ? (
            // ─── LOGIN VIEW ───
            <div className="flex flex-col justify-center min-h-[70%] max-w-sm mx-auto space-y-6">
              <div className="text-center">
                <img
                  src="/gkcem-logo-new.jpg"
                  alt="GKCEM Canteen"
                  className="w-16 h-16 object-contain rounded-full border-2 border-white/10 mx-auto mb-3"
                />
                <h3 className="text-white font-bold text-lg">Head Admin Verification</h3>
                <p className="text-gray-500 text-xs mt-1">Enter credentials to unlock Head Admin Analytics.</p>
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
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white transition-all shadow-lg hover:shadow-violet-600/20"
                >
                  {loginLoading ? "Verifying..." : "Access Analytics →"}
                </button>
              </form>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl mb-3">⚠️</span>
              <p className="text-red-400 text-sm font-semibold">{error}</p>
              <button onClick={fetchAnalytics} className="btn-secondary text-xs mt-4 px-4 py-2">
                Try Again
              </button>
            </div>
          ) : data ? (
            <>
              {/* ── Summary Cards ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <HodStatCard
                  icon="📦"
                  label="Total Orders"
                  value={data.totals.totalOrders}
                  sub="All time"
                  gradient={["rgba(139,92,246,0.15)", "rgba(109,40,217,0.08)"]}
                  delay={0}
                />
                <HodStatCard
                  icon="💰"
                  label="Total Revenue"
                  value={data.totals.totalRevenue}
                  sub="All time"
                  gradient={["rgba(16,185,129,0.15)", "rgba(5,150,105,0.08)"]}
                  delay={100}
                />
                <HodStatCard
                  icon="📊"
                  label="Avg Order Value"
                  value={data.totals.avgOrderValue}
                  sub="Per order"
                  gradient={["rgba(230,92,0,0.15)", "rgba(249,115,22,0.08)"]}
                  delay={200}
                />
                <HodStatCard
                  icon="✅"
                  label="Success Rate"
                  value={
                    data.totals.totalOrders > 0
                      ? (((data.totals.paidOrders + data.totals.codOrders) / data.totals.totalOrders) * 100).toFixed(1)
                      : 0
                  }
                  sub="Paid + COD orders"
                  gradient={["rgba(59,130,246,0.15)", "rgba(37,99,235,0.08)"]}
                  delay={300}
                />
              </div>

              {/* ── Most Popular Items ─────────────────────────────────────── */}
              <div className="glass border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <h3 className="font-semibold text-sm text-white">Most Bought Items</h3>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">All Time</span>
                </div>

                {data.topItems.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-6">No item data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {data.topItems.map((item, i) => (
                      <HorizontalBar
                        key={item.name}
                        name={item.name}
                        value={item.totalQuantity}
                        maxValue={maxItemQty}
                        revenue={item.totalRevenue}
                        rank={i}
                        delay={i * 60}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── 7-Day Trend ────────────────────────────────────────────── */}
              <div className="glass border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <h3 className="font-semibold text-sm text-white">7-Day Trend</h3>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-canteen-primary" />
                      <span className="text-gray-500">Orders</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-500">Revenue</span>
                    </div>
                  </div>
                </div>
                <TrendChart data={data.dailyTrend} />
              </div>

              {/* ── Department Breakdown ───────────────────────────────────── */}
              <div className="glass border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏫</span>
                  <h3 className="font-semibold text-sm text-white">Department Breakdown</h3>
                </div>

                {data.departmentStats.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No department data yet.</p>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {data.departmentStats.map((dept, i) => (
                      <DepartmentRow
                        key={dept.department}
                        dept={dept}
                        maxOrders={maxDeptOrders}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Payment Distribution ───────────────────────────────────── */}
              <div className="glass border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💳</span>
                  <h3 className="font-semibold text-sm text-white">Payment Distribution</h3>
                </div>
                {data.paymentDistribution.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No payment data yet.</p>
                ) : (
                  <PaymentDist data={data.paymentDistribution} />
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] p-4 flex items-center justify-between">
          <p className="text-[10px] text-gray-600">
            GKCEM Canteen Analytics • HOD Access
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-500">Live Data</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default HeadAdminPanel;
