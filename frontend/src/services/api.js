import axios from "axios";

// Use the Vite proxy by default so API cookies stay on the frontend origin.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRITICAL: Ensures HttpOnly cookies (JWT) are sent & received
  headers: {
    "Content-Type": "application/json",
  },
});

// Customer Authentication APIs (Lab 01 & 02)
export const registerCustomer = async (customerData) => {
  const response = await api.post("/customers/register", customerData);
  return response.data;
};

export const loginCustomer = async (credentials) => {
  const response = await api.post("/customers/login", credentials);
  return response.data;
};

export const getMyProfile = async () => {
  const response = await api.get("/customers/me");
  return response.data;
};

export const logoutCustomer = async () => {
  const response = await api.post("/customers/logout");
  return response.data;
};

export const changeCustomerPassword = async (passwords) => {
  const response = await api.patch("/customers/change-password", passwords);
  return response.data;
};

// Product Catalog & Discovery APIs (Lab 03)
export const getProducts = async (params = {}) => {
  // params can contain: { search, category, sort }
  const cleanParams = {};
  if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
  if (params.category && params.category !== "All Categories" && params.category.toLowerCase() !== "all") {
    cleanParams.category = params.category;
  }
  if (params.sort) cleanParams.sort = params.sort;

  const response = await api.get("/products", { params: cleanParams });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post("/products", productData);
  return response.data;
};

// Wishlist APIs (Lab 04)
export const addToWishlist = async (productId) => {
  const response = await api.post(`/wishlist/${productId}`);
  return response.data;
};

export const getWishlist = async () => {
  const response = await api.get("/wishlist");
  return response.data;
};

export const removeFromWishlist = async (productId) => {
  const response = await api.delete(`/wishlist/${productId}`);
  return response.data;
};

// Bonus (+10 Marks): Wishlist Toggle API
export const toggleWishlist = async (productId) => {
  const response = await api.patch(`/wishlist/${productId}/toggle`);
  return response.data;
};

// Shopping Cart APIs (Lab 05)
export const addToCart = async (productId) => {
  const response = await api.post(`/cart/${productId}`);
  return response.data;
};

export const getCart = async () => {
  const response = await api.get("/cart");
  return response.data;
};

export const updateCartQuantity = async (productId, quantity) => {
  const response = await api.patch(`/cart/${productId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
};

// Checkout & Order APIs (Lab 06)
export const createPaymentOrder = async (shippingAddress, idempotencyKey) => {
  const response = await api.post("/orders/create-payment-order", {
    shippingAddress,
    idempotencyKey,
  });
  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await api.post("/orders/verify-payment", paymentData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get("/orders");
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

export default api;
