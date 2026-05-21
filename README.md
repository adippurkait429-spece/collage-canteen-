# 🍽️ Campus Canteen Food Ordering System

A full-stack MERN application for college canteen pre-ordering with a strict 11:00 AM ordering deadline and PhonePe payment integration.

---

## 📁 Project Structure

```
canteen-app/
├── backend/
│   ├── controllers/
│   │   └── paymentService.js      # PhonePe API integration
│   ├── middleware/
│   │   ├── adminAuth.js           # JWT auth guard for admin routes
│   │   └── orderDeadline.js       # Server-side 11 AM deadline enforcer
│   ├── models/
│   │   └── Order.js               # Mongoose schema (student, items, payment)
│   ├── routes/
│   │   ├── orderRoutes.js         # POST /orders, payment callback, simulation
│   │   └── adminRoutes.js         # Admin login, orders list, item summary
│   ├── .env                       # Environment variables (do NOT commit!)
│   ├── package.json
│   └── server.js                  # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── AdminDashboard.js  # Admin panel: stats, summary, orders table
    │   │   ├── CartSidebar.js     # Slide-in cart with quantity controls
    │   │   ├── CheckoutForm.js    # Student details form + PhonePe payment
    │   │   ├── Menu.js            # Category tabs + food item cards
    │   │   └── Timer.js           # Live countdown to 11:00 AM deadline
    │   ├── context/
    │   │   └── CartContext.js     # Global cart state (useReducer)
    │   ├── pages/
    │   │   ├── AdminLogin.js      # Admin login page
    │   │   └── PaymentSuccess.js  # Post-payment confirmation page
    │   ├── utils/
    │   │   ├── api.js             # Axios instance with JWT interceptor
    │   │   └── menuData.js        # Static menu items (4 categories)
    │   ├── App.js                 # React Router + layout shell
    │   ├── index.css              # Tailwind directives + custom classes
    │   └── index.js
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd canteen-app/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env` with your MongoDB URI and other credentials:

```env
MONGO_URI=mongodb://localhost:27017/canteen_db
JWT_SECRET=your_32_character_random_secret
ADMIN_USERNAME=canteen_admin
ADMIN_PASSWORD=Admin@1234

# PhonePe Sandbox (get from https://developer.phonepe.com/)
PHONEPE_MERCHANT_ID=PGTESTPAYUAT
PHONEPE_SALT_KEY=099eb0cd-02cf-4dc2-a4b3-b47a2e7f2a51
```

### 3. Run

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

### 4. Access

| URL                              | Description            |
|----------------------------------|------------------------|
| http://localhost:3000            | Student ordering page  |
| http://localhost:3000/checkout   | Checkout & payment     |
| http://localhost:3000/admin/login | Admin login           |
| http://localhost:3000/admin/dashboard | Admin dashboard   |

---

## 🔑 Default Admin Credentials
```
Username: canteen_admin
Password: Admin@1234
```
Change these in `.env` before deployment!

---

## ⚙️ Key Features

### ⏰ 11:00 AM Ordering Deadline
- **Frontend**: `Timer.js` shows a live HH:MM:SS countdown. All "Add to Cart" and "Checkout" buttons are disabled after deadline.
- **Backend**: `middleware/orderDeadline.js` independently checks `new Date().getHours()` and rejects requests with HTTP 403 — even if someone bypasses the frontend via Postman or DevTools.

### 💳 PhonePe Integration
- **Sandbox flow**: `paymentService.js` creates a signed payload, sends to PhonePe's UAT endpoint, and returns a redirect URL.
- **Callback**: PhonePe POSTs to `/api/orders/payment-callback`. The server verifies the SHA256 checksum before marking the order as "paid".
- **Dev simulation**: Check the "Dev mode" box on checkout to mark the order paid without leaving the site (disabled in production).

### 📊 Admin Dashboard
- JWT-protected; token expires in 8 hours.
- Auto-refreshes every 30 seconds.
- Shows: total orders, revenue, paid/pending/failed counts, per-item quantity totals, full searchable/filterable orders table.

---

## 🔒 Production Checklist

- [ ] Replace PhonePe Sandbox credentials with Production keys
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use a strong random `JWT_SECRET` (32+ chars)
- [ ] Change default `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Deploy MongoDB to Atlas (or secured replica set)
- [ ] Enable HTTPS — PhonePe requires it for the callback URL
- [ ] Remove the `/simulate-payment` endpoint or add IP-allow list
- [ ] Add rate limiting (e.g., `express-rate-limit`) to order endpoints
