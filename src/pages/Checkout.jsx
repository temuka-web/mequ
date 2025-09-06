import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

const Checkout = ({ cart, updateCart }) => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState(() => cart.map((_, i) => i));

  // Toggle select
  const toggleSelect = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // Change quantity
  const changeQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = (newCart[index].quantity || 1) + delta;
    if (newCart[index].quantity < 1) newCart[index].quantity = 1;
    updateCart(newCart);
  };

  // Calculate subtotal only for selected items (without delivery)
  const subtotal = cart.reduce((sum, item, index) => {
    if (selectedItems.includes(index)) return sum + Number(item.price) * (item.quantity || 1);
    return sum;
  }, 0);

  const deliveryCharges = selectedItems.length > 0 ? 250 : 0;
  const total = subtotal + deliveryCharges;

  // Progress logic (only based on subtotal, not delivery charges)
  const giftThreshold = 1000;
  const deliveryThreshold = 5000;
  const giftProgress = Math.min((subtotal / giftThreshold) * 100, 100);
  const deliveryProgress = Math.min((subtotal / deliveryThreshold) * 100, 100);
  const qualifiedForGift = subtotal >= giftThreshold;
  const qualifiedForDelivery = subtotal >= deliveryThreshold;

  return (
    <div className="checkout-container" style={{ backgroundColor: "#fffdf4", minHeight: "100vh", padding: "1rem" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>← Back</button>
      <h2 className="checkout-title">💳 Checkout</h2>

      {/* Rewards Progress Meters */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.3rem" }}>🎁 Free Gift Progress (Rs {giftThreshold})</p>
          <div style={{
            height: "12px",
            backgroundColor: "#ddd",
            borderRadius: "6px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${giftProgress}%`,
              backgroundColor: "#90ee90",
              height: "100%",
              transition: "width 0.4s ease"
            }}></div>
          </div>
          {qualifiedForGift && (
            <p
              style={{
                color: "green",
                marginTop: "0.5rem",
                animation: "fadeIn 0.5s ease-in-out"
              }}
            >
              🎉 Congrats! You qualified for a free gift!
            </p>
          )}
        </div>

        <div>
          <p style={{ marginBottom: "0.3rem" }}>🚚 Free Delivery Progress (Rs {deliveryThreshold})</p>
          <div style={{
            height: "12px",
            backgroundColor: "#ddd",
            borderRadius: "6px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${deliveryProgress}%`,
              backgroundColor: "#add8e6",
              height: "100%",
              transition: "width 0.4s ease"
            }}></div>
          </div>
          {qualifiedForDelivery && (
            <p
              style={{
                color: "blue",
                marginTop: "0.5rem",
                animation: "fadeIn 0.5s ease-in-out"
              }}
            >
              🚀 Congrats! You qualified for free delivery!
            </p>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <div>
          {cart.map((item, index) => (
            <div
              key={index}
              className="checkout-item"
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.5rem 0"
              }}
              onClick={() =>
                navigate("/products", { state: { selectedProduct: item.id } })
              }
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(index)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelect(index);
                }}
                onClick={(e) => e.stopPropagation()}
                className="select-circle"
              />
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>Rs {item.price}</p>
                <div className="quantity-controls">
                  <button onClick={(e) => { e.stopPropagation(); changeQuantity(index, -1); }}>-</button>
                  <span>{item.quantity || 1}</span>
                  <button onClick={(e) => { e.stopPropagation(); changeQuantity(index, 1); }}>+</button>
                </div>
              </div>
            </div>
          ))}

          <div className="checkout-summary">
            <p>Subtotal: Rs {subtotal}</p>
            <p>Delivery Charges: Rs {deliveryCharges}</p>
            <h3>Total: Rs {total}</h3>
          </div>

          <button
            className="pay-button"
            disabled={selectedItems.length === 0}
            onClick={() =>
              navigate("/payment", { state: { total, items: selectedItems.map(i => cart[i]) } })
            }
          >
            💰 Proceed to Pay
          </button>
        </div>
      )}
    </div>
  );
};

export default Checkout;
