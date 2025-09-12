import React, { useState } from "react";
import { Link } from "react-router-dom";

const Landing = ({ products = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search input
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show first 4 featured products if no search
  const featured = searchTerm ? filteredProducts : products.slice(0, 4);

  return (
    <div style={{ backgroundColor: "#fffdf4", minHeight: "100vh" }}>
      {/* 🔔 Scrolling Announcement Bar */}
      <div
        style={{
          width: "100%",
          backgroundColor: "#000",
          color: "#fff",
          overflow: "hidden",
          whiteSpace: "nowrap",
          fontWeight: "bold",
          padding: "10px 0",
          fontSize: "16px",
          position: "relative",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: "inline-block",
            paddingLeft: "100%",
            animation: "marquee 15s linear infinite",
          }}
        >
          <span>
            🎁 Free Shipping on all orders above Rs. 5000 &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            🎉 Free Gifts on all orders above Rs. 1000 &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            💸 5% Discount on your next purchase
          </span>
        </div>
      </div>

      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>

      {/* Navbar */}
      <nav
        style={{
          backgroundColor: "#eae7dc",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "center",
          borderBottom: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "2rem",
            fontWeight: "500",
            color: "#000",
            fontSize: "1.05rem",
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "#000" }}>Home</Link>
          <Link to="/products" style={{ textDecoration: "none", color: "#000" }}>Catalogue</Link>
          <Link to="/checkout" style={{ textDecoration: "none", color: "#000" }}>Checkout</Link>
          <Link to="/policies" style={{ textDecoration: "none", color: "#000" }}>Policies</Link>
          <Link to="/contact" style={{ textDecoration: "none", color: "#000" }}>Contact</Link>
        </div>
      </nav>

      {/* Search Bar (Top, below navbar) */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            width: "250px",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "3rem 2rem",
          position: "relative",
        }}
      >
        {/* Plane Icon Above Mequ */}
        <svg
          width="180"
          height="60"
          viewBox="0 0 180 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginBottom: "-40px" }}
        >
          <path d="M0,50 Q90,-20 180,50" stroke="#333" strokeWidth="2" fill="none" />
          <polygon points="175,48 180,50 175,52" fill="#333" />
        </svg>

        <h1 style={{ fontSize: "3.5rem", marginBottom: "1rem", color: "#000", position: "relative" }}>
          <span style={{ position: "relative", zIndex: 2 }}>Mequ</span>
        </h1>

        <p style={{ fontSize: "1.2rem", color: "#444" }}>“Where your money learns to stretch.”</p>
        <p style={{ marginTop: "1.5rem", fontSize: "1.1rem", color: "#666", maxWidth: "600px" }}>
          Unbeatable prices · Flash deals · Smoother & faster delivery · No extra tax · Imported products
        </p>

        {/* Featured / Search Results */}
        <div style={{ marginTop: "2rem", width: "100%", maxWidth: "900px" }}>
          {filteredProducts.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>No products found matching "{searchTerm}"</p>
          ) : (
            <>
              <h2>{searchTerm ? "🔍 Search Results" : "🌟 Featured Products"}</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1.5rem",
                  marginTop: "1rem",
                }}
              >
                {featured.map((p, i) => (
                  <Link
                    key={i}
                    to="/products"
                    style={{
                      textDecoration: "none",
                      color: "#000",
                      textAlign: "center",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "0.5rem",
                    }}
                  >
                    {p.images?.[0] && (
                      <img
                        src={`/images/${p.images[0].replace("/images/", "")}`}
                        alt={p.name}
                        style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                      />
                    )}
                    <h4 style={{ margin: "0.5rem 0 0 0" }}>{p.name}</h4>
                    <p style={{ fontWeight: "bold" }}>Rs {p.price}</p>
                  </Link>
                ))}
              </div>
              {!searchTerm && (
                <div style={{ marginTop: "1rem" }}>
                  <Link
                    to="/products"
                    style={{
                      textDecoration: "none",
                      color: "#fff",
                      backgroundColor: "#333",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                    }}
                  >
                    View Full Catalogue
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;
