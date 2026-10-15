import React from "react";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";

const categories = [
  "All Categories",
  "Electronics",
  "Fashion",
  "Books",
  "Home"
];

const sortOptions = [
  { label: "Default Sorting", value: "" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" }
];

const SearchBar = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSort,
  setSelectedSort,
  totalResults
}) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: "1.25rem 1.5rem",
        marginBottom: "2rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      {/* Search Input Box */}
      <div
        style={{
          position: "relative",
          flex: "1 1 280px",
          minWidth: "240px",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-dim)",
            pointerEvents: "none",
          }}
        />
        <input
          id="product-search-input"
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{
            paddingLeft: "2.75rem",
            paddingRight: searchTerm ? "2.5rem" : "1rem",
            borderRadius: "10px",
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.2rem",
            }}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.85rem",
        }}
      >
        {/* Category Dropdown */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Filter
            size={16}
            style={{
              position: "absolute",
              left: "0.85rem",
              color: "#818cf8",
              pointerEvents: "none",
            }}
          />
          <select
            id="category-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              background: "var(--bg-input)",
              color: "var(--text-main)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "0.72rem 2.2rem 0.72rem 2.4rem",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} style={{ background: "#0f172a", color: "#f8fafc" }}>
                {cat}
              </option>
            ))}
          </select>
          <span
            style={{
              position: "absolute",
              right: "0.85rem",
              pointerEvents: "none",
              color: "var(--text-dim)",
              fontSize: "0.75rem",
            }}
          >
            ▼
          </span>
        </div>

        {/* Bonus Challenge: Price Sort Dropdown */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <ArrowUpDown
            size={16}
            style={{
              position: "absolute",
              left: "0.85rem",
              color: "#06b6d4",
              pointerEvents: "none",
            }}
          />
          <select
            id="sort-filter-select"
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              background: "var(--bg-input)",
              color: "var(--text-main)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "0.72rem 2.2rem 0.72rem 2.4rem",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: "#0f172a", color: "#f8fafc" }}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            style={{
              position: "absolute",
              right: "0.85rem",
              pointerEvents: "none",
              color: "var(--text-dim)",
              fontSize: "0.75rem",
            }}
          >
            ▼
          </span>
        </div>

        {/* Total Results Count Badge */}
        {totalResults !== undefined && (
          <span
            style={{
              fontSize: "0.825rem",
              color: "var(--text-muted)",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "0.4rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {totalResults} {totalResults === 1 ? "product" : "products"}
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
