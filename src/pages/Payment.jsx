// src/pages/Payment.jsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import "./Payment.css";

const generateOrderId = () => "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

const Payment = () => {
  const location = useLocation();

  const passedItems = location.state?.items || [];
  const passedTotal = location.state?.total || 0;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postal: "",
    country: "",
    notes: "",
    method: "COD",
  });

  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState("");

  const subtotal = passedItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  const smallOrderThreshold = 700;
  const deliveryCharges = subtotal <= smallOrderThreshold ? 150 : 250;
  const isSmallOrder = subtotal <= smallOrderThreshold;
  const codTax = form.method === "COD" ? 75 : 0;
  const total = subtotal + deliveryCharges;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleMethodChange = (method) => {
    setForm({ ...form, method });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErrorMsg("⚠️ Please fill your name."); return; }
    if (!form.phone.trim()) { setErrorMsg("⚠️ Please fill your phone number."); return; }
    if (!form.street.trim()) { setErrorMsg("⚠️ Please fill your address."); return; }

    if (passedItems.length === 0) {
      setErrorMsg("⚠️ No items in order. Please go back and select items.");
      return;
    }

    try {
      const newOrderId = generateOrderId();

      const itemsWithQuantity = passedItems.map((item) => ({
        ...item,
        quantity: item.quantity || 1,
      }));

      const order = {
        customer_name:    form.name || "",
        customer_email:   form.email || "",
        customer_phone:   form.phone || "",
        street_address:   form.street || "",
        city:             form.city || "",
        postal_code:      form.postal || "",
        country:          form.country || "",
        additional_notes: form.notes || "",
        payment_method:   form.method,
        items:            itemsWithQuantity,
        total,
        delivery_charges: deliveryCharges,
        status:           "pending",
        name:             form.name || "",
        phone:            form.phone || "",
        address:          `${form.street}, ${form.city}`,
        temp_tracking_id: newOrderId,
        tracking_id:      null,
        logistics_status: "processing",
      };

      const { data: insertedOrder, error } = await supabase
        .from("orders")
        .insert([order])
        .select()
        .single();

      if (error) {
        console.error("❌ Error submitting order:", error);
        setErrorMsg("❌ Failed to submit order. Please try again.");
        return;
      }

      setOrderId(newOrderId);

      // ── Update stock (non-fatal — never blocks order) ──
      try {
        for (const item of itemsWithQuantity) {
          try {
            const { data: product, error: fetchErr } = await supabase
              .from("products")
              .select("id, totalQuantity, soldOut, colors")
              .eq("id", item.parentId || item.id)
              .single();

            if (fetchErr) { console.error("Error fetching product:", fetchErr); continue; }

            let updated = { ...product };

            if (updated.colors && updated.colors.length > 0 && typeof item.variantIndex === "number") {
              const idx = item.variantIndex;
              const variant = updated.colors[idx];

              if (variant) {
                const currentQty = Number(variant.qty ?? variant.quantity ?? variant.stock ?? 0);
                updated.colors[idx] = { ...variant, qty: Math.max(0, currentQty - item.quantity) };
              } else {
                console.warn(`Variant at index ${idx} not found for product ${updated.id} — skipping stock update`);
              }

              if (updated.colors.every((c) => (c.qty ?? c.quantity ?? 0) <= 0)) updated.soldOut = true;
            } else {
              updated.totalQuantity = Math.max(0, (updated.totalQuantity ?? 0) - item.quantity);
              if (updated.totalQuantity <= 0) updated.soldOut = true;
            }

            if (updated.colors && updated.colors.length > 0) {
              updated.totalQuantity = updated.colors.reduce((sum, c) => sum + (c.qty ?? c.quantity ?? 0), 0);
              if (updated.totalQuantity <= 0) updated.soldOut = true;
            }

            const { error: updateErr } = await supabase
              .from("products")
              .update({ totalQuantity: updated.totalQuantity, soldOut: updated.soldOut, colors: updated.colors })
              .eq("id", updated.id);

            if (updateErr) console.error("Error updating stock:", updateErr);

          } catch (itemErr) {
            console.error("Stock update failed for item:", item?.id, itemErr);
            // continue to next item
          }
        }
      } catch (stockErr) {
        console.error("Stock update loop failed (non-fatal):", stockErr);
        // order is already saved — don't block
      }

      // ── WhatsApp notification ──
      try {
        const orderText = `
🛒 *New Order Received!*

👤 Name: ${form.name || "N/A"}
📞 Phone: ${form.phone || "N/A"}
📍 Address: ${form.street || ""}, ${form.city || ""}${form.country ? ", " + form.country : ""}
💳 Payment: ${form.method}
${codTax > 0 ? `🏛️ COD Tax (paid to delivery boy): Rs ${codTax}\n` : ""}💰 Order Total: Rs ${total}
${codTax > 0 ? `💵 Customer hands delivery boy: Rs ${total + codTax}` : ""}
🔖 Order ID: ${newOrderId}

Items:
${itemsWithQuantity.map((i) => `- ${i.name}${i.variantName ? ` (${i.variantName})` : ""} x ${i.quantity} = Rs ${i.price * i.quantity}`).join("\n")}

Notes: ${form.notes || "None"}
        `;
        await fetch("http://localhost:3000/send-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderDetails: orderText }),
        });
        console.log("✅ WhatsApp order sent!");
      } catch (err) {
        console.error("❌ WhatsApp send failed (non-fatal):", err);
      }

      // ── Pixel tracking ──
      try {
        if (window.trackPurchase) window.trackPurchase(total, "PKR");
        if (window.trackOrderSubmitted) window.trackOrderSubmitted(insertedOrder?.id || Date.now().toString());
      } catch (pixelErr) {
        console.error("❌ Pixel tracking error (non-fatal):", pixelErr);
      }

      setSubmitted(true);

    } catch (unexpectedErr) {
      console.error("❌ Unexpected error during order submission:", unexpectedErr);
      setErrorMsg("❌ Something went wrong. Please try again or contact support.");
    }
  };

  // ── Success screen ──
  if (submitted) {
    return (
      <div
        className="payment-container"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem 1rem" }}
      >
        <div className="success-checkmark">
          <div className="check-icon">
            <span className="icon-line line-tip"></span>
            <span className="icon-line line-long"></span>
            <div className="icon-circle"></div>
            <div className="icon-fix"></div>
          </div>
        </div>

        <div className="success-card">
          <h2 className="success-title">
            Thank you for placing your order with <span className="brand-name">MEQU</span> 🎉
          </h2>

          <div className="success-divider" />

          <div style={{
            background: "linear-gradient(135deg, #6b21a8 0%, #db2777 100%)",
            borderRadius: "12px", padding: "1.2rem 1.5rem", margin: "1rem 0", color: "#fff",
          }}>
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.85rem", opacity: 0.9 }}>🔖 Your Order ID</p>
            <p style={{ margin: "0 0 0.5rem", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "0.1em", fontFamily: "monospace" }}>
              {orderId}
            </p>
            <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.85 }}>
              📸 Screenshot this ID! Visit the <strong>Track Order</strong> page on our website to check your order status anytime.
            </p>
          </div>

          <div className="success-notice">
            <div className="notice-row">
              <span className="notice-icon">✅</span>
              <p>Your order is <strong>confirmed!</strong> We'll get it packed and on its way to you.</p>
            </div>
            <div className="notice-row">
              <span className="notice-icon">🏠</span>
              <p>Please ensure <strong>someone is present at the address provided</strong> to receive the package.</p>
            </div>
            <div className="notice-row notice-warning">
              <span className="notice-icon">⚠️</span>
              <p>We <strong>prepay all orders</strong> — if the delivery fails, we incur a loss. Your cooperation means a lot!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Guard: if someone lands on /payment directly with no items ──
  if (passedItems.length === 0) {
    return (
      <div className="payment-container" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <h2>🛒 No items selected</h2>
        <p style={{ color: "#555", marginTop: "1rem" }}>
          Please go back to your cart and select the items you'd like to order.
        </p>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="payment-container">
      <h2 className="payment-title">💳 Payment Page</h2>
      <p>Subtotal: Rs {subtotal.toLocaleString()}</p>
      <p>
        Delivery Charges: Rs {deliveryCharges}
        {isSmallOrder && (
          <span style={{ marginLeft: "0.6rem", fontSize: "0.8rem", color: "#2e7d32", background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "6px", padding: "0.2rem 0.5rem" }}>
            📦 Your order is small & light — you're being charged Rs 150 delivery instead of Rs 250!
          </span>
        )}
      </p>
      {codTax > 0 && (
        <div style={{ background: "#fff8e1", border: "1px solid #f0c040", borderRadius: "8px", padding: "0.6rem 1rem", margin: "0.4rem 0", fontSize: "0.9rem", color: "#7a5c00" }}>
          🏛️ <strong>COD Tax (Govt.): Rs {codTax}</strong><br />
          <span style={{ fontSize: "0.8rem" }}>Cash on Delivery is subject to a Rs 75 government tax — applicable across all major e-commerce platforms (Daraz, etc.)</span>
        </div>
      )}
      <h3>
        Total Amount: Rs {total.toLocaleString()}
        {codTax > 0 && (
          <span style={{ fontSize: "0.78rem", fontWeight: "normal", color: "#555", display: "block", marginTop: "0.3rem", lineHeight: "1.4" }}>
            (Rs 75 will be collected by the delivery boy — so you will hand them <strong>Rs {total + codTax}</strong>, of which Rs 75 goes to them as the govt. COD fee &amp; Rs {total} is your order payment)
          </span>
        )}
      </h3>

      {/* Order summary */}
      <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "0.8rem 1rem", margin: "1rem 0", border: "1px solid #eee" }}>
        <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>📋 Order Summary ({passedItems.length} item{passedItems.length !== 1 ? "s" : ""}):</p>
        {passedItems.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", padding: "0.25rem 0", borderBottom: i < passedItems.length - 1 ? "1px solid #eee" : "none" }}>
            <span>{item.name}{item.variantName ? ` (${item.variantName})` : ""} × {item.quantity || 1}</span>
            <span>Rs {(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: "1.5rem 0" }}>
        <label style={{ fontWeight: "bold" }}>Payment Method:</label>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button type="button" onClick={() => handleMethodChange("COD")} style={{ padding: "0.5rem 1rem", background: form.method === "COD" ? "#333" : "#ddd", color: form.method === "COD" ? "#fff" : "#000", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            💵 Cash on Delivery
          </button>
          <button type="button" onClick={() => handleMethodChange("Online")} style={{ padding: "0.5rem 1rem", background: form.method === "Online" ? "#333" : "#ddd", color: form.method === "Online" ? "#fff" : "#000", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            💳 Online Payment
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
        <input type="text"  name="name"    placeholder="Full Name *"       value={form.name}    onChange={handleChange} />
        <input type="email" name="email"   placeholder="Email"             value={form.email}   onChange={handleChange} />
        <input type="tel"   name="phone"   placeholder="Phone Number *"    value={form.phone}   onChange={handleChange} />
        <input type="text"  name="street"  placeholder="Street Address *"  value={form.street}  onChange={handleChange} />
        <input type="text"  name="city"    placeholder="City"              value={form.city}    onChange={handleChange} />
        <input type="text"  name="postal"  placeholder="Postal Code"       value={form.postal}  onChange={handleChange} />
        <input type="text"  name="country" placeholder="Country"           value={form.country} onChange={handleChange} />
        <textarea           name="notes"   placeholder="Additional Notes"  value={form.notes}   onChange={handleChange} />
      </div>

      {errorMsg && <p style={{ color: "red", marginTop: "1rem", fontWeight: "bold" }}>{errorMsg}</p>}

      <button onClick={handleSubmit} className="pay-now-button">
        🛒 Submit Order
      </button>
    </div>
  );
};

export default Payment;