# Stock and Inventory Management Mobile Application

A complete MERN stack (React Native + Express/MongoDB) application for managing inventory, raising stock-related queries, and tracking low-stock alerts.

## Tech Stack
- **Frontend**: React Native (Expo) - JavaScript completely
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **State Management**: React Context API
- **Authentication**: JWT-based Authentication (bcrypt for hashing)

## Architecture
The project is divided into two separate applications:
- `./server` - The Node.js API backend.
- `./client` - The React Native frontend.

---

## ⚙️ Environment Setup

### 1. Requirements
Ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Expo CLI](https://expo.dev/)

### 2. Backend Config
Rename `.env.example` (or simply modify `.env`) inside the `/server` folder to match your environment:
```env
MONGO_URI=mongodb://127.0.0.1:27017/inventorydb
JWT_SECRET=supersecret123
PORT=5000
```
*(If you are running the app on a physical Android device testing locally, the app is configured to look at `http://YOUR_LOCAL_IP:5000`. Adjust it in `client/src/utils/api.js` if necessary. Current default is Android emulator `10.0.2.2`).*

---

## 🚀 Run Commands

### Start the Backend
```bash
cd server
npm install
npm run dev # (or `node index.js`)
```
*Note: A default Admin account (`admin@test.com` / `123`) is automatically seeded upon first boot of the MongoDB database.*

### Start the Frontend
```bash
cd client
npm install
npm start
```
- Press `a` to run on Android Emulator.
- Connect your phone using the Expo Go App and scan the QR code.

---

## 📦 Building an APK (Android)

Since the app is built using Expo, generating a standalone APK is very straightforward using EAS (Expo Application Services).

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Login to your Expo account:
   ```bash
   eas login
   ```
3. Configure the project:
   ```bash
   eas build:configure
   ```
4. Build the APK locally (requires Android Studio) or via Expo's clouds:
   ```bash
   eas build -p android --profile preview
   ```

*(This will generate a `.apk` file that you can install directly on Android devices).*

---

## 📡 API Documentation

### Auth Endpoints
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Desc: Login user to retrieve JWT token
- `POST /api/auth/register` (Admins ONLY)
  - Body: `{ name, email, password, role }`
  - Desc: Register Staff or Students

### Inventory Endpoints
- `GET /api/inventory`
  - Desc: Retrieve all inventory items
- `POST /api/inventory` (Admins ONLY)
  - Body: `{ itemId, name, category, quantity, price, assignedTo, status }`
  - Desc: Create a new inventory item
- `PUT /api/inventory/:id` (Admins ONLY)
  - Body: Fields to update
  - Desc: Edit specific item
- `DELETE /api/inventory/:id` (Admins ONLY)
  - Desc: Remove an item entirely
- `POST /api/inventory/purchase` (Students/Staff)
  - Body: `{ itemId, quantity }`
- `POST /api/inventory/borrow` (Students/Staff)
  - Body: `{ itemId, duration, quantity }`
- `POST /api/inventory/return` (Students/Staff)
  - Body: `{ itemId, reason, quantity }`

### Queries & Requests
- `GET /api/queries` (Admins see all; Staff/Students see their own)
  - Desc: List all active or resolved queries.
- `POST /api/queries` (Students/Staff)
  - Body: `{ type, message }`
  - Desc: Raise a new operational query.
- `PUT /api/queries/:id/status` (Admins ONLY)
  - Body: `{ status: 'Resolved' }`

### Notifications (Admins ONLY)
- `GET /api/notifications`
  - Desc: Fetch server-triggered notifications (low stock & query logs)
- `PUT /api/notifications/:id`
  - Desc: Mark a notification as read.
