/**
 * server.js — Entry point for the Canteen Ordering API
 * Connects to MongoDB, sets up middleware, and mounts routes.
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env
dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the React dev server (or production client URL), plus local IPs for mobile testing
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.");
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH"],
    credentials: true,
  })
);


// Parse incoming JSON bodies (max 10mb for potential base64 payloads)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Route Imports ────────────────────────────────────────────────────────────
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const menuRoutes = require("./routes/menuRoutes");

// ─── Route Mounting ───────────────────────────────────────────────────────────
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRoutes);

// Health-check endpoint so you can quickly verify the server is running
app.get("/api/health", (req, res) => {
  const now = new Date();
  const deadlineHour = parseInt(process.env.ORDER_DEADLINE_HOUR || 11);
  const deadlineMin = parseInt(process.env.ORDER_DEADLINE_MINUTE || 0);
  const isOpen =
    now.getHours() < deadlineHour ||
    (now.getHours() === deadlineHour && now.getMinutes() < deadlineMin);

  res.json({
    status: "ok",
    serverTime: now.toISOString(),
    orderingOpen: isOpen,
    deadline: `${String(deadlineHour).padStart(2, "0")}:${String(deadlineMin).padStart(2, "0")}`,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ─── Database Connection & Server Start ───────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Setup event listeners for runtime database connection status
mongoose.connection.on("error", (err) => {
  console.error("⚠️  MongoDB connection error at runtime:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected! Trying to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅  MongoDB reconnected successfully");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
  });

// Only listen locally, Vercel will handle the routing via module.exports
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`📋  Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
