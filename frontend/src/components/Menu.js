/**
 * components/Menu.js
 *
 * Displays food items grouped by category.
 * Integrates with CartContext — each card shows quantity controls.
 * All "Add to Cart" buttons are disabled when `isOrderOpen` is false.
 */

import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { MENU_CATEGORIES } from "../utils/menuData";

// ── Single menu item card ─────────────────────────────────────────────────────
const MenuCard = ({ item, isOrderOpen, index }) => {
  const { addItem, removeItem, updateQty, getQuantity } = useCart();
  const qty = getQuantity(item.itemId);

  return (
    <div
      className={`card-hover p-5 flex flex-col gap-3 group
        ${!isOrderOpen ? "opacity-50 pointer-events-none" : ""}
        ${qty > 0 ? "border-canteen-primary/30 shadow-glow-sm" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Emoji + Name */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-canteen-primary/15 to-orange-500/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
            {item.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-canteen-secondary transition-colors duration-300">
              {item.name}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">{item.description}</p>
          </div>
        </div>
      </div>

      {/* Price + Cart control */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
        <div>
          <span className="text-canteen-secondary font-bold text-xl">₹{item.price}</span>
          <span className="text-gray-600 text-xs ml-1">per item</span>
        </div>

        {qty === 0 ? (
          // "Add" button — disabled after deadline
          <button
            onClick={() => addItem(item)}
            disabled={!isOrderOpen}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
            title={!isOrderOpen ? "Orders closed for today" : `Add ${item.name} to cart`}
          >
            <span className="text-base">+</span> Add
          </button>
        ) : (
          // Quantity stepper
          <div className="flex items-center gap-1 glass border border-canteen-primary/30 rounded-xl px-1.5 py-1">
            <button
              onClick={() => updateQty(item.itemId, qty - 1)}
              disabled={!isOrderOpen}
              className="w-8 h-8 flex items-center justify-center text-canteen-primary hover:bg-canteen-primary hover:text-white rounded-lg transition-all duration-200 font-bold text-lg disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-white font-bold tabular-nums text-sm">
              {qty}
            </span>
            <button
              onClick={() => addItem(item)}
              disabled={!isOrderOpen || qty >= 20}
              className="w-8 h-8 flex items-center justify-center text-canteen-primary hover:bg-canteen-primary hover:text-white rounded-lg transition-all duration-200 font-bold text-lg disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Menu Component ───────────────────────────────────────────────────────
const Menu = ({ isOrderOpen }) => {
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].id);

  const currentCategory = MENU_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <section className="animate-fade-in">
      {/* Section title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-canteen-primary to-orange-500 rounded-full" />
        <h2 className="font-display text-2xl font-bold text-white">
          Today's <span className="text-gradient">Menu</span>
        </h2>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-6">
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300
              ${activeCategory === cat.id
                ? "bg-gradient-to-r from-canteen-primary to-orange-500 text-white shadow-glow-md scale-[1.02]"
                : "glass text-gray-400 hover:text-white hover:border-white/20 border border-white/[0.06]"
              }`}
          >
            <span className="text-base">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentCategory.items.map((item, index) => (
          <MenuCard key={item.itemId} item={item} isOrderOpen={isOrderOpen} index={index} />
        ))}
      </div>

      {/* "Orders closed" overlay notice */}
      {!isOrderOpen && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 glass border border-red-500/20 rounded-2xl px-6 py-4">
            <span className="text-2xl">🚫</span>
            <div className="text-left">
              <p className="text-red-400 text-sm font-semibold">Ordering window is closed</p>
              <p className="text-gray-500 text-xs">Come back tomorrow before 11:00 AM!</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Menu;
