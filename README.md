# 🍕 SnackCraft — Local Snack Store Ordering Website

A modern, mobile-first snack store ordering application built for local eateries (pizzas, rolls, loaded fries, gourmet sandwiches, burgers, coolers and shakes). 

Customers browse appetizing food cards, customize toppings, sign in, and place orders with **Pay at Store** or **Cash on Delivery (NO online payment)**. The store owner receives instant **Telegram Bot** alerts and live **Socket.io** dashboard updates, calling the customer on their phone to confirm the order before the kitchen starts preparation.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, Lucide React, Socket.io Client, Firebase Web SDK |
| **Backend** | Node.js, Express (ES Modules), Socket.io, Mongoose, Zod, Firebase Admin SDK, Cloudinary SDK |
| **Database** | MongoDB Atlas / Local MongoDB |
| **Realtime** | Socket.io (instant dashboard stream & customer live order tracking) |
| **Alerts** | Telegram Bot API for instantaneous owner alerts |
| **Location** | Google Maps Geocoding & Places Autocomplete API with GPS Auto-detection |
| **Media** | Cloudinary CDN for food item image uploads & previews |

---

## 📦 Dependencies & Justifications

Per project rules, every dependency added serves a specific requirement:

### Backend (`server/package.json`)
- **`express`**: Fast, minimalist web framework for building RESTful endpoints.
- **`mongoose`**: Strict modeling, type casting, validation, and querying for MongoDB Atlas.
- **`zod`**: Schema declaration and validation for all incoming request bodies, queries, and URL parameters.
- **`socket.io`**: Real-time bidirectional WebSocket events for immediate new order chimes on admin queue and live customer status tracker.
- **`firebase-admin`**: Verifies Firebase ID tokens server-side, securing customer and admin routes.
- **`dotenv`**: Loads environment secrets safely from `.env` without exposing keys in code.
- **`cors`**: Configures cross-origin requests securely between the client (`:5173`) and server (`:5000`).
- **`cloudinary` & `multer`**: Secure image uploads and buffer streaming for menu items.
- *(Note: Telegram Bot API uses Node's native global `fetch()`, requiring zero extra dependencies).*

### Frontend (`client/package.json`)
- **`react` & `react-dom`**: Component-based UI library.
- **`vite` & `@vitejs/plugin-react`**: Lightning-fast build tooling and hot-module replacement.
- **`tailwindcss`**, **`postcss`**, **`autoprefixer`**: Clean utility-first CSS for minimalist, mobile-first UI with a single accent color (`brand`).
- **`react-router-dom`**: Client-side page navigation, nested routing, and route protection.
- **`firebase`**: Client authentication supporting Google popup, Email/Password, and Phone OTP.
- **`socket.io-client`**: Subscribes to live order updates and admin event streams.
- **`lucide-react`**: Lightweight, cohesive icon suite.

---

## 🔒 Strict Rules & Architecture Highlights

1. **Zero Client Trust for Financials**:
   - The client never passes prices, subtotals, delivery fees, or totals to the server.
   - The server queries `MenuItem` from MongoDB, validates that items are currently in-stock (`isAvailable: true`), validates customization prices against DB options, applies store minimums and delivery fees, and calculates `totalAmount` server-side.
2. **Strict Zod Validation**:
   - Every route parameter (`:id`), search query, and JSON body is validated against Zod schemas before hitting business logic.
3. **Resilient Notifications**:
   - Telegram alerts and Socket.io broadcasts are isolated in non-blocking try-catch blocks. Even if Telegram or WebSockets experience temporary downtime, **order placement never fails**.
4. **Order Statuses**:
   - `PENDING_CONFIRMATION` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY` ➔ `OUT_FOR_DELIVERY` ➔ `COMPLETED` (or `CANCELLED`)
5. **Enforced Cancellation Reasons**:
   - Cancellations require one of: `NOT_REACHABLE`, `CUSTOMER_DECLINED`, `FAKE_ORDER`, or `OUT_OF_STOCK`.
6. **Role-Based Protection**:
   - Customer and admin routes are protected on both Frontend (`<AdminRoute>`, `<ProtectedRoute>`) and Backend (`requireAuth`, `requireAdmin`).

---

## ⚙️ Setup & Configuration

### 1. Server Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Fill in the following values:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas URI (or local MongoDB)
MONGODB_URI=mongodb://127.0.0.1:27017/snackstore

# Firebase Admin SDK (credentials downloaded from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Telegram Bot Owner Alerts
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_OWNER_CHAT_ID=987654321

# Google Maps API (Geocoding & Places Autocomplete)
GOOGLE_MAPS_API_KEY=AIzaSy...

# Cloudinary (Optional, for menu image upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Client Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```
Fill in your Firebase Web App credentials:
```env
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```
*(Note: An Instant Demo Switcher is built-in on the sign-in modal, allowing full local customer & admin workflow testing even before external Firebase keys are provisioned).*

---

## 🏃 Running the Application

### Seed Menu & Store Defaults
Populate categories (Pizzas, Rolls, Burgers, Sandwiches, Fries, Beverages) and delicious starter snacks:
```bash
npm run seed
```

### Start Backend Server
```bash
npm run dev:server
# Server starts on http://localhost:5000
```

### Start Frontend Client
```bash
npm run dev:client
# Vite client starts on http://localhost:5173
```

---

## 📱 User & Owner Walkthrough

1. **Browsing the Menu**:
   - Customer visits `http://localhost:5173`.
   - Uses category pills or Veg-only filter.
   - Taps "ADD" on items like *Classic Margherita* or *Kolkata Paneer Kathi Roll*. Selects customization add-ons (Extra Cheese, Dips, Sauces).
2. **Placing the Order**:
   - Selects **Home Delivery** or **Store Pickup**.
   - Selects **Cash on Delivery** or **Pay at Store** (no online payment).
   - Enters delivery address and contact phone number.
   - Hits "Place Order". Server recalculates all prices and creates order with status `PENDING_CONFIRMATION`.
3. **Owner Telephone Confirmation & Kitchen Flow**:
   - The store owner receives an immediate **Telegram message** with customer phone & items, and an audio chime rings on the Admin Dashboard (`/admin`).
   - The owner clicks the one-tap **"Call Customer"** button on the dashboard to confirm order details.
   - Once confirmed, the owner taps **"Confirm Order"**, which updates the status to `CONFIRMED` and advances it to `PREPARING` in the kitchen.
4. **Live Customer Tracking**:
   - The customer's tracking screen (`/order/:id`) automatically updates in real-time via Socket.io without refreshing:
     `PENDING_CONFIRMATION` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY` ➔ `OUT_FOR_DELIVERY` ➔ `COMPLETED`.
   - Upon delivery/pickup, the order is marked `COMPLETED` and payment status transitions to `PAID`.

