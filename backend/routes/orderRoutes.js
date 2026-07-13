/**
 * routes/orderRoutes.js
 *
 * Public-facing order routes:
 *   POST /api/orders               → Place a new order (deadline-gated + location-verified)
 *   GET  /api/orders/:id           → Get order details by ID
 *   POST /api/orders/payment-callback → PhonePe payment callback
 *   PATCH /api/orders/:id/simulate-payment → Dev-only payment simulation
 */

const express  = require("express");
const router   = express.Router();
const Order    = require("../models/Order");
const { checkOrderDeadline } = require("../middleware/orderDeadline");
const { validateLocation }   = require("../middleware/validateLocation");
const {
  initiatePhonePePayment,
  verifyPhonePeCallback,
} = require("../controllers/paymentService");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders
// Place a new order. The `checkOrderDeadline` middleware rejects requests
// after 11:00 AM. The `validateLocation` middleware rejects requests from
// users outside the 5 KM delivery radius. Both run before any DB logic.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", checkOrderDeadline, validateLocation, async (req, res) => {
  try {
    const { student, items, paymentMethod } = req.body;

    // ── Basic input validation ─────────────────────────────────────────────
    if (!student || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Provide student details and at least one item.",
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.itemId || !item.name || !item.price || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Item "${item.name || "unknown"}" is missing required fields.`,
        });
      }
      if (item.quantity < 1 || item.quantity > 20) {
        return res.status(400).json({
          success: false,
          message: `Quantity for "${item.name}" must be between 1 and 20.`,
        });
      }
    }

    // Determine payment method (default: phonepe)
    const method = paymentMethod === "cod" ? "cod" : "phonepe";

    // ── Read server-verified location from validateLocation middleware ────────
    const { latitude, longitude, distanceFromRestaurant } = req.userLocation;

    // ── Create order in DB (totalAmount recalculated server-side in pre-save) ──
    const order = new Order({
      student,
      items,
      totalAmount: 0, // pre-save middleware will recompute this from items
      paymentMethod: method,
      // COD orders get 'cod' status immediately; online orders stay 'pending'
      paymentStatus: method === "cod" ? "cod" : "pending",
      // Location data (server-verified)
      latitude,
      longitude,
      distanceFromRestaurant,
    });

    await order.save();

    // ── Cash on Delivery: no payment gateway needed ───────────────────────
    if (method === "cod") {
      return res.status(201).json({
        success: true,
        message: "Order placed successfully! Pay at the counter when you pick up.",
        orderId:       order._id,
        orderRef:      order.orderRef,
        totalAmount:   order.totalAmount,
        paymentMethod: "cod",
      });
    }

    // ── Online Payment: Initiate PhonePe payment ──────────────────────────
    let paymentResponse;
    try {
      paymentResponse = await initiatePhonePePayment(order);

      // Store the merchantTransactionId so we can match the callback later
      order.paymentDetails = {
        merchantTransactionId: paymentResponse.merchantTransactionId,
      };
      await order.save();
    } catch (paymentErr) {
      // If payment initiation fails, delete the pending order to avoid orphans
      await Order.findByIdAndDelete(order._id);
      return res.status(502).json({
        success: false,
        message: `Order created but payment initiation failed: ${paymentErr.message}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully. Redirecting to payment...",
      orderId:     order._id,
      orderRef:    order.orderRef,
      totalAmount: order.totalAmount,
      redirectUrl: paymentResponse.redirectUrl,
    });
  } catch (err) {
    // Handle Mongoose validation errors with user-friendly messages
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }
    console.error("POST /orders error:", err);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id
// Retrieve a single order by MongoDB _id (used on the payment success page)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select("-paymentDetails.raw");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, order });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/payment-callback
// PhonePe calls this URL after payment (success or failure).
// We verify the checksum and update the order's paymentStatus accordingly.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/payment-callback", async (req, res) => {
  try {
    const { response: base64Response } = req.body;
    const receivedChecksum = req.headers["x-verify"];

    if (!base64Response || !receivedChecksum) {
      return res.status(400).json({ success: false, message: "Invalid callback payload." });
    }

    // Verify checksum to ensure the callback is genuinely from PhonePe
    const { valid, decoded } = verifyPhonePeCallback(base64Response, receivedChecksum);

    if (!valid) {
      console.warn("⚠️  PhonePe callback checksum mismatch — possible tampering.");
      return res.status(400).json({ success: false, message: "Checksum verification failed." });
    }

    // Find the matching order by merchantTransactionId
    const order = await Order.findOne({
      "paymentDetails.merchantTransactionId": decoded.data?.merchantTransactionId,
    });

    if (!order) {
      console.error("Callback: Order not found for MTI:", decoded.data?.merchantTransactionId);
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Update payment status based on PhonePe's code
    if (decoded.code === "PAYMENT_SUCCESS") {
      order.paymentStatus = "paid";
      order.paymentDetails = {
        ...order.paymentDetails,
        transactionId:      decoded.data?.transactionId,
        paymentInstrument:  decoded.data?.paymentInstrument?.type,
        amount:             decoded.data?.amount,
        raw:                decoded, // store full payload for audit
      };
    } else {
      order.paymentStatus = "failed";
      order.paymentDetails.raw = decoded;
    }

    await order.save();

    // PhonePe expects a 200 OK to acknowledge receipt of the callback
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Payment callback error:", err);
    res.status(500).json({ success: false, message: "Callback processing failed." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/simulate-payment
// DEVELOPMENT ONLY — simulates a successful PhonePe payment without
// actually going to the gateway. Remove or guard this route in production.
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:id/simulate-payment", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "This endpoint is disabled in production.",
    });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    order.paymentStatus = "paid";
    order.paymentDetails = {
      merchantTransactionId: order.paymentDetails?.merchantTransactionId || "SIM-" + Date.now(),
      transactionId:         "SIM-TXN-" + Date.now(),
      paymentInstrument:     "SIMULATED_UPI",
      amount:                order.totalAmount * 100,
      raw:                   { simulated: true, timestamp: new Date().toISOString() },
    };

    await order.save();

    res.json({
      success: true,
      message: "Payment simulated successfully.",
      order: {
        _id:           order._id,
        orderRef:      order.orderRef,
        paymentStatus: order.paymentStatus,
        totalAmount:   order.totalAmount,
      },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
