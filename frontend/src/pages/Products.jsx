import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, PackageSearch, RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { getProducts } from "../services/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search, Category, and Sorting States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSort, setSelectedSort] = useState("");

  const fetchProductList = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProducts({
        search: searchTerm,
        category: selectedCategory,
        sort: selectedSort,
      });

      if (data && data.success) {
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Something went wrong while loading products.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when category or sort changes, or with a debounce when typing search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductList();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedSort]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedSort("");
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Header Banner */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
            <Sparkles size={13} /> Official ShopKart Catalog
          </span>
        </div>
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}
        >
          Explore Products
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Browse our curated selection of premium electronics, fashion, books, and home essentials.
        </p>
      </div>

      {/* Search, Filter, and Sort Toolbar */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        totalResults={products.length}
      />

      {/* 1. LOADING STATE */}
      {loading && (
        <div
          id="products-loading-state"
          className="glass-card"
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
          }}
        >
          <div className="spinner" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px" }} />
          <p style={{ color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 600 }}>
            Loading products...
          </p>
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>
            Fetching latest items from ShopKart catalog
          </p>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div
          id="products-error-state"
          className="glass-card"
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            borderColor: "rgba(239, 68, 68, 0.3)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(239, 68, 68, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Something went wrong while loading products.</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "450px" }}>
            We could not connect to the product service. Please verify the backend is running and try again.
          </p>
          <button
            onClick={fetchProductList}
            className="btn-outline"
            style={{ marginTop: "0.5rem" }}
          >
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {!loading && !error && products.length === 0 && (
        <div
          id="products-empty-state"
          className="glass-card"
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#818cf8",
            }}
          >
            <PackageSearch size={30} />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>No products found.</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem", maxWidth: "420px" }}>
            No products matched your current search and filter criteria. Try adjusting your query or resetting filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="btn-primary"
            style={{ width: "auto", padding: "0.6rem 1.5rem", marginTop: "0.5rem" }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 4. SUCCESS: DYNAMIC PRODUCT GRID (.map()) */}
      {!loading && !error && products.length > 0 && (
        <div
          id="products-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.75rem",
          }}
        >
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
