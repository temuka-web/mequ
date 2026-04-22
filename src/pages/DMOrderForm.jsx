// src/pages/DMOrderForm.jsx
import React, { useState } from "react";
import { supabase } from "../supabase";

export default function DMOrderForm() {
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const orderId = "DM-" + Date.now();
    const dmOrder = {
      order_id: orderId,
      name: form.name,
      phone: form.phone,
      city: form.city,
      address: form.address,
      logistics_status: "processing",
    };

    try {
      const { data, error } = await supabase.from("dm_orders").insert([dmOrder]).select().single();
      if (error) throw error;
      setConfirmed(data || dmOrder);
      setForm({ name: "", phone: "", city: "", address: "" });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem 1rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 520,
        margin: "0 auto",
      }}>
        {/* Checkmark Animation — same style as Payment page */}
        <style>{`
          .check-icon-wrap {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6b21a8, #db2777);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.2rem;
            box-shadow: 0 4px 20px rgba(107,33,168,0.35);
            animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
          }
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .check-icon-wrap svg {
            animation: drawCheck 0.5s ease 0.3s both;
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
          }
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
        `}</style>

        <div className="check-icon-wrap">
          <svg width="38" height="38" viewBox="0 0 52 52" fill="none"
            stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="14,27 22,36 38,18" />
          </svg>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 4px 30px rgba(0,0,0,0.10)",
          overflow: "hidden",
          width: "100%",
        }}>
          {/* Header */}
          <div style={{ padding: "1.5rem 1.5rem 1.2rem" }}>
            <h2 style={{ margin: "0 0 0.3rem", fontSize: "1.3rem", fontWeight: 800, color: "#111" }}>
              Thank you for placing your order with <span style={{ background: "linear-gradient(135deg,#6b21a8,#db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MEQU</span> 🎉
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "0.88rem" }}>
              Your order has been received and is being processed.
            </p>
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg,#6b21a8,#db2777)", margin: "0 1.5rem" }} />

          {/* Tracking ID Block */}
          <div style={{ padding: "1.2rem 1.5rem 0" }}>
            <div style={{
              background: "linear-gradient(135deg, #6b21a8 0%, #db2777 100%)",
              borderRadius: 12,
              padding: "1.2rem 1.5rem",
              color: "#fff",
              textAlign: "center",
            }}>
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.82rem", opacity: 0.85 }}>🔖 Your Order ID</p>
              <p style={{ margin: "0 0 0.5rem", fontSize: "1.7rem", fontWeight: 800, letterSpacing: "0.08em", fontFamily: "monospace" }}>
                {confirmed.order_id}
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.85 }}>
                📸 Screenshot this ID! Use it to track your order status anytime.
              </p>
            </div>
          </div>

          {/* Notice rows */}
          <div style={{ padding: "1.2rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              background: "#f0fdf4", borderRadius: 10, padding: "0.85rem 1rem",
            }}>
              <span style={{ fontSize: "1.1rem", marginTop: 1 }}>✅</span>
              <p style={{ margin: 0, fontSize: "0.87rem", color: "#166534", lineHeight: 1.5 }}>
                Your order is <strong>confirmed!</strong> We'll get it packed and on its way to you.
              </p>
            </div>

            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              background: "#f0f9ff", borderRadius: 10, padding: "0.85rem 1rem",
            }}>
              <span style={{ fontSize: "1.1rem", marginTop: 1 }}>🏠</span>
              <p style={{ margin: 0, fontSize: "0.87rem", color: "#0c4a6e", lineHeight: 1.5 }}>
                Please ensure <strong>someone is present at the address</strong> to receive the package.
              </p>
            </div>

            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              background: "#fff7ed", borderRadius: 10, padding: "0.85rem 1rem",
              border: "1px solid #fed7aa",
            }}>
              <span style={{ fontSize: "1.1rem", marginTop: 1 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: "0.87rem", color: "#92400e", lineHeight: 1.5 }}>
                We <strong>prepay all orders</strong> — if the delivery fails, we incur a loss. Your cooperation means a lot!
              </p>
            </div>

            <button
              onClick={() => setConfirmed(null)}
              style={{
                marginTop: "0.4rem",
                width: "100%",
                padding: "0.85rem",
                background: "linear-gradient(135deg, #6b21a8, #db2777)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: 500, margin: "50px auto", padding: "0 1rem",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "2rem",
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem", color: "#111" }}>📦 DM Order Form</h2>

        <form onSubmit={handleSubmit}>
          {[
            { name: "name",  label: "Full Name *",    placeholder: "Enter your full name", type: "text" },
            { name: "phone", label: "Phone Number *", placeholder: "03001234567",          type: "text" },
            { name: "city",  label: "City *",         placeholder: "e.g. Karachi",         type: "text" },
          ].map(f => (
            <div key={f.name} style={{ marginBottom: "1.1rem" }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: "0.9rem" }}>{f.label}</label>
              <input
                name={f.name}
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handleChange}
                required
                style={{
                  width: "100%", padding: "0.75rem", fontSize: "1rem",
                  border: "1.5px solid #e5e7eb", borderRadius: 8,
                  boxSizing: "border-box", outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#9333ea"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
          ))}

          <div style={{ marginBottom: "1.4rem" }}>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: "0.9rem" }}>Full Address *</label>
            <textarea
              name="address"
              placeholder="House/Flat no, Street, Area, City"
              value={form.address}
              onChange={handleChange}
              required
              rows={4}
              style={{
                width: "100%", padding: "0.75rem", fontSize: "1rem",
                border: "1.5px solid #e5e7eb", borderRadius: 8,
                boxSizing: "border-box", resize: "vertical", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#9333ea"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "0.85rem", fontSize: "1rem",
              fontWeight: 700, border: "none", borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#d1d5db" : "linear-gradient(135deg, #6b21a8, #db2777)",
              color: "#fff", transition: "opacity 0.2s",
            }}
          >
            {loading ? "Submitting…" : "Submit Order"}
          </button>
        </form>
      </div>
    </div>
  );
}