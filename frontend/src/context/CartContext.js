/**
 * context/CartContext.js
 *
 * Global cart state using React Context + useReducer.
 * Provides: cart items, add/remove/update functions, total, and item count.
 */

import React, { createContext, useContext, useReducer, useCallback } from "react";

const CartContext = createContext(null);

// ── Reducer ───────────────────────────────────────────────────────────────────
const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.find((i) => i.itemId === action.payload.itemId);
      if (existing) {
        return state.map((i) =>
          i.itemId === action.payload.itemId
            ? { ...i, quantity: Math.min(i.quantity + 1, 20) }
            : i
        );
      }
      return [...state, { ...action.payload, quantity: 1 }];
    }

    case "REMOVE_ITEM":
      return state.filter((i) => i.itemId !== action.payload);

    case "UPDATE_QUANTITY": {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        return state.filter((i) => i.itemId !== itemId);
      }
      return state.map((i) =>
        i.itemId === itemId ? { ...i, quantity: Math.min(quantity, 20) } : i
      );
    }

    case "CLEAR_CART":
      return [];

    default:
      return state;
  }
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, []);

  const addItem     = useCallback((item) => dispatch({ type: "ADD_ITEM",        payload: item }),         []);
  const removeItem  = useCallback((id)   => dispatch({ type: "REMOVE_ITEM",     payload: id }),           []);
  const updateQty   = useCallback((id, q) => dispatch({ type: "UPDATE_QUANTITY", payload: { itemId: id, quantity: q } }), []);
  const clearCart   = useCallback(()     => dispatch({ type: "CLEAR_CART" }),                             []);

  const total     = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const getQuantity = (itemId) => cart.find((i) => i.itemId === itemId)?.quantity || 0;

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, total, itemCount, getQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
