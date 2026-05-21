/**
 * components/CartSidebar.js
 *
 * Slide-in cart panel showing selected items with quantity controls.
 * The "Checkout" button navigates to the checkout page.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartSidebar = ({ isOpen, onClose, isOrderOpen }) => {
  const { cart, removeItem, updateQty, total, itemCount, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-canteen-card/95 backdrop-blur-xl border-l border-white/[0.06]
          z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-canteen-primary/20 to-orange-500/10 flex items-center justify-center text-xl">
              🛒
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Your Cart</h2>
              <p className="text-gray-500 text-xs">
                {itemCount === 0 ? "Empty" : `${itemCount} item${itemCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-all duration-300 hover:bg-red-500/10"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-2xl glass border border-white/[0.06] flex items-center justify-center text-4xl">
                🛒
              </div>
              <div>
                <p className="text-white font-semibold">Your cart is empty</p>
                <p className="text-gray-500 text-sm mt-1">Add items from the menu to get started</p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.itemId}
                className="glass border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3 animate-fade-in hover:border-white/[0.12] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-canteen-primary/15 to-orange-500/5 flex items-center justify-center text-xl flex-shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                  <p className="text-canteen-secondary text-sm font-bold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Quantity stepper */}
                <div className="flex items-center gap-0.5 bg-canteen-dark/60 rounded-lg px-1 py-0.5 border border-white/[0.06]">
                  <button
                    onClick={() => updateQty(item.itemId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-canteen-primary hover:bg-canteen-primary hover:text-white rounded-md transition-all duration-200 font-bold text-sm"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-white tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.itemId, item.quantity + 1)}
                    disabled={item.quantity >= 20}
                    className="w-7 h-7 flex items-center justify-center text-canteen-primary hover:bg-canteen-primary hover:text-white rounded-md transition-all duration-200 font-bold text-sm disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.itemId)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1 text-sm"
                  aria-label={`Remove ${item.name}`}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer: total + checkout */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-white/[0.06] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="font-display text-2xl font-bold text-gradient">
                ₹{total.toFixed(2)}
              </span>
            </div>

            {isOrderOpen ? (
              <button onClick={handleCheckout} className="btn-primary w-full text-base py-3.5">
                Proceed to Checkout →
              </button>
            ) : (
              <button disabled className="btn-primary w-full text-base py-3.5">
                🚫 Orders Closed
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
