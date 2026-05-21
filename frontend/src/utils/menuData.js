/**
 * utils/menuData.js
 * Static menu items. In production, fetch these from a /api/menu endpoint
 * so canteen staff can update prices/items from the admin panel.
 */

export const MENU_CATEGORIES = [
  {
    id:    "breakfast",
    label: "Breakfast",
    emoji: "🌅",
    items: [
      { itemId: "b1", name: "Idli Sambar (4 pcs)",  price: 30,  emoji: "🍚", description: "Soft steamed rice cakes with lentil soup & chutney" },
      { itemId: "b2", name: "Masala Dosa",           price: 45,  emoji: "🫓", description: "Crispy crepe with spiced potato filling" },
      { itemId: "b3", name: "Poha",                  price: 25,  emoji: "🥣", description: "Flattened rice with veggies & peanuts" },
      { itemId: "b4", name: "Bread Omelette",        price: 35,  emoji: "🍳", description: "2-egg omelette with toasted bread" },
      { itemId: "b5", name: "Upma",                  price: 25,  emoji: "🍲", description: "Semolina porridge with veggies" },
    ],
  },
  {
    id:    "meals",
    label: "Meals",
    emoji: "🍽️",
    items: [
      { itemId: "m1", name: "Full Meals (Veg)",      price: 70,  emoji: "🥗", description: "Rice, dal, sabzi, roti, salad & papad" },
      { itemId: "m2", name: "Full Meals (Non-Veg)",  price: 90,  emoji: "🍗", description: "Rice, curry, chicken gravy, roti & salad" },
      { itemId: "m3", name: "Curd Rice",             price: 40,  emoji: "🍚", description: "South-Indian style curd rice with pickle" },
      { itemId: "m4", name: "Rajma Chawal",          price: 60,  emoji: "🫘", description: "Kidney bean curry with steamed basmati rice" },
      { itemId: "m5", name: "Chicken Biryani",       price: 100, emoji: "🍛", description: "Aromatic basmati biryani with raita" },
    ],
  },
  {
    id:    "snacks",
    label: "Snacks",
    emoji: "🧆",
    items: [
      { itemId: "s1", name: "Samosa (2 pcs)",        price: 20,  emoji: "🥟", description: "Crispy pastry with spiced potato filling" },
      { itemId: "s2", name: "Vada Pav",              price: 20,  emoji: "🥖", description: "Spicy potato fritter in a soft bun" },
      { itemId: "s3", name: "Egg Puff",              price: 25,  emoji: "🥐", description: "Flaky pastry with boiled egg & masala" },
      { itemId: "s4", name: "French Fries",          price: 50,  emoji: "🍟", description: "Crispy salted fries with ketchup" },
      { itemId: "s5", name: "Maggi Noodles",         price: 35,  emoji: "🍜", description: "Classic 2-minute noodles with veggies" },
    ],
  },
  {
    id:    "beverages",
    label: "Beverages",
    emoji: "☕",
    items: [
      { itemId: "v1", name: "Masala Chai",           price: 15,  emoji: "🍵", description: "Spiced Indian milk tea" },
      { itemId: "v2", name: "Filter Coffee",         price: 20,  emoji: "☕", description: "South-Indian decoction coffee" },
      { itemId: "v3", name: "Fresh Lime Soda",       price: 30,  emoji: "🍋", description: "Sweet or salty, your choice" },
      { itemId: "v4", name: "Mango Lassi",           price: 40,  emoji: "🥛", description: "Thick chilled mango yogurt drink" },
      { itemId: "v5", name: "Cold Coffee",           price: 45,  emoji: "🧃", description: "Blended iced coffee with milk" },
    ],
  },
];

// Flatten all items into a single list (useful for order summaries)
export const ALL_MENU_ITEMS = MENU_CATEGORIES.flatMap((c) => c.items);
