// src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Trash2 } from "react-feather";

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23f3e8ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='9' fill='%23a78bca'%3ENo Img%3C/text%3E%3C/svg%3E`;

const LOGISTICS_COLORS = {
  processing: { bg: "#fef9c3", color: "#b45309", label: "Processing" },
  packed:     { bg: "#e0e7ff", color: "#3730a3", label: "Packed" },
  shipped:    { bg: "#d1fae5", color: "#065f46", label: "Shipped" },
  delivered:  { bg: "#bbf7d0", color: "#14532d", label: "Delivered" },
  returned:   { bg: "#fee2e2", color: "#991b1b", label: "Returned" },
  cancelled:  { bg: "#f3f4f6", color: "#374151", label: "Cancelled" },
};

const LOGISTICS_OPTIONS = [
  { value: "processing", label: "⏳ Processing" },
  { value: "packed",     label: "📦 Packed" },
  { value: "shipped",    label: "🚚 Shipped" },
  { value: "delivered",  label: "✅ Delivered" },
  { value: "returned",   label: "↩️ Returned" },
  { value: "cancelled",  label: "🚫 Cancelled" },
];

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const isSelectMode = window.location.search.includes("selectMode=true");

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data || []);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return true;
    const itemNames = (o.items || []).map(i => i.name || "").join(" ").toLowerCase();
    return (
      String(o.id).toLowerCase().includes(q) ||
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.customer_phone || "").toLowerCase().includes(q) ||
      (o.customer_email || "").toLowerCase().includes(q) ||
      (o.city || "").toLowerCase().includes(q) ||
      (o.tracking_id || "").toLowerCase().includes(q) ||
      (o.temp_tracking_id || "").toLowerCase().includes(q) ||
      (o.status || "").toLowerCase().includes(q) ||
      (o.logistics_status || "").toLowerCase().includes(q) ||
      itemNames.includes(q)
    );
  });

  const deleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) alert("Failed to delete order");
    else fetchOrders();
  };

  const markPaid = async (id) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", id);
    if (error) alert("Failed to mark as paid");
    else fetchOrders();
  };

  const updateLogisticsStatus = async (id, newStatus) => {
    setUpdatingId(id);
    // Optimistic update
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, logistics_status: newStatus } : o)
    );
    const { error } = await supabase
      .from("orders")
      .update({ logistics_status: newStatus })
      .eq("id", id);
    if (error) {
      alert("Failed to update status: " + error.message);
      fetchOrders(); // revert on error
    }
    setUpdatingId(null);
  };

  const selectForInvoice = (order) => {
    localStorage.setItem("selectedOrder", JSON.stringify(order));
    window.location.href = "/admin/invoices";
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "-";
    const dt = new Date(timestamp);
    return dt.toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "numeric", hour12: true,
    });
  };

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "1rem" }}>
        {isSelectMode ? "🧾 Select an Order for Invoice" : "📦 Orders"}
      </h2>

      {/* ── Search bar ── */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search by name, phone, city, order ID, tracking ID, item…"
          style={{
            flex: 1,
            padding: "0.55rem 1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "0.95rem",
            outline: "none",
            background: "#fff",
          }}
        />
        {searchQ && (
          <button
            onClick={() => setSearchQ("")}
            style={{
              padding: "0.5rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.88rem",
              color: "#6b7280",
            }}
          >✕ Clear</button>
        )}
        <span style={{ fontSize: "0.82rem", color: "#9ca3af", whiteSpace: "nowrap" }}>
          {filteredOrders.length} / {orders.length}
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <p>{orders.length === 0 ? "No orders received yet." : "No orders match your search."}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredOrders.map((o) => {
            const logStatus = o.logistics_status || "processing";
            const logInfo = LOGISTICS_COLORS[logStatus] || LOGISTICS_COLORS.processing;

            return (
              <div
                key={o.id}
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1 }}>

                  {/* ── Top row: Order # + status badges ── */}
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
                    <p style={{ margin: 0 }}>
                      <strong>Order #:</strong> {o.id}
                    </p>

                    {/* Payment status badge */}
                    <span style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: o.status === "paid" ? "#d1fae5" : "#fef9c3",
                      color: o.status === "paid" ? "#065f46" : "#92400e",
                    }}>
                      {o.status === "paid" ? "✅ Paid" : "⏳ " + (o.status || "Pending")}
                    </span>

                    {/* Logistics status badge */}
                    <span style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: logInfo.bg,
                      color: logInfo.color,
                    }}>
                      🚚 {logInfo.label}
                    </span>
                  </div>

                  {/* ── Logistics status dropdown ── */}
                  <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                      Update Status:
                    </label>
                    <select
                      value={logStatus}
                      disabled={updatingId === o.id}
                      onChange={(e) => updateLogisticsStatus(o.id, e.target.value)}
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "6px",
                        border: `1.5px solid ${logInfo.color}`,
                        background: logInfo.bg,
                        color: logInfo.color,
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: updatingId === o.id ? "wait" : "pointer",
                        outline: "none",
                      }}
                    >
                      {LOGISTICS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {updatingId === o.id && (
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Saving…</span>
                    )}
                  </div>

                  {/* ── Tracking IDs ── */}
                  {(o.tracking_id || o.temp_tracking_id) && (
                    <div style={{
                      display: "flex", flexWrap: "wrap", gap: "0.5rem",
                      marginBottom: "0.6rem",
                    }}>
                      {o.tracking_id && (
                        <span style={{
                          padding: "0.2rem 0.7rem",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          backgroundColor: "#ede9fe",
                          color: "#5b21b6",
                          letterSpacing: "0.03em",
                        }}>
                          🔖 Tracking ID: {o.tracking_id}
                        </span>
                      )}
                      {o.temp_tracking_id && (
                        <span style={{
                          padding: "0.2rem 0.7rem",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          backgroundColor: "#fce7f3",
                          color: "#9d174d",
                          letterSpacing: "0.03em",
                        }}>
                          🔖 Temp ID: {o.temp_tracking_id}
                        </span>
                      )}
                    </div>
                  )}

                  <p><strong>Date/Time:</strong> {formatDateTime(o.created_at)}</p>
                  <p><strong>Name:</strong> {o.customer_name}</p>
                  {o.customer_email && <p><strong>Email:</strong> {o.customer_email}</p>}
                  <p><strong>Phone:</strong> {o.customer_phone}</p>
                  <p>
                    <strong>Address:</strong> {o.street_address}, {o.city},{" "}
                    {o.postal_code || "-"}, {o.country || "-"}
                  </p>
                  {o.additional_notes && <p><strong>Notes:</strong> {o.additional_notes}</p>}

                  {/* ── Items ── */}
                  <div style={{ marginTop: "1rem" }}>
                    <p><strong>Items:</strong></p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "0.4rem" }}>
                      {o.items?.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.8rem",
                            border: "1px solid #eee", borderRadius: "6px",
                            padding: "0.5rem", backgroundColor: "#fafafa",
                          }}
                        >
                          <img
                            src={item.image || item.variantImage || PLACEHOLDER}
                            alt={item.name}
                            width="60"
                            height="60"
                            style={{ borderRadius: "6px", objectFit: "cover", border: "1px solid #ddd" }}
                            onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                          />
                          <div>
                            <p style={{ margin: 0 }}>
                              <strong>{item.name}</strong>{" "}
                              {item.variantName && <span style={{ color: "#555" }}>({item.variantName})</span>}
                            </p>
                            {item.color && (
                              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>Color: {item.color}</p>
                            )}
                            <p style={{ margin: 0, fontSize: "0.9rem" }}>
                              Qty: {item.quantity || 1} × Rs {item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p style={{ marginTop: "1rem" }}><strong>Total:</strong> Rs {o.total}</p>
                  {o.payment_method && <p><strong>Payment Method:</strong> {o.payment_method}</p>}
                </div>

                {/* ── Action buttons ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "130px" }}>
                  {isSelectMode ? (
                    <button
                      onClick={() => selectForInvoice(o)}
                      style={{ padding: "0.4rem 0.8rem", backgroundColor: "#2196F3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      ✅ Use for Invoice
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => markPaid(o.id)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          backgroundColor: o.status === "paid" ? "#9CA3AF" : "#4CAF50",
                          color: "#fff", border: "none", borderRadius: "4px",
                          cursor: o.status === "paid" ? "default" : "pointer",
                        }}
                        disabled={o.status === "paid"}
                      >
                        {o.status === "paid" ? "Already Paid" : "Mark as Paid"}
                      </button>

                      <button
                        onClick={() => deleteOrder(o.id)}
                        style={{
                          padding: "0.4rem 0.8rem", backgroundColor: "#E53935",
                          color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "0.3rem",
                        }}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;