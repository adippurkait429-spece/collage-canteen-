const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");
const { adminAuth } = require("../middleware/adminAuth");

// GET /api/menu -> fetches grouped items
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find({});
    
    // Group them into the format frontend expects
    const categoriesMap = {
      breakfast: { id: "breakfast", label: "Breakfast", emoji: "🌅", items: [] },
      meals: { id: "meals", label: "Meals", emoji: "🍽️", items: [] },
      snacks: { id: "snacks", label: "Snacks", emoji: "🧆", items: [] },
      beverages: { id: "beverages", label: "Beverages", emoji: "☕", items: [] },
    };

    items.forEach(item => {
      const cat = categoriesMap[item.category];
      if (cat) {
        cat.items.push(item);
      } else {
        // Fallback for unknown categories
        if (!categoriesMap["others"]) categoriesMap["others"] = { id: "others", label: "Others", emoji: "📦", items: [] };
        categoriesMap["others"].items.push(item);
      }
    });

    const categoriesList = Object.values(categoriesMap).filter(c => c.items.length > 0);
    
    // Also send flat array for admin table
    res.json({
      success: true,
      categories: categoriesList,
      flatItems: items
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch menu." });
  }
});

// DELETE /api/menu/:itemId -> delete by itemId
router.delete("/:itemId", adminAuth, async (req, res) => {
  try {
    // Only allow HOD to delete
    if (req.admin.role !== "hod") {
      return res.status(403).json({ success: false, message: "Only HOD can delete items." });
    }

    const { itemId } = req.params;
    const deleted = await MenuItem.findOneAndDelete({ itemId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    res.json({ success: true, message: "Item deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete item." });
  }
});

// POST /api/menu/seed -> create default items (temp endpoint for setup)
router.post("/seed", async (req, res) => {
  try {
    const defaultData = [
      { itemId: "b1", name: "Idli Sambar (4 pcs)",  price: 30,  emoji: "🍚", description: "Soft steamed rice cakes with lentil soup & chutney", category: "breakfast" },
      { itemId: "b2", name: "Masala Dosa",           price: 45,  emoji: "🫓", description: "Crispy crepe with spiced potato filling", category: "breakfast" },
      { itemId: "b3", name: "Poha",                  price: 25,  emoji: "🥣", description: "Flattened rice with veggies & peanuts", category: "breakfast" },
      { itemId: "b4", name: "Bread Omelette",        price: 35,  emoji: "🍳", description: "2-egg omelette with toasted bread", category: "breakfast" },
      { itemId: "b5", name: "Upma",                  price: 25,  emoji: "🍲", description: "Semolina porridge with veggies", category: "breakfast" },
      { itemId: "m1", name: "Full Meals (Veg)",      price: 70,  emoji: "🥗", description: "Rice, dal, sabzi, roti, salad & papad", category: "meals" },
      { itemId: "m2", name: "Full Meals (Non-Veg)",  price: 90,  emoji: "🍗", description: "Rice, curry, chicken gravy, roti & salad", category: "meals" },
      { itemId: "m3", name: "Curd Rice",             price: 40,  emoji: "🍚", description: "South-Indian style curd rice with pickle", category: "meals" },
      { itemId: "m4", name: "Rajma Chawal",          price: 60,  emoji: "🫘", description: "Kidney bean curry with steamed basmati rice", category: "meals" },
      { itemId: "m5", name: "Chicken Biryani",       price: 100, emoji: "🍛", description: "Aromatic basmati biryani with raita", category: "meals" },
      { itemId: "s1", name: "Samosa (2 pcs)",        price: 20,  emoji: "🥟", description: "Crispy pastry with spiced potato filling", category: "snacks" },
      { itemId: "s2", name: "Vada Pav",              price: 20,  emoji: "🥖", description: "Spicy potato fritter in a soft bun", category: "snacks" },
      { itemId: "s3", name: "Egg Puff",              price: 25,  emoji: "🥐", description: "Flaky pastry with boiled egg & masala", category: "snacks" },
      { itemId: "s4", name: "French Fries",          price: 50,  emoji: "🍟", description: "Crispy salted fries with ketchup", category: "snacks" },
      { itemId: "s5", name: "Maggi Noodles",         price: 35,  emoji: "🍜", description: "Classic 2-minute noodles with veggies", category: "snacks" },
    ];

    // Clear existing
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(defaultData);

    res.json({ success: true, message: "Menu seeded successfully.", count: defaultData.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to seed.", error: err.message });
  }
});

module.exports = router;
