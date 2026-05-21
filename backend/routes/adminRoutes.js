/**
 * routes/adminRoutes.js
 *
 * Admin-only routes (all protected by JWT middleware except /login):
 *   POST /api/admin/login       → Authenticate admin, return JWT
 *   GET  /api/admin/orders      → All orders (with optional date filter)
 *   GET  /api/admin/summary     → Today's item-quantity summary
 */

const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const Order    = require("../models/Order");
const { adminAuth } = require("../middleware/adminAuth");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/login
// Validates hardcoded admin credentials from .env and returns a signed JWT.
// In a real system, admin accounts would be stored in DB with hashed passwords.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Provide username and password." });
  }

  // Compare against env credentials (use bcrypt in production with DB-stored users)
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const token = jwt.sign(
    { username, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" } // token valid for one working shift
  );

  res.json({
    success: true,
    message: "Login successful.",
    token,
    expiresIn: "8h",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/orders
// Returns all orders, newest first. Optionally filter by date (YYYY-MM-DD)
// via query param: /api/admin/orders?date=2024-06-10
// ─────────────────────────────────────────────────────────────────────────────
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const { date, status } = req.query;

    // Build query filter
    const filter = {};

    if (date) {
      // Filter to a specific calendar day
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.orderedAt = { $gte: start, $lte: end };
    }

    if (status && ["pending", "paid", "failed", "cod"].includes(status)) {
      filter.paymentStatus = status;
    }

    const orders = await Order.find(filter)
      .select("-paymentDetails.raw") // exclude bulky raw payload from list view
      .sort({ orderedAt: -1 })
      .lean(); // plain JS objects are faster for read-only views

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error("GET /admin/orders error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/summary
// Aggregates today's orders to show total quantities per food item.
// This powers the "Item Summary" panel in the admin dashboard.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/summary", adminAuth, async (req, res) => {
  try {
    // Start/end of today (server timezone)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const summary = await Order.aggregate([
      // 1. Only today's orders
      {
        $match: {
          orderedAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      // 2. Unwind the items array so each item becomes its own document
      { $unwind: "$items" },
      // 3. Group by item name, summing quantities and revenue
      {
        $group: {
          _id:           "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue:  { $sum: "$items.subtotal" },
          itemId:        { $first: "$items.itemId" },
        },
      },
      // 4. Sort by most popular item first
      { $sort: { totalQuantity: -1 } },
      // 5. Reshape output
      {
        $project: {
          _id:           0,
          itemId:        1,
          name:          "$_id",
          totalQuantity: 1,
          totalRevenue:  { $round: ["$totalRevenue", 2] },
        },
      },
    ]);

    // Also provide overall stats
    const overallStats = await Order.aggregate([
      { $match: { orderedAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id:              null,
          totalOrders:      { $sum: 1 },
          totalRevenue:     { $sum: "$totalAmount" },
          paidOrders:       { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
          pendingOrders:    { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
          failedOrders:     { $sum: { $cond: [{ $eq: ["$paymentStatus", "failed"] }, 1, 0] } },
          codOrders:        { $sum: { $cond: [{ $eq: ["$paymentStatus", "cod"] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      date:    startOfDay.toISOString().slice(0, 10),
      items:   summary,
      stats:   overallStats[0] || {
        totalOrders: 0, totalRevenue: 0,
        paidOrders: 0, pendingOrders: 0, failedOrders: 0, codOrders: 0,
      },
    });
  } catch (err) {
    console.error("GET /admin/summary error:", err);
    res.status(500).json({ success: false, message: "Failed to generate summary." });
  }
});

module.exports = router;
