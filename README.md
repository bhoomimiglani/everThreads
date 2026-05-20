# BonkersCorner — Full Stack E-Commerce

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (running as a service)

### 1. Install & Seed Backend
```bash
cd server
npm install
node seed.js
```

### 2. Start Backend
```bash
cd server
node index.js
# Server: http://localhost:5000
# Admin:  http://localhost:5000/admin
```

### 3. Open Frontend
Visit: http://localhost:5000

---

## 🔑 Login Credentials

| Role  | Email                        | Password   |
|-------|------------------------------|------------|
| Admin | admin@bonkerscorner.com      | Admin@123  |
| User  | rahul@test.com               | Test@123   |

---

## 📁 Project Structure

```
bonk/
├── bonkers-clone/          # Frontend (HTML/CSS/JS)
│   ├── index.html          # Homepage
│   ├── pages/
│   │   ├── shop.html       # Shop with filters
│   │   ├── product.html    # Product detail
│   │   ├── checkout.html   # Checkout + Razorpay
│   │   ├── account.html    # User dashboard
│   │   ├── wishlist.html   # Wishlist
│   │   └── login.html      # Login / Sign Up
│   ├── admin/
│   │   ├── index.html      # Admin panel
│   │   ├── admin.css
│   │   └── admin.js
│   ├── css/
│   │   ├── style.css
│   │   ├── animations.css
│   │   ├── shop.css
│   │   ├── product.css
│   │   └── checkout.css
│   └── js/
│       ├── api.js          # API client (Auth/Products/Orders)
│       ├── products.js     # Product data + card renderer
│       ├── cart.js         # Cart engine + wishlist
│       ├── main.js         # UI interactions
│       ├── shop.js         # Shop filters/sort
│       ├── product.js      # Product detail page
│       └── checkout.js     # Checkout + Razorpay
│
└── server/                 # Backend (Node/Express/MongoDB)
    ├── index.js            # Entry point
    ├── seed.js             # Database seeder
    ├── .env                # Environment variables
    ├── models/
    │   ├── User.js         # User + addresses + wishlist
    │   ├── Product.js      # Products + variants + reviews
    │   ├── Order.js        # Orders + tracking
    │   └── Inventory.js    # Inventory logs
    ├── controllers/
    │   ├── authController.js
    │   ├── productController.js
    │   ├── orderController.js
    │   └── adminController.js
    ├── routes/
    │   ├── auth.js
    │   ├── products.js
    │   ├── orders.js
    │   ├── admin.js
    │   ├── inventory.js
    │   └── payment.js
    └── middleware/
        └── auth.js         # JWT protect + adminOnly
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | /api/auth/register          | Register user        |
| POST   | /api/auth/login             | Login                |
| GET    | /api/auth/me                | Get current user     |
| PUT    | /api/auth/updateprofile     | Update profile       |
| PUT    | /api/auth/changepassword    | Change password      |
| POST   | /api/auth/address           | Add address          |
| DELETE | /api/auth/address/:id       | Delete address       |
| PUT    | /api/auth/wishlist/:id      | Toggle wishlist      |

### Products
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| GET    | /api/products               | List (filter/sort)   |
| GET    | /api/products/:id           | Single product       |
| POST   | /api/products               | Create (admin)       |
| PUT    | /api/products/:id           | Update (admin)       |
| DELETE | /api/products/:id           | Deactivate (admin)   |
| POST   | /api/products/:id/review    | Add review           |

### Orders
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | /api/orders                 | Create order         |
| GET    | /api/orders/myorders        | My orders            |
| GET    | /api/orders/:id             | Order detail         |
| PUT    | /api/orders/:id/cancel      | Cancel order         |

### Admin
| Method | Endpoint                         | Description          |
|--------|----------------------------------|----------------------|
| GET    | /api/admin/dashboard             | Dashboard stats      |
| GET    | /api/admin/analytics             | Analytics data       |
| GET    | /api/admin/orders                | All orders           |
| PUT    | /api/admin/orders/:id/status     | Update order status  |
| GET    | /api/admin/users                 | All customers        |
| PUT    | /api/admin/users/:id/toggle      | Block/unblock user   |
| GET    | /api/admin/inventory             | Inventory overview   |
| PUT    | /api/admin/inventory/:id/restock | Restock product      |

### Payment
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | /api/payment/create-order   | Create Razorpay order|
| POST   | /api/payment/verify         | Verify payment       |

---

## 💳 Razorpay Setup
1. Get keys from https://dashboard.razorpay.com
2. Update `server/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   ```

## 🛒 Coupon Codes
| Code      | Discount |
|-----------|----------|
| SHARK10   | 10% off  |
| FIRST15   | 15% off  |
| SUMMER20  | 20% off  |
| WELCOME5  | 5% off   |
