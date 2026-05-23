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

// Caution is only relevant before "packed" stage
const CAUTION_VISIBLE_STATUSES = ["processing"];

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [cautionUpdatingId, setCautionUpdatingId] = useState(null);

  // Admin notes state: { [orderId]: { text, editing, saving } }
  const [adminNotes, setAdminNotes] = useState({});

  // Only show select/invoice UI when navigated from invoice page
  const isSelectMode = window.location.search.includes("selectMode=true");

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else {
      setOrders(data || []);
      // Initialise adminNotes state from fetched data
      const notesMap = {};
      (data || []).forEach(o => {
        notesMap[o.id] = { text: o.admin_notes || "", editing: false, saving: false };
      });
      setAdminNotes(notesMap);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ── Admin notes helpers ──
  const openNoteEditor = (id) => {
    setAdminNotes(prev => ({
      ...prev,
      [id]: { ...prev[id], editing: true },
    }));
  };

  const cancelNoteEdit = (id, originalNote) => {
    setAdminNotes(prev => ({
      ...prev,
      [id]: { text: originalNote, editing: false, saving: false },
    }));
  };

  const handleNoteChange = (id, value) => {
    setAdminNotes(prev => ({
      ...prev,
      [id]: { ...prev[id], text: value },
    }));
  };

  const saveAdminNote = async (id) => {
    const noteText = adminNotes[id]?.text || "";
    setAdminNotes(prev => ({ ...prev, [id]: { ...prev[id], saving: true } }));

    const { error } = await supabase
      .from("orders")
      .update({ admin_notes: noteText })
      .eq("id", id);

    if (error) {
      alert("Failed to save note: " + error.message);
      setAdminNotes(prev => ({ ...prev, [id]: { ...prev[id], saving: false } }));
    } else {
      // Update local orders state too
      setOrders(prev => prev.map(o => o.id === id ? { ...o, admin_notes: noteText } : o));
      setAdminNotes(prev => ({ ...prev, [id]: { text: noteText, editing: false, saving: false } }));
    }
  };

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
      (o.admin_notes || "").toLowerCase().includes(q) ||
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
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, logistics_status: newStatus } : o)
    );
    const { error } = await supabase
      .from("orders")
      .update({ logistics_status: newStatus })
      .eq("id", id);
    if (error) {
      alert("Failed to update status: " + error.message);
      fetchOrders();
    }
    setUpdatingId(null);
  };

  // Toggle caution flag — admin only, never exposed to customer
  const toggleCaution = async (id, currentCaution) => {
    setCautionUpdatingId(id);
    const newVal = !currentCaution;
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, caution: newVal } : o)
    );
    const { error } = await supabase
      .from("orders")
      .update({ caution: newVal })
      .eq("id", id);
    if (error) {
      alert("Failed to update caution flag: " + error.message);
      fetchOrders();
    }
    setCautionUpdatingId(null);
  };

  const selectForInvoice = (order) => {
    localStorage.setItem("selectedOrder", JSON.stringify(order));
    window.location.href = "/admin/invoices";
  };

  const toggleOrderSelection = (id) => {
    setSelectedOrderIds((prev) => {
      if (prev.includes(id)) return prev.filter((sid) => sid !== id);
      if (prev.length >= 3) {
        alert("You can select up to 3 orders at a time.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const createInvoicesForSelected = () => {
    if (selectedOrderIds.length === 0) {
      alert("Please select at least 1 order.");
      return;
    }
    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    localStorage.setItem("selectedOrders", JSON.stringify(selectedOrders));
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
        {isSelectMode ? "🧾 Select Orders for Invoice" : "📦 Orders"}
      </h2>

      {/* ── Multi-select bar: ONLY shown in selectMode ── */}
      {isSelectMode && (
        <div style={{
          background: selectedOrderIds.length > 0 ? "#ede9fe" : "#f3f4f6",
          border: `2px solid ${selectedOrderIds.length > 0 ? "#7c3aed" : "#e5e7eb"}`,
          borderRadius: "10px",
          padding: "12px 18px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}>
          <div style={{ fontSize: "0.95rem", color: "#374151", fontWeight: 600 }}>
            {selectedOrderIds.length === 0
              ? "☑️ Tick orders to select (max 3), then create invoices"
              : `✅ ${selectedOrderIds.length}/3 selected`}
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {selectedOrderIds.length > 0 && (
              <button
                onClick={() => setSelectedOrderIds([])}
                style={{ padding: "7px 14px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
              >
                ✕ Deselect All
              </button>
            )}
            <button
              onClick={createInvoicesForSelected}
              disabled={selectedOrderIds.length === 0}
              style={{
                padding: "7px 18px",
                background: selectedOrderIds.length > 0 ? "linear-gradient(135deg, #7c3aed, #db2777)" : "#d1d5db",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: selectedOrderIds.length > 0 ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              📄 Create Invoices ({selectedOrderIds.length})
            </button>
          </div>
        </div>
      )}

      {/* ── Search bar ── */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search by name, phone, city, order ID, tracking ID, item, admin notes…"
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
            const isSelected = selectedOrderIds.includes(o.id);

            // Caution is only meaningful/shown while order is still in "processing"
            const isCautionEligible = CAUTION_VISIBLE_STATUSES.includes(logStatus);
            const hasCaution = !!o.caution && isCautionEligible;

            // Admin notes for this order
            const noteState = adminNotes[o.id] || { text: o.admin_notes || "", editing: false, saving: false };
            const hasNote = !!(o.admin_notes || "").trim();

            return (
              <div
                key={o.id}
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor:
                    hasCaution
                      ? "#fffbeb"
                      : isSelectMode && isSelected
                      ? "#faf5ff"
                      : "#fff",
                  border: `2px solid ${
                    hasCaution
                      ? "#f59e0b"
                      : isSelectMode && isSelected
                      ? "#7c3aed"
                      : "#ccc"
                  }`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                  boxShadow:
                    hasCaution
                      ? "0 0 0 3px #fef3c7"
                      : isSelectMode && isSelected
                      ? "0 0 0 3px #ede9fe"
                      : "none",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ flex: 1 }}>

                  {/* ── Top row: Checkbox (selectMode only) + Order # + status badges ── */}
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>

                    {/* Checkbox only in selectMode */}
                    {isSelectMode && (
                      <div
                        onClick={() => toggleOrderSelection(o.id)}
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "6px",
                          border: `2px solid ${isSelected ? "#7c3aed" : "#9ca3af"}`,
                          background: isSelected ? "#7c3aed" : "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "14px",
                          color: "#fff",
                          fontWeight: 700,
                          transition: "all 0.15s",
                        }}
                      >
                        {isSelected ? "✓" : ""}
                      </div>
                    )}

                    <p style={{ margin: 0 }}>
                      <strong>Order #:</strong> {o.id}
                    </p>

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

                    {/* ── CAUTION badge — admin eyes only, hidden once packed ── */}
                    {hasCaution && (
                      <span
                        title="Caution flagged — contact MOKO before packing"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "0.2rem 0.65rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          border: "1.5px solid #f59e0b",
                          letterSpacing: "0.02em",
                          animation: "cautionPulse 2s ease-in-out infinite",
                        }}
                      >
                        ⚠️ Caution
                      </span>
                    )}

                    {/* ── Admin note indicator badge ── */}
                    {hasNote && !noteState.editing && (
                      <span
                        title="Admin / MOKO note attached"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "0.2rem 0.65rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: "#eef2ff",
                          color: "#3730a3",
                          border: "1.5px solid #a5b4fc",
                          letterSpacing: "0.02em",
                        }}
                      >
                        🔒 Admin Note
                      </span>
                    )}
                  </div>

                  {/* ── CAUTION contact hint banner — only when flagged + still processing ── */}
                  {hasCaution && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                      border: "1.5px dashed #f59e0b",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: "0.85rem",
                      flexWrap: "wrap",
                    }}>
                      <span style={{ fontSize: "1.25rem" }}>📞</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#92400e" }}>
                          Contact MOKO before packing this order
                        </p>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#b45309" }}>
                          Customer may have made changes — check with MOKO for further details before proceeding.
                        </p>
                      </div>
                    </div>
                  )}

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
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
                      {o.tracking_id && (
                        <span style={{ padding: "0.2rem 0.7rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, backgroundColor: "#ede9fe", color: "#5b21b6", letterSpacing: "0.03em" }}>
                          🔖 Tracking ID: {o.tracking_id}
                        </span>
                      )}
                      {o.temp_tracking_id && (
                        <span style={{ padding: "0.2rem 0.7rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, backgroundColor: "#fce7f3", color: "#9d174d", letterSpacing: "0.03em" }}>
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

                  {/* ── Customer notes (from order form) ── */}
                  {o.additional_notes && (
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "7px",
                      padding: "8px 12px",
                      marginTop: "0.4rem",
                      marginBottom: "0.4rem",
                    }}>
                      <span style={{ fontSize: "1rem", marginTop: "1px" }}>💬</span>
                      <div>
                        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#166534", marginBottom: "2px" }}>
                          Customer Note
                        </p>
                        <p style={{ margin: 0, fontSize: "0.88rem", color: "#374151" }}>
                          {o.additional_notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Admin / MOKO Notes section ── */}
                  <div style={{
                    marginTop: "0.75rem",
                    background: noteState.editing ? "#eef2ff" : hasNote ? "#eef2ff" : "#f8faff",
                    border: `1.5px ${noteState.editing ? "solid" : hasNote ? "solid" : "dashed"} ${noteState.editing ? "#6366f1" : hasNote ? "#a5b4fc" : "#c7d2fe"}`,
                    borderRadius: "8px",
                    padding: "10px 13px",
                    transition: "all 0.15s",
                  }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: noteState.editing || hasNote ? "8px" : "0" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#4338ca",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}>
                        🔒 Admin / MOKO Notes
                      </span>
                      {!noteState.editing && (
                        <button
                          onClick={() => openNoteEditor(o.id)}
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#4338ca",
                            background: "none",
                            border: "1px solid #a5b4fc",
                            borderRadius: "5px",
                            padding: "2px 9px",
                            cursor: "pointer",
                          }}
                        >
                          {hasNote ? "✏️ Edit" : "+ Add Note"}
                        </button>
                      )}
                    </div>

                    {/* Display mode — note exists, not editing */}
                    {!noteState.editing && hasNote && (
                      <p style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        color: "#1e1b4b",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.5",
                      }}>
                        {o.admin_notes}
                      </p>
                    )}

                    {/* Empty state hint */}
                    {!noteState.editing && !hasNote && (
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#818cf8", fontStyle: "italic" }}>
                        No admin notes yet — click "+ Add Note" to leave an internal memo.
                      </p>
                    )}

                    {/* Edit mode */}
                    {noteState.editing && (
                      <>
                        <textarea
                          value={noteState.text}
                          onChange={e => handleNoteChange(o.id, e.target.value)}
                          placeholder="Write an internal note for this order — visible only to admin/MOKO…"
                          rows={3}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1.5px solid #818cf8",
                            fontSize: "0.88rem",
                            color: "#1e1b4b",
                            background: "#fff",
                            resize: "vertical",
                            outline: "none",
                            fontFamily: "inherit",
                            lineHeight: "1.5",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => saveAdminNote(o.id)}
                            disabled={noteState.saving}
                            style={{
                              padding: "5px 14px",
                              background: noteState.saving ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #4338ca)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              cursor: noteState.saving ? "wait" : "pointer",
                              fontWeight: 700,
                              fontSize: "0.82rem",
                            }}
                          >
                            {noteState.saving ? "⏳ Saving…" : "💾 Save Note"}
                          </button>
                          <button
                            onClick={() => cancelNoteEdit(o.id, o.admin_notes || "")}
                            disabled={noteState.saving}
                            style={{
                              padding: "5px 12px",
                              background: "#e5e7eb",
                              color: "#374151",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: "0.82rem",
                            }}
                          >
                            Cancel
                          </button>
                          {hasNote && (
                            <button
                              onClick={() => {
                                handleNoteChange(o.id, "");
                              }}
                              disabled={noteState.saving}
                              style={{
                                padding: "5px 10px",
                                background: "#fee2e2",
                                color: "#991b1b",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.82rem",
                              }}
                            >
                              🗑 Clear
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

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
                    <>
                      <button
                        onClick={() => toggleOrderSelection(o.id)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          backgroundColor: isSelected ? "#7c3aed" : "#ede9fe",
                          color: isSelected ? "#fff" : "#6b21a8",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                        }}
                      >
                        {isSelected ? "✅ Selected" : "☐ Select"}
                      </button>
                      <button
                        onClick={() => selectForInvoice(o)}
                        style={{ padding: "0.4rem 0.8rem", backgroundColor: "#2196F3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                      >
                        ✅ Single Invoice
                      </button>
                    </>
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

                      {/* ── Caution toggle — only shown while order is in "processing" ── */}
                      {isCautionEligible && (
                        <button
                          onClick={() => toggleCaution(o.id, o.caution)}
                          disabled={cautionUpdatingId === o.id}
                          title={
                            o.caution
                              ? "Remove caution flag"
                              : "Flag this order — packer will be prompted to contact MOKO"
                          }
                          style={{
                            padding: "0.4rem 0.8rem",
                            backgroundColor: o.caution ? "#f59e0b" : "#fef3c7",
                            color: o.caution ? "#fff" : "#92400e",
                            border: `1.5px solid ${o.caution ? "#d97706" : "#fcd34d"}`,
                            borderRadius: "4px",
                            cursor: cautionUpdatingId === o.id ? "wait" : "pointer",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            transition: "all 0.15s",
                          }}
                        >
                          {cautionUpdatingId === o.id
                            ? "⏳ Saving…"
                            : o.caution
                            ? "⚠️ Caution ON"
                            : "⚠️ Mark Caution"}
                        </button>
                      )}

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

      {/* Pulse animation for caution badge */}
      <style>{`
        @keyframes cautionPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 0 5px rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;