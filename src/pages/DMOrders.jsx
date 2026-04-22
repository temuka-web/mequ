// src/pages/DMOrdersPage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  processing:        { bg: "#fef9c3", color: "#854d0e", label: "⏳ Processing" },
  tracking_assigned: { bg: "#dbeafe", color: "#1e40af", label: "🔖 Tracking Assigned" },
  packed:            { bg: "#e0e7ff", color: "#3730a3", label: "📫 Packed" },
  shipped:           { bg: "#d1fae5", color: "#065f46", label: "🚚 Shipped" },
  delivered:         { bg: "#bbf7d0", color: "#14532d", label: "✅ Delivered" },
  returned:          { bg: "#fee2e2", color: "#991b1b", label: "↩️ Returned" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { bg: "#f3f4f6", color: "#374151", label: status || "Processing" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const DMOrdersPage = () => {
  const [dmOrders, setDmOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("dm_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDmOrders(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = dmOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (order.order_id || "").toLowerCase().includes(q) ||
      (order.name || "").toLowerCase().includes(q) ||
      (order.phone || "").toLowerCase().includes(q) ||
      (order.city || "").toLowerCase().includes(q) ||
      (order.address || "").toLowerCase().includes(q) ||
      (order.tracking_id || "").toLowerCase().includes(q) ||
      (order.temp_tracking_id || "").toLowerCase().includes(q)
    );
  });

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order?")) return;
    const { error } = await supabase.from("dm_orders").delete().eq("order_id", orderId);
    if (error) { alert("Failed to delete: " + error.message); return; }
    fetchOrders();
  };

  const createInvoice = (order) => {
    localStorage.setItem("selectedDMOrder", JSON.stringify(order));
    navigate("/admin/invoices");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>⏳ Loading orders…</div>;

  if (error) return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ color: "red" }}>❌ {error}</p>
      <button onClick={fetchOrders} style={{ padding: "10px 20px", background: "#28a745", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", marginTop: 12 }}>🔄 Try Again</button>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>💬 DM Orders ({dmOrders.length})</h2>
        <button onClick={fetchOrders} style={{ padding: "8px 18px", background: "#6b21a8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>
          🔄 Refresh
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ position: "relative", marginBottom: "18px" }}>
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>🔍</span>
        <input
          type="text"
          placeholder="Search by name, phone, city, address, order ID, tracking ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "10px 40px 10px 40px", borderRadius: 8, border: "1.5px solid #e9d5ff", fontSize: "0.93rem", outline: "none", boxSizing: "border-box", background: "#faf5ff", color: "#3b0764" }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9ca3af", lineHeight: 1 }}
          >✕</button>
        )}
      </div>
      {searchQuery && (
        <p style={{ margin: "-10px 0 14px", fontSize: "0.82rem", color: "#7c3aed" }}>
          Showing {filteredOrders.length} of {dmOrders.length} orders
        </p>
      )}

      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#f8f9fa", borderRadius: 10 }}>
          <p style={{ fontSize: "18px", color: "#666" }}>{searchQuery ? "🔎 No orders match your search." : "📭 No DM orders yet."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {filteredOrders.map((order) => (
            <div key={order.order_id} style={{ border: "1px solid #e9d5ff", padding: "20px", borderRadius: 12, background: "#fff", boxShadow: "0 2px 8px rgba(107,33,168,0.07)" }}>

              {/* ── Top row: Order ID + Status ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ background: "#ede9fe", color: "#5b21b6", borderRadius: 6, padding: "3px 10px", fontFamily: "monospace", fontWeight: 800, fontSize: "0.88rem", letterSpacing: "0.04em" }}>
                      🔖 {order.order_id}
                    </span>
                    <StatusBadge status={order.logistics_status || "processing"} />
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#999" }}>
                    {order.created_at ? new Date(order.created_at).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }) : "—"}
                  </p>
                </div>
                <button onClick={() => deleteOrder(order.order_id)}
                  style={{ padding: "7px 14px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                  🗑️ Delete
                </button>
              </div>

              {/* ── Tracking IDs block ── */}
              {(order.tracking_id || order.temp_tracking_id) && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "12px" }}>
                  {order.tracking_id && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 12px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e40af", fontFamily: "monospace" }}>
                        🚚 Courier Tracking ID: {order.tracking_id}
                      </span>
                      <button onClick={() => copyToClipboard(order.tracking_id)}
                        style={{ padding: "2px 7px", fontSize: "11px", background: "#dbeafe", color: "#1e40af", border: "none", borderRadius: 4, cursor: "pointer" }}>📋</button>
                    </div>
                  )}
                  {order.temp_tracking_id && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 12px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#92400e", fontFamily: "monospace" }}>
                        🔖 Temp ID: {order.temp_tracking_id}
                      </span>
                      <button onClick={() => copyToClipboard(order.temp_tracking_id)}
                        style={{ padding: "2px 7px", fontSize: "11px", background: "#fde68a", color: "#92400e", border: "none", borderRadius: 4, cursor: "pointer" }}>📋</button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Details ── */}
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong>👤 Name:</strong> {order.name}
                  <button onClick={() => copyToClipboard(order.name)} style={{ padding: "3px 8px", fontSize: "11px", background: "#ede9fe", color: "#6b21a8", border: "none", borderRadius: 4, cursor: "pointer" }}>📋</button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong>📞 Phone:</strong>
                  <a href={`tel:${order.phone}`} style={{ color: "#6b21a8", textDecoration: "none" }}>{order.phone}</a>
                  <button onClick={() => copyToClipboard(order.phone)} style={{ padding: "3px 8px", fontSize: "11px", background: "#ede9fe", color: "#6b21a8", border: "none", borderRadius: 4, cursor: "pointer" }}>📋</button>
                </div>

                {order.city && (
                  <div><strong>🏙️ City:</strong> {order.city}</div>
                )}

                <div style={{ background: "#faf5ff", padding: "10px", borderRadius: 8, position: "relative" }}>
                  <strong>📍 Address:</strong>
                  <p style={{ margin: "5px 0 0", whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>{order.address}</p>
                  <button onClick={() => copyToClipboard(order.address)} style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px", fontSize: "11px", background: "#ede9fe", color: "#6b21a8", border: "none", borderRadius: 4, cursor: "pointer" }}>📋</button>
                </div>
              </div>

              {/* ── Invoice button ── */}
              <div style={{ marginTop: "14px", borderTop: "1px solid #e9d5ff", paddingTop: "14px" }}>
                <button onClick={() => createInvoice(order)}
                  style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg, #6b21a8, #db2777)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "15px", fontWeight: 700 }}>
                  📄 Create Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DMOrdersPage;