import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import { CartProvider } from "./context/CartContext";
import { getMyProfile } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check authentication status on application mount
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const customer = await getMyProfile();
        if (isMounted) setUser(customer);
      } catch (err) {
        // Not logged in or invalid token
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  if (initialLoading) {
    return (
      <div className="page-wrapper" style={{ flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading ShopKart...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <CartProvider user={user}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <Navbar user={user} setUser={setUser} />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Registration Page */}
              <Route path="/register" element={<Register />} />

              {/* Login Page */}
              <Route path="/login" element={<Login setUser={setUser} />} />

              {/* Protected Home Page */}
              <Route path="/home" element={<Home user={user} setUser={setUser} />} />

              {/* Product Catalog & Discovery Routes (Lab 03) */}
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />

              {/* Wishlist Route (Lab 04) */}
              <Route path="/wishlist" element={<Wishlist />} />

              {/* Shopping Cart Route (Lab 05) */}
              <Route path="/cart" element={<Cart />} />

              {/* Checkout & Orders Routes (Lab 06) */}
              <Route path="/checkout" element={<Checkout user={user} />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/order-success/:id" element={<OrderDetails />} />

              {/* Default & Catch-all Redirects */}
              <Route path="/" element={<Navigate to={user ? "/home" : "/products"} replace />} />
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
          </main>
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
