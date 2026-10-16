# 🛍️ ShopKart — MERN E-Commerce Platform

ShopKart is a full-stack e-commerce web application built using the MERN stack. It allows users to browse products, search and filter the product catalog, manage their wishlist and shopping cart, place orders, and make payments through Razorpay.

The project focuses on full-stack development, secure user authentication, REST API integration, database management, and online payment processing.

## ✨ Features

### 👤 User Authentication
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Secure authentication using HTTP-only cookies
- Protected routes and user-specific data

### 🛒 Product Catalog
- Browse available products
- Search products by name
- Filter products by category
- View product details
- Display product prices, images, and availability

### ❤️ Wishlist & Shopping Cart
- Add and remove products from the wishlist
- Add products to the shopping cart
- Update cart quantities and remove items
- View cart subtotal and order total

### 📦 Order Management
- Enter shipping and delivery details
- Create orders from the shopping cart
- View order history
- Track order and payment status
- Clear the cart after successful payment

### 💳 Razorpay Payment Integration
- Razorpay Standard Checkout integration
- Test Mode payment processing
- Server-side order creation
- Backend payment signature verification
- Payment success, failure, and cancellation handling

**Note:** Razorpay Test Mode is intended for development and testing. No real payments should be processed with test credentials.

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| MongoDB | Database |
| Express.js | Backend API framework |
| React.js | Frontend user interface |
| Node.js | JavaScript runtime |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| bcrypt | Password hashing |
| Razorpay | Payment gateway |
| Vite | Frontend development and build tooling |

## 📁 Project Structure

```text
shop_kart-main/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

The exact files and folders may vary depending on the current implementation.

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB database or MongoDB Atlas account
- Git
- Razorpay account for Test Mode API credentials

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd shop_kart-main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment variables

Create a `.env` file inside the `backend` directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
RAZORPAY_MODE=test
```

Replace the placeholders with your own configuration.

**Security guidelines:**
- Never commit `.env` files to GitHub.
- Never expose `RAZORPAY_KEY_SECRET` in frontend code.
- Never share your MongoDB credentials or JWT secret publicly.
- Keep Razorpay in Test Mode during development.

### 4. Start the backend

From the `backend` directory, run:

```bash
npm run dev
```

If the project does not define a `dev` script, check `backend/package.json` for the available start command.

### 5. Install frontend dependencies

Open a second terminal from the project root:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal, commonly:

```text
http://localhost:5173
```

## 💳 Payment Testing

To test the Razorpay integration:

1. Configure valid Razorpay Test Mode credentials in `backend/.env`.
2. Start both the backend and frontend.
3. Log in to ShopKart.
4. Add a product to your cart.
5. Open checkout and enter your shipping details.
6. Click **Pay with Razorpay**.
7. Complete a supported test payment using Razorpay's official test credentials.
8. Confirm that the backend verifies the payment before marking the order as paid.

Use the current test payment details and instructions in the [official Razorpay documentation](https://razorpay.com/docs/payments/).

## 🔐 Security

ShopKart uses security practices intended to protect user accounts and payment processing:

- Password hashing
- JWT-based authentication
- HTTP-only cookies where configured
- Protected backend routes
- Server-side payment signature verification
- Environment variables for sensitive credentials

Payment status must be determined by trusted backend verification, not solely by a frontend callback.

## 🛠️ Future Improvements

Potential improvements include:

- Admin dashboard for product and order management
- Product reviews and ratings
- Pagination and improved product discovery
- Order tracking and delivery updates
- Email notifications
- Inventory management
- Deployment with production-grade monitoring

## 🎯 Project Objective

The objective of ShopKart is to demonstrate the development of a full-stack e-commerce application using modern JavaScript technologies, with particular emphasis on authentication, REST APIs, database integration, cart and order workflows, and secure payment processing.

## 👩‍💻 Author

**Praveda**

GitHub: [Your GitHub Profile](https://github.com/)

---

⭐ If you find this project useful, consider giving the repository a star.
