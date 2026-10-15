import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartQuantity as apiUpdateQuantity,
  removeFromCart as apiRemoveFromCart
} from "../services/api";

const CartContext = createContext(null);

export const CartProvider = ({ children, user }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch cart when authenticated user changes
  const fetchCart = async () => {
    if (!user) {
      setCart([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getCart();
      if (data && data.success) {
        setCart(data.cart || []);
      }
    } catch (err) {
      console.error("CartContext fetch error:", err);
      // If 401 unauthenticated, clear cart
      if (err.response?.status === 401) {
        setCart([]);
      } else {
        setError("Unable to load your cart.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // Action: Add product to cart
  const addToCart = async (productId) => {
    setError("");
    try {
      const data = await apiAddToCart(productId);
      if (data && data.success) {
        setCart(data.cart || []);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add product to cart";
      setError(msg);
      throw err;
    }
  };

  // Action: Update quantity
  const updateQuantity = async (productId, quantity) => {
    setError("");
    try {
      const data = await apiUpdateQuantity(productId, quantity);
      if (data && data.success) {
        setCart(data.cart || []);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update quantity";
      setError(msg);
      throw err;
    }
  };

  // Action: Remove product from cart
  const removeFromCart = async (productId) => {
    setError("");
    try {
      const data = await apiRemoveFromCart(productId);
      if (data && data.success) {
        setCart(data.cart || []);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to remove product";
      setError(msg);
      throw err;
    }
  };

  // Action: Clear cart after successful order payment
  const clearCart = () => {
    setCart([]);
    setError("");
  };

  // Derived Values (Section 15)
  const totalUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * (item.quantity || 0);
    }, 0);
  }, [cart]);

  const itemCount = cart.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        totalUnits,
        subtotal,
        itemCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
