/**
 * pages/PaymentSuccess.js
 * Shown after PhonePe redirects the student back to our site.
 * Polls the backend to confirm the payment status.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

const PaymentSuccess = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const orderId    = params.get("orderId");
  const simulated  = params.get("simulated") === "true";

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!orderId) { setError("No order ID found."); setLoading(false); return; }

    let attempts = 0;
    const maxAttempts = 10; // Poll up to 10 times (10 seconds) for callback to arrive

    const poll = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data.order);

        // If still pending and PhonePe callback hasn't arrived, retry
        if (data.order.paymentStatus === "pending" && attempts < maxAttempts && !simulated) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Could not load order details.");
        setLoading(false);
      }
    };

    poll();
  }, [orderId, simulated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canteen-dark">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-canteen-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canteen-dark p-4">
        <div className="card p-8 max-w-sm text-center">
          <span className="text-5xl block mb-4">❌</span>
          <h2 className="font-display text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="text-gray-400 text-sm mt-2">{error || "Order not found."}</p>
          <button onClick={() => navigate("/")} className="btn-primary mt-6">Back to Menu</button>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "paid";
  const isCod = order.paymentStatus === "cod";
  const isConfirmed = isPaid || isCod;

  return (
    <div className="min-h-screen flex items-center justify-center bg-canteen-dark p-4">
      <div className="card p-8 max-w-md w-full text-center animate-slide-up">
        <span className="text-6xl block mb-4">{isPaid ? "🎉" : isCod ? "💵" : "⏳"}</span>

        <h1 className="font-display text-2xl font-bold">
          {isPaid ? "Order Confirmed!" : isCod ? "Order Placed (COD)" : "Payment Pending"}
        </h1>

        <p className="text-gray-400 text-sm mt-2">
          {isPaid
            ? "Your order has been received by the canteen."
            : isCod
            ? "Your order has been received. Please pay at the counter when you pick up."
            : "We're waiting for payment confirmation. Please check back in a moment."}
        </p>

        {/* Order details */}
        <div className="bg-canteen-dark rounded-xl p-4 mt-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Order Ref</span>
            <span className="font-mono text-canteen-secondary">{order.orderRef}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Student</span>
            <span>{order.student.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Roll No</span>
            <span>{order.student.rollNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Amount</span>
            <span className="text-canteen-secondary font-bold">₹{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-400">Status</span>
            <span
              className={`font-semibold ${
                isPaid || isCod ? "text-green-400" : order.paymentStatus === "failed" ? "text-red-400" : "text-yellow-400"
              }`}
            >
              {isPaid ? "✅ Paid" : isCod ? "💵 Cash on Delivery" : order.paymentStatus === "failed" ? "❌ Failed" : "⏳ Pending"}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="text-left mt-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Items Ordered</p>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1 border-b border-white/5">
              <span className="text-gray-300">{item.name} ×{item.quantity}</span>
              <span className="text-gray-400">₹{item.subtotal?.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate("/")} className="btn-secondary flex-1">
            Order More
          </button>
          {!isConfirmed && (
            <button onClick={() => window.location.reload()} className="btn-primary flex-1">
              Check Status
            </button>
          )}
        </div>

        {isConfirmed && (
          <p className="text-green-400/60 text-xs mt-4">
            Show this confirmation to the canteen counter. 🍽️
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
