import React, { useState } from "react";
import { Link } from "react-router-dom";

const Products = ({ products = [], addToCart = () => {} }) => {
  const [selected, setSelected] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [zoomed, setZoomed] = useState(false); // 🔹 new state for zoom toggle

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src =
      "https://via.placeholder.com/400x400?text=Image+Not+Available";
  };

  // ✅ Utility to always prepend /images if missing
  const resolveImagePath = (img) => {
    if (!img) return "";
    return img.startsWith("/images/") ? img : `/images/${img}`;
  };

  const TopNav = () => (
    <>
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
            🎁 Free Shipping on orders above Rs. 5000 &nbsp;|&nbsp; 🎉 Free Gifts
            on orders above Rs. 1000 &nbsp;|&nbsp; 💸 5% discount on your next
            purchase
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
          <Link to="/" style={{ textDecoration: "none", color: "#000" }}>
            Home
          </Link>
          <Link to="/products" style={{ textDecoration: "none", color: "#000" }}>
            Catalogue
          </Link>
          <Link to="/checkout" style={{ textDecoration: "none", color: "#000" }}>
            Checkout
          </Link>
          <Link to="/policies" style={{ textDecoration: "none", color: "#000" }}>
            Policies
          </Link>
          <Link to="/contact" style={{ textDecoration: "none", color: "#000" }}>
            Contact
          </Link>
        </div>
      </nav>
    </>
  );

  if (selected) {
    const validImages =
      (selected.images || []).filter((img) => img && img.trim() !== "") || [];
    const defaultMain = resolveImagePath(validImages[0] || "");
    const displayMain = mainImage || defaultMain;

    return (
      <div style={{ padding: "2rem" }}>
        <TopNav />
        <button onClick={() => setSelected(null)} style={{ marginBottom: "1rem" }}>
          ← Back
        </button>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            {displayMain ? (
              <div
                style={{
                  width: "400px",
                  height: "400px",
                  borderRadius: "12px",
                  border: "1px solid #ccc",
                  overflow: zoomed ? "scroll" : "hidden",
                  cursor: zoomed ? "zoom-out" : "zoom-in",
                }}
                onClick={() => setZoomed(!zoomed)}
              >
                <img
                  src={displayMain}
                  alt={selected.name}
                  onError={handleImageError}
                  style={{
                    width: zoomed ? "800px" : "100%",
                    height: zoomed ? "auto" : "100%",
                    objectFit: zoomed ? "contain" : "cover",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "400px",
                  height: "400px",
                  background: "#eee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  border: "1px solid #ccc",
                  color: "#999",
                }}
              >
                No Image
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "1rem",
                flexWrap: "wrap",
              }}
            >
              {validImages.map((img, idx) => {
                const thumb = resolveImagePath(img);
                return (
                  <img
                    key={idx}
                    src={thumb}
                    alt={`thumb-${idx}`}
                    onError={handleImageError}
                    width="80"
                    style={{
                      cursor: "pointer",
                      border:
                        displayMain === thumb ? "2px solid #333" : "1px solid #ccc",
                      borderRadius: "8px",
                    }}
                    onClick={() => {
                      setMainImage(thumb);
                      setZoomed(false);
                    }}
                  />
                );
              })}
            </div>
          </div>
          <div style={{ maxWidth: "400px" }}>
            <h2>{selected.name}</h2>
            <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
              Rs {selected.price}
            </p>
            <p>{selected.desc}</p>
            <button
              disabled={selected.soldOut}
              onClick={() => {
                addToCart(selected);
                alert("Added to cart!");
              }}
              style={{
                padding: "0.6rem 1.2rem",
                marginTop: "1rem",
                fontSize: "1rem",
                backgroundColor: selected.soldOut ? "#ccc" : "#333",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: selected.soldOut ? "not-allowed" : "pointer",
              }}
            >
              {selected.soldOut ? "❌ Unavailable" : "➕ Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <TopNav />
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>🛍️ Products</h2>
      {products.length === 0 ? (
        <p>No products added yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {products.map((p, idx) => {
            const imgSrc =
              p.images?.find((img) => img && img.trim() !== "") || "";
            const finalImage = resolveImagePath(imgSrc);

            return (
              <div
                key={idx}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  border: "1px solid #ccc",
                  borderRadius: "12px",
                  padding: "1rem",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  transition: "transform 0.2s",
                }}
                onClick={() => {
                  setSelected(p);
                  setMainImage(finalImage);
                  setZoomed(false);
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                {finalImage ? (
                  <img
                    src={finalImage}
                    alt={p.name}
                    onError={handleImageError}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      marginBottom: "0.5rem",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      background: "#eee",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                      marginBottom: "0.5rem",
                    }}
                  >
                    No Image
                  </div>
                )}
                <h4 style={{ margin: "0.5rem 0" }}>
                  {p.name}{" "}
                  {p.soldOut && <span style={{ color: "red" }}>(Sold Out)</span>}
                </h4>
                <p style={{ fontWeight: "bold" }}>Rs {p.price}</p>
                <button
                  disabled={p.soldOut}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p);
                    alert("Added to cart!");
                  }}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: p.soldOut ? "#ccc" : "#333",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: p.soldOut ? "not-allowed" : "pointer",
                    marginTop: "auto",
                  }}
                >
                  {p.soldOut ? "❌ Unavailable" : "➕ Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
