// src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "./Checkout.css";

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Checkout = ({ cart, updateCart, clearCart }) => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState(() => cart.map((_, i) => i));
  const [productsStock, setProductsStock] = useState({});
  const [processingOrder, setProcessingOrder] = useState(false);

  const collectParentIds = () => {
    return Array.from(
      new Set(
        cart
          .map((item) =>
            item.parentId ??
            (typeof item.id === "string" ? item.id.split("::")[0] : item.id)
          )
          .filter(Boolean)
      )
    );
  };

  const fetchStock = async () => {
    try {
      const productIds = collectParentIds();
      if (productIds.length === 0) {
        setProductsStock({});
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, totalQuantity, soldOut, colors")
        .in("id", productIds);

      if (error) {
        console.error("Stock fetch error:", error);
        return;
      }

      const stockMap = {};
      (data || []).forEach((p) => {
        stockMap[p.id] = {
          totalQuantity: Number(p.totalQuantity || 0),
          soldOut: !!p.soldOut,
          colors: Array.isArray(p.colors) ? p.colors : [],
          raw: p,
        };
      });
      setProductsStock(stockMap);
    } catch (err) {
      console.error("fetchStock error:", err);
    }
  };

  useEffect(() => {
    fetchStock();
    const interval = setInterval(fetchStock, 5000);
    return () => clearInterval(interval);
  }, [cart]);

  const getItemStock = (item) => {
    const parentId =
      item.parentId ??
      (typeof item.id === "string" ? item.id.split("::")[0] : item.id);
    const stockData = productsStock[parentId];
    if (!stockData) return 0;

    if (typeof item.variantIndex === "number") {
      const v = stockData.colors?.[item.variantIndex];
      if (!v) return Math.max(0, Number(stockData.totalQuantity || 0));
      return Math.max(0, Number(v.qty ?? v.quantity ?? 0));
    }

    return Math.max(0, Number(stockData.totalQuantity || 0));
  };

  const displayName = (item) => (item.variantName ? `${item.name}` : item.name || "");
  const displayImage = (item) => {
    if (item.variantImage) return item.variantImage;
    if (item.selectedImage) return item.selectedImage;
    if (item.image) return item.image;
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    return "";
  };
  const displayPrice = (item) => Number(item.price || 0);

  const toggleSelect = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const changeQuantity = (index, delta) => {
    const newCart = [...cart];
    const item = newCart[index];
    const stock = getItemStock(item);

    let newQty = (item.quantity || 1) + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > stock) newQty = stock;

    item.quantity = newQty;
    updateCart(newCart);
  };

  const deleteItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    updateCart(newCart);
    setSelectedItems((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
  };

  const subtotal = cart.reduce((sum, item, index) => {
    if (!selectedItems.includes(index)) return sum;
    const price = displayPrice(item);
    const stock = getItemStock(item);
    const qty = Math.min(item.quantity || 1, Math.max(0, stock));
    return sum + price * qty;
  }, 0);

  const giftThreshold = 3000;
  const giftProgress = Math.min((subtotal / giftThreshold) * 100, 100);
  const qualifiedForGift = subtotal >= giftThreshold;

  return (
    <div
      className="checkout-container"
      style={{ backgroundColor: "#fffdf4", minHeight: "100vh", padding: "1rem" }}
    >
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
        ← Back
      </button>
      <h2 className="checkout-title">💳 Checkout</h2>

      {/* 🎁 Free Gift Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div>
          <p style={{ marginBottom: "0.5rem", fontWeight: "500" }}>
            🎁 Free Gift Progress (Rs {giftThreshold.toLocaleString()})
          </p>
          <div
            style={{
              height: "14px",
              backgroundColor: "#ddd",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                width: `${giftProgress}%`,
                background:
                  "linear-gradient(90deg, rgba(255,182,193,0.5), rgba(255,223,186,0.5), rgba(255,255,204,0.5), rgba(204,255,204,0.5), rgba(204,229,255,0.5), rgba(221,160,221,0.5))",
                height: "100%",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          {qualifiedForGift && (
            <p style={{ color: "#16a34a", marginTop: "8px", fontWeight: "600", animation: "fadeIn 0.5s" }}>
              🌟 Congratulations! You've qualified for a free gift!
            </p>
          )}
          {!qualifiedForGift && subtotal > 0 && (
            <p style={{ color: "#6b7280", marginTop: "8px", fontSize: "0.9rem" }}>
              Add Rs {(giftThreshold - subtotal).toLocaleString()} more to unlock your free gift!
            </p>
          )}
        </div>
      </div>

      {/* 🛒 Cart Section */}
      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <div>
          {cart.map((item, index) => {
            const name = displayName(item);
            const img = displayImage(item);
            const price = displayPrice(item);
            const stock = getItemStock(item);
            const soldOut = stock <= 0;

            return (
              <div
                key={item.uniqueKey || index}
                className="checkout-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem 0",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(index)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelect(index);
                  }}
                  style={{ cursor: "pointer", width: "18px", height: "18px" }}
                />

                {img && (
                  <img
                    src={img}
                    alt={name}
                    width="60"
                    height="60"
                    style={{
                      borderRadius: "6px",
                      objectFit: "cover",
                      border: "1px solid #ddd",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/60x60?text=No+Image";
                    }}
                  />
                )}

                <div
                  onClick={() =>
                    navigate("/products", {
                      state: {
                        selectedProduct: item.parentId,
                        selectedVariantIndex: item.variantIndex ?? null,
                      },
                    })
                  }
                  style={{ flex: 1, cursor: "pointer" }}
                >
                  <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>
                    {name} {soldOut && <span style={{ color: "#dc2626" }}>(Sold Out)</span>}
                  </h4>
                  <p style={{ margin: "0.25rem 0", color: "#555", fontWeight: "500" }}>
                    Rs {price.toLocaleString()}
                  </p>

                  <div
                    className="quantity-controls"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <button
                      disabled={soldOut}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeQuantity(index, -1);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        background: soldOut ? "#e5e5e5" : "#fff",
                        cursor: soldOut ? "not-allowed" : "pointer",
                        fontSize: "1rem",
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: "30px", textAlign: "center", fontWeight: "500" }}>
                      {Math.min(item.quantity || 1, stock)}
                    </span>
                    <button
                      disabled={soldOut}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeQuantity(index, 1);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        background: soldOut ? "#e5e5e5" : "#fff",
                        cursor: soldOut ? "not-allowed" : "pointer",
                        fontSize: "1rem",
                      }}
                    >
                      +
                    </button>
                  </div>

                  {stock > 0 && stock <= 7 && (
                    <p style={{ color: "#b45309", marginTop: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                      ⚠️ Only {stock} left in stock!
                    </p>
                  )}
                  {soldOut && (
                    <p style={{ color: "#dc2626", marginTop: "0.5rem", fontWeight: "500" }}>
                      Out of stock
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(index);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    fontSize: "1.3rem",
                    cursor: "pointer",
                    padding: "0.25rem",
                  }}
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>
            );
          })}

          {/* 💰 Summary */}
          <div className="checkout-summary" style={{ marginTop: "1.5rem", paddingTop: "1rem" }}>
            <p style={{ fontSize: "1.1rem", margin: "0.4rem 0" }}>
              Subtotal: <strong>Rs {subtotal.toLocaleString()}</strong>
            </p>
            <h3 style={{ fontSize: "1.4rem", marginTop: "0.8rem", color: "#111" }}>
              Total: Rs {subtotal.toLocaleString()}
            </h3>
          </div>

          {/* ✅ Proceed to Pay Button */}
          <button
            className="pay-button"
            disabled={selectedItems.length === 0 || subtotal === 0}
            onClick={() =>
              navigate("/payment", {
                state: { total: subtotal, items: selectedItems.map((i) => cart[i]) },
              })
            }
            style={{
              marginTop: "1.5rem",
              padding: "0.9rem 1.5rem",
              background: selectedItems.length === 0 || subtotal === 0 ? "#aaa" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.05rem",
              fontWeight: "600",
              cursor:
                selectedItems.length === 0 || subtotal === 0
                  ? "not-allowed"
                  : "pointer",
              transition: "background-color 0.3s ease",
            }}
          >
            💰 Proceed to submit order 
          </button>
        </div>
      )}
    </div>
  );
};

export default Checkout;