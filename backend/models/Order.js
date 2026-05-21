/**
 * models/Order.js
 * Mongoose schema & model for a canteen food order.
 *
 * Fields:
 *  - student        : personal details collected at checkout
 *  - items          : array of {name, price, quantity}
 *  - totalAmount    : computed total in INR
 *  - paymentStatus  : "pending" | "paid" | "failed"
 *  - paymentDetails : PhonePe transaction data (stored on callback)
 *  - orderedAt      : timestamp when the order was created
 */

const mongoose = require("mongoose");

// ── Sub-schema: a single line-item in the order ───────────────────────────────
const OrderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [20, "Max 20 units per item"],
    },
    subtotal: {
      type: Number, // price × quantity, computed before save
    },
  },
  { _id: false } // no separate _id for sub-documents
);

// ── Sub-schema: student who placed the order ──────────────────────────────────
const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"],
    },
  },
  { _id: false }
);

// ── Main Order Schema ─────────────────────────────────────────────────────────
const OrderSchema = new mongoose.Schema(
  {
    // Unique order reference shown to student (e.g., CNT-20240610-0042)
    orderRef: {
      type: String,
      unique: true,
    },

    student: {
      type: StudentSchema,
      required: true,
    },

    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "An order must have at least one item",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },

    // Payment method: 'phonepe' (online) or 'cod' (cash on delivery)
    paymentMethod: {
      type: String,
      enum: {
        values: ["phonepe", "cod"],
        message: "{VALUE} is not a valid payment method",
      },
      default: "phonepe",
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "failed", "cod"],
        message: "{VALUE} is not a valid payment status",
      },
      default: "pending",
    },

    // Stores the PhonePe response payload (transactionId, merchantTransactionId, etc.)
    paymentDetails: {
      merchantTransactionId: String,
      transactionId: String,       // PhonePe's transaction ID
      paymentInstrument: String,   // UPI / CARD / NETBANKING
      amount: Number,              // amount in paise confirmed by PhonePe
      raw: mongoose.Schema.Types.Mixed, // full raw response for auditing
    },

    // ISO timestamp of when the order was accepted by the server
    orderedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

// ── Pre-save middleware ────────────────────────────────────────────────────────

OrderSchema.pre("save", async function (next) {
  // 1. Compute subtotals for each item
  this.items.forEach((item) => {
    item.subtotal = parseFloat((item.price * item.quantity).toFixed(2));
  });

  // 2. Recompute totalAmount from items (prevents client-side tampering)
  this.totalAmount = parseFloat(
    this.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
  );

  // 3. Generate a human-readable order reference if not already set
  if (!this.orderRef) {
    const today = new Date();
    const datePart = today
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, ""); // "20240610"
    // Count today's orders to create a sequential suffix
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const count = await mongoose.model("Order").countDocuments({
      orderedAt: { $gte: startOfDay },
    });
    this.orderRef = `CNT-${datePart}-${String(count + 1).padStart(4, "0")}`;
  }

  next();
});

// ── Indexes ────────────────────────────────────────────────────────────────────
// Speed up admin dashboard queries (filter by date + payment status)
OrderSchema.index({ orderedAt: -1 });
OrderSchema.index({ "student.rollNumber": 1 });
OrderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", OrderSchema);
