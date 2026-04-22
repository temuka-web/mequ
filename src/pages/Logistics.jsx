// src/pages/Logistics.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

const C = {
  deep: "#6b21a8", mid: "#9333ea", pink: "#db2777",
  mist: "#faf5ff", border: "#e9d5ff", text: "#3b0764", soft: "#a78bca",
  blue: "#0369a1", blueBg: "#f0f9ff", blueBorder: "#bae6fd",
};

const STATUSES = ["processing", "tracking_assigned", "packed", "shipped", "delivered", "returned"];
const STATUS_COLORS = {
  processing:        { bg: "#fef9c3", color: "#854d0e", label: "Processing" },
  tracking_assigned: { bg: "#dbeafe", color: "#1e40af", label: "Tracking Assigned" },
  packed:            { bg: "#e0e7ff", color: "#3730a3", label: "Packed" },
  shipped:           { bg: "#d1fae5", color: "#065f46", label: "Shipped" },
  delivered:         { bg: "#bbf7d0", color: "#14532d", label: "Delivered" },
  returned:          { bg: "#fee2e2", color: "#991b1b", label: "Returned" },
};

const badge = (status) => {
  const s = STATUS_COLORS[status] || { bg: "#f3f4f6", color: "#374151", label: status || "—" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

const parseItems = (raw) => {
  try { return typeof raw === "string" ? JSON.parse(raw || "[]") : (raw || []); }
  catch { return []; }
};

const baseInp = {
  padding: "0.6rem 0.85rem", borderRadius: 8, border: "1.5px solid #e9d5ff",
  fontSize: "0.88rem", outline: "none", background: "#fff",
  width: "100%", boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "0.75rem", color: "#a78bca", fontWeight: 600,
  display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5,
};

function Modal({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: "2rem", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 60px rgba(107,33,168,0.15)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#a78bca" }}>×</button>
        {children}
      </div>
    </div>
  );
}

const Divider = () => <div style={{ borderBottom: "1px solid #e9d5ff", margin: "0.85rem 0" }} />;

export default function Logistics() {
  const [tab, setTab] = useState("website");
  const [orders, setOrders] = useState([]);
  const [dmOrders, setDmOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [wsSearch, setWsSearch] = useState("");
  const [wsFilter, setWsFilter] = useState("all");
  const [wsSelected, setWsSelected] = useState([]);
  const [wsBulkStatus, setWsBulkStatus] = useState("");
  const [wsBulkApplying, setWsBulkApplying] = useState(false);

  const [dmSearch, setDmSearch] = useState("");
  const [dmFilter, setDmFilter] = useState("all");
  const [dmSelected, setDmSelected] = useState([]);
  const [dmBulkStatus, setDmBulkStatus] = useState("");
  const [dmBulkApplying, setDmBulkApplying] = useState(false);

  const [bulkType, setBulkType] = useState("website");
  const [bulkFrom, setBulkFrom] = useState("");
  const [bulkTo, setBulkTo] = useState("");
  const [bulkMarkStatus, setBulkMarkStatus] = useState("");
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkMarking, setBulkMarking] = useState(false);
  const [bulkDone, setBulkDone] = useState(null);

  const [modal, setModal] = useState(null);
  const [mName, setMName] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mCity, setMCity] = useState("");
  const [mAddress, setMAddress] = useState("");
  const [mTotal, setMTotal] = useState("");
  const [mStatus, setMStatus] = useState("");
  const [mTempId, setMTempId] = useState("");
  const [mRealId, setMRealId] = useState("");
  const [mSaving, setMSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg, ok = true) => setToast({ msg, ok });

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: o, error: e1 }, { data: dm, error: e2 }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("dm_orders").select("*").order("created_at", { ascending: false }),
    ]);
    if (e1) console.error("orders fetch error:", e1);
    if (e2) console.error("dm_orders fetch error:", e2);
    setOrders(o || []);
    setDmOrders(dm || []);
    setLoading(false);
  };

  const openModal = (order, type) => {
    setModal({ order, type });
    setMName(order.name || order.customer_name || "");
    setMPhone(order.phone || order.customer_phone || "");
    setMCity(order.city || "");
    setMAddress(order.address || order.street_address || "");
    setMTotal(String(order.total || ""));
    setMStatus(order.logistics_status || "processing");
    setMTempId(order.temp_tracking_id || "");
    setMRealId(order.tracking_id || "");
  };

  const saveModal = async () => {
    if (!modal) return;
    setMSaving(true);
    const { order, type } = modal;

    if (type === "dm") {
      const { data, error } = await supabase
        .from("dm_orders")
        .update({
          name:             mName.trim(),
          phone:            mPhone.trim(),
          city:             mCity.trim(),
          address:          mAddress.trim(),
          logistics_status: mStatus,
          tracking_id:      mRealId.toUpperCase().trim() || null,
          temp_tracking_id: mTempId.toUpperCase().trim() || null,
        })
        .eq("order_id", order.order_id)
        .select();
      setMSaving(false);
      if (error) { alert("Error saving DM order:\n" + error.message); return; }
      if (!data || data.length === 0) { alert("Save ran but no rows updated."); return; }
      showToast("✅ DM order saved!");
    } else {
      const { data, error } = await supabase
        .from("orders")
        .update({
          name:             mName.trim(),
          phone:            mPhone.trim(),
          city:             mCity.trim(),
          address:          mAddress.trim(),
          total:            Number(mTotal) || 0,
          logistics_status: mStatus,
          temp_tracking_id: mTempId.toUpperCase().trim() || null,
          tracking_id:      mRealId.toUpperCase().trim() || null,
        })
        .eq("id", order.id)
        .select();
      setMSaving(false);
      if (error) { alert("Error saving order:\n" + error.message); return; }
      if (!data || data.length === 0) { alert("Save ran but no rows updated."); return; }
      showToast("✅ Order saved!");
    }

    setModal(null);
    fetchAll();
  };

  // ── Inline status — optimistic + verified ────────────────────────────────
  const updateStatus = async (order, newStatus, type) => {
    if (type === "dm") {
      setDmOrders(prev => prev.map(o =>
        o.order_id === order.order_id ? { ...o, logistics_status: newStatus } : o
      ));
      const { data, error } = await supabase
        .from("dm_orders")
        .update({ logistics_status: newStatus })
        .eq("order_id", order.order_id)
        .select();
      if (error || !data?.length) {
        setDmOrders(prev => prev.map(o =>
          o.order_id === order.order_id ? { ...o, logistics_status: order.logistics_status } : o
        ));
        alert("Status save failed:\n" + (error?.message || "No rows updated"));
        return;
      }
      showToast("✅ Status updated to " + STATUS_COLORS[newStatus]?.label);
    } else {
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, logistics_status: newStatus } : o
      ));
      const { data, error } = await supabase
        .from("orders")
        .update({ logistics_status: newStatus })
        .eq("id", order.id)
        .select();
      if (error || !data?.length) {
        setOrders(prev => prev.map(o =>
          o.id === order.id ? { ...o, logistics_status: order.logistics_status } : o
        ));
        alert("Status save failed:\n" + (error?.message || "No rows updated"));
        return;
      }
      showToast("✅ Status updated to " + STATUS_COLORS[newStatus]?.label);
    }
  };

  // ── Checkbox bulk — update UI live after each order ──────────────────────
  const applyCheckboxBulk = async (type) => {
    if (type === "website") {
      if (!wsBulkStatus || !wsSelected.length) return alert("Select orders and a status.");
      setWsBulkApplying(true);
      let failed = 0;
      for (const id of wsSelected) {
        // optimistic update per order — UI updates live as each one is saved
        setOrders(prev => prev.map(o =>
          o.id === id ? { ...o, logistics_status: wsBulkStatus } : o
        ));
        const { error } = await supabase
          .from("orders")
          .update({ logistics_status: wsBulkStatus })
          .eq("id", id);
        if (error) {
          // revert this one if failed
          failed++;
          setOrders(prev => prev.map(o =>
            o.id === id ? { ...o, logistics_status: o.logistics_status } : o
          ));
        }
      }
      setWsBulkApplying(false);
      if (failed) {
        alert(`⚠ ${failed} order(s) failed to update.`);
      } else {
        showToast(`✅ ${wsSelected.length} orders marked as ${STATUS_COLORS[wsBulkStatus]?.label}`);
      }
      setWsSelected([]);
      setWsBulkStatus("");
    } else {
      if (!dmBulkStatus || !dmSelected.length) return alert("Select orders and a status.");
      setDmBulkApplying(true);
      let failed = 0;
      for (const oid of dmSelected) {
        // optimistic update per DM order — UI updates live
        setDmOrders(prev => prev.map(o =>
          o.order_id === oid ? { ...o, logistics_status: dmBulkStatus } : o
        ));
        const { error } = await supabase
          .from("dm_orders")
          .update({ logistics_status: dmBulkStatus })
          .eq("order_id", oid);
        if (error) {
          failed++;
          setDmOrders(prev => prev.map(o =>
            o.order_id === oid ? { ...o, logistics_status: o.logistics_status } : o
          ));
        }
      }
      setDmBulkApplying(false);
      if (failed) {
        alert(`⚠ ${failed} order(s) failed to update.`);
      } else {
        showToast(`✅ ${dmSelected.length} DM orders marked as ${STATUS_COLORS[dmBulkStatus]?.label}`);
      }
      setDmSelected([]);
      setDmBulkStatus("");
    }
  };

  // ── Date-range bulk ───────────────────────────────────────────────────────
  const previewBulk = () => {
    if (!bulkFrom || !bulkTo) return alert("Set both dates.");
    const src = bulkType === "dm" ? dmOrders : orders;
    setBulkPreview(src.filter(o => {
      const d = (o.created_at || "").split("T")[0];
      return d >= bulkFrom && d <= bulkTo;
    }));
    setBulkDone(null);
  };

  const applyBulk = async () => {
    if (!bulkMarkStatus) return alert("Choose a status.");
    if (!bulkPreview?.length) return alert("No orders to update.");
    setBulkMarking(true);
    if (bulkType === "dm") {
      for (const o of bulkPreview) {
        setDmOrders(prev => prev.map(d =>
          d.order_id === o.order_id ? { ...d, logistics_status: bulkMarkStatus } : d
        ));
        await supabase.from("dm_orders").update({ logistics_status: bulkMarkStatus }).eq("order_id", o.order_id);
      }
    } else {
      for (const o of bulkPreview) {
        setOrders(prev => prev.map(d =>
          d.id === o.id ? { ...d, logistics_status: bulkMarkStatus } : d
        ));
        await supabase.from("orders").update({ logistics_status: bulkMarkStatus }).eq("id", o.id);
      }
    }
    setBulkMarking(false);
    setBulkDone(bulkPreview.length);
    setBulkPreview(null);
  };

  // ── Filtered ──────────────────────────────────────────────────────────────
  const wsFiltered = orders.filter(o => {
    const q = wsSearch.toLowerCase();
    return (!q ||
      (o.tracking_id || "").toLowerCase().includes(q) ||
      (o.temp_tracking_id || "").toLowerCase().includes(q) ||
      (o.name || o.customer_name || "").toLowerCase().includes(q) ||
      (o.city || "").toLowerCase().includes(q))
      && (wsFilter === "all" || o.logistics_status === wsFilter);
  });

  const dmFiltered = dmOrders.filter(o => {
    const q = dmSearch.toLowerCase();
    return (!q ||
      (o.order_id || "").toLowerCase().includes(q) ||
      (o.name || "").toLowerCase().includes(q) ||
      (o.city || "").toLowerCase().includes(q) ||
      (o.phone || "").toLowerCase().includes(q))
      && (dmFilter === "all" || o.logistics_status === dmFilter);
  });

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: C.soft }}>Loading…</div>;

  return (
    <div style={{ background: `linear-gradient(160deg, ${C.mist} 0%, #fce7f3 100%)`, minHeight: "100vh" }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#064e3b" : "#7f1d1d",
          color: "#fff", padding: "0.75rem 1.5rem", borderRadius: 12,
          fontWeight: 700, fontSize: "0.88rem", zIndex: 2000,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Topbar */}
      <div style={{ background: `linear-gradient(90deg, ${C.blue} 0%, ${C.deep} 100%)`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🚚</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Logistics</span>
        </div>
        <Link to="/admin" style={{ padding: "0.3rem 0.85rem", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, fontSize: "0.82rem", textDecoration: "none" }}>← Dashboard</Link>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: 1060, margin: "0 auto" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.4rem", width: "fit-content", flexWrap: "wrap" }}>
          {[["website", "🛒 Website Orders"], ["dm", "💬 DM Orders"], ["bulk", "⚡ Bulk Mark"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "0.45rem 1.1rem", borderRadius: 7, border: "none", cursor: "pointer",
              fontWeight: tab === key ? 700 : 400,
              background: tab === key ? C.deep : "transparent",
              color: tab === key ? "#fff" : C.text, fontSize: "0.85rem",
            }}>{label}</button>
          ))}
        </div>

        {/* ══ WEBSITE ORDERS ══ */}
        {tab === "website" && (<>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <input placeholder="Search name, tracking ID, city…" value={wsSearch} onChange={e => setWsSearch(e.target.value)} style={{ ...baseInp, maxWidth: 300 }} />
            <select value={wsFilter} onChange={e => setWsFilter(e.target.value)} style={{ ...baseInp, width: "auto" }}>
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
            </select>
            <button onClick={fetchAll} style={{ padding: "0.5rem 1rem", background: C.mist, color: C.deep, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>🔄 Refresh</button>
          </div>

          {wsSelected.length > 0 && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", color: C.text, fontWeight: 600 }}>{wsSelected.length} selected</span>
              <select value={wsBulkStatus} onChange={e => setWsBulkStatus(e.target.value)} style={{ ...baseInp, width: "auto" }}>
                <option value="">Change status to…</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
              </select>
              <button
                onClick={() => applyCheckboxBulk("website")}
                disabled={wsBulkApplying}
                style={{ padding: "0.5rem 1rem", background: wsBulkApplying ? "#9ca3af" : C.deep, color: "#fff", border: "none", borderRadius: 7, cursor: wsBulkApplying ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                {wsBulkApplying ? "Updating…" : "Apply"}
              </button>
              <button onClick={() => setWsSelected([])} style={{ padding: "0.5rem 0.8rem", background: "transparent", color: C.soft, border: `1px solid ${C.border}`, borderRadius: 7, cursor: "pointer", fontSize: "0.82rem" }}>Clear</button>
            </div>
          )}

          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead>
                  <tr style={{ background: C.mist, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "0.7rem 0.75rem" }}>
                      <input type="checkbox"
                        checked={wsSelected.length === wsFiltered.length && wsFiltered.length > 0}
                        onChange={() => setWsSelected(wsSelected.length === wsFiltered.length ? [] : wsFiltered.map(o => o.id))} />
                    </th>
                    {["Order ID", "Temp ID", "Tracking ID", "Name", "City", "Items", "Total", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "0.7rem 0.75rem", textAlign: "left", fontWeight: 700, color: C.soft, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wsFiltered.length === 0 && <tr><td colSpan={10} style={{ padding: "2rem", textAlign: "center", color: C.soft }}>No orders found</td></tr>}
                  {wsFiltered.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : "#fdf8ff" }}>
                      <td style={{ padding: "0.65rem 0.75rem" }}>
                        <input type="checkbox" checked={wsSelected.includes(o.id)}
                          onChange={() => setWsSelected(p => p.includes(o.id) ? p.filter(x => x !== o.id) : [...p, o.id])} />
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontFamily: "monospace", fontSize: "0.75rem", color: C.soft, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {String(o.id).slice(0, 8)}…
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontFamily: "monospace", fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>
                        {o.temp_tracking_id || <span style={{ color: C.soft, fontStyle: "italic", fontWeight: 400 }}>—</span>}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontFamily: "monospace", fontWeight: 700, color: C.blue, whiteSpace: "nowrap" }}>
                        {o.tracking_id || <span style={{ color: C.soft, fontStyle: "italic", fontWeight: 400 }}>Not assigned</span>}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 600, color: C.text }}>{o.name || o.customer_name || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: C.soft }}>{o.city || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: C.text, maxWidth: 140 }}>
                        {parseItems(o.items).map((it, idx) => (
                          <div key={idx} style={{ fontSize: "0.76rem" }}>{it.name} × {it.quantity || 1}</div>
                        ))}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>
                        Rs {Number(o.total || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>{badge(o.logistics_status || "processing")}</td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          <select value={o.logistics_status || "processing"}
                            onChange={e => updateStatus(o, e.target.value, "website")}
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", borderRadius: 6, border: `1px solid ${C.border}`, cursor: "pointer", background: "#fff" }}>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
                          </select>
                          <button onClick={() => openModal(o, "website")}
                            style={{ padding: "0.3rem 0.7rem", background: C.mist, color: C.deep, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ══ DM ORDERS ══ */}
        {tab === "dm" && (<>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <input placeholder="Search name, order ID, city, phone…" value={dmSearch} onChange={e => setDmSearch(e.target.value)} style={{ ...baseInp, maxWidth: 300 }} />
            <select value={dmFilter} onChange={e => setDmFilter(e.target.value)} style={{ ...baseInp, width: "auto" }}>
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
            </select>
            <button onClick={fetchAll} style={{ padding: "0.5rem 1rem", background: C.mist, color: C.deep, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>🔄 Refresh</button>
          </div>

          {dmSelected.length > 0 && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", color: C.text, fontWeight: 600 }}>{dmSelected.length} selected</span>
              <select value={dmBulkStatus} onChange={e => setDmBulkStatus(e.target.value)} style={{ ...baseInp, width: "auto" }}>
                <option value="">Change status to…</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
              </select>
              <button
                onClick={() => applyCheckboxBulk("dm")}
                disabled={dmBulkApplying}
                style={{ padding: "0.5rem 1rem", background: dmBulkApplying ? "#9ca3af" : C.deep, color: "#fff", border: "none", borderRadius: 7, cursor: dmBulkApplying ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                {dmBulkApplying ? "Updating…" : "Apply"}
              </button>
              <button onClick={() => setDmSelected([])} style={{ padding: "0.5rem 0.8rem", background: "transparent", color: C.soft, border: `1px solid ${C.border}`, borderRadius: 7, cursor: "pointer", fontSize: "0.82rem" }}>Clear</button>
            </div>
          )}

          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead>
                  <tr style={{ background: C.mist, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "0.7rem 0.75rem" }}>
                      <input type="checkbox"
                        checked={dmSelected.length === dmFiltered.length && dmFiltered.length > 0}
                        onChange={() => setDmSelected(dmSelected.length === dmFiltered.length ? [] : dmFiltered.map(o => o.order_id))} />
                    </th>
                    {["Order ID", "Tracking ID", "Name", "City", "Phone", "Address", "Date", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "0.7rem 0.75rem", textAlign: "left", fontWeight: 700, color: C.soft, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dmFiltered.length === 0 && <tr><td colSpan={10} style={{ padding: "2rem", textAlign: "center", color: C.soft }}>No DM orders found</td></tr>}
                  {dmFiltered.map((o, i) => (
                    <tr key={o.order_id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "#fff" : "#fdf8ff" }}>
                      <td style={{ padding: "0.65rem 0.75rem" }}>
                        <input type="checkbox" checked={dmSelected.includes(o.order_id)}
                          onChange={() => setDmSelected(p => p.includes(o.order_id) ? p.filter(x => x !== o.order_id) : [...p, o.order_id])} />
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontFamily: "monospace", fontWeight: 700, color: "#92400e" }}>{o.order_id || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", fontFamily: "monospace", fontWeight: 700, color: C.blue, whiteSpace: "nowrap" }}>
                        {o.tracking_id || <span style={{ color: C.soft, fontStyle: "italic", fontWeight: 400 }}>Not assigned</span>}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem", fontWeight: 600, color: C.text }}>{o.name || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: C.soft }}>{o.city || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: C.soft }}>{o.phone || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: C.text, maxWidth: 160, fontSize: "0.78rem" }}>{o.address || "—"}</td>
                      <td style={{ padding: "0.65rem 0.75rem", color: C.soft, whiteSpace: "nowrap", fontSize: "0.78rem" }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>{badge(o.logistics_status || "processing")}</td>
                      <td style={{ padding: "0.65rem 0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          <select value={o.logistics_status || "processing"}
                            onChange={e => updateStatus(o, e.target.value, "dm")}
                            style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", borderRadius: 6, border: `1px solid ${C.border}`, cursor: "pointer", background: "#fff" }}>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
                          </select>
                          <button onClick={() => openModal(o, "dm")}
                            style={{ padding: "0.3rem 0.7rem", background: C.mist, color: C.deep, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ══ BULK MARK ══ */}
        {tab === "bulk" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 700, color: C.deep, fontSize: "1rem", marginBottom: "0.3rem" }}>⚡ Bulk Mark by Date Range</div>
              <div style={{ fontSize: "0.78rem", color: C.soft, marginBottom: "1.2rem" }}>Pick type, set date range, preview, then apply status to all at once.</div>

              <label style={labelStyle}>Order Type</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {[["website", "🛒 Website Orders"], ["dm", "💬 DM Orders"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => { setBulkType(val); setBulkPreview(null); setBulkDone(null); }}
                    style={{ padding: "0.5rem 1rem", borderRadius: 8, border: `2px solid ${bulkType === val ? C.deep : C.border}`, background: bulkType === val ? C.mist : "#fff", color: bulkType === val ? C.deep : C.soft, fontWeight: bulkType === val ? 700 : 400, cursor: "pointer", fontSize: "0.85rem" }}>
                    {lbl}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div><label style={labelStyle}>From Date</label><input type="date" value={bulkFrom} onChange={e => { setBulkFrom(e.target.value); setBulkPreview(null); setBulkDone(null); }} style={baseInp} /></div>
                <div><label style={labelStyle}>To Date</label><input type="date" value={bulkTo} onChange={e => { setBulkTo(e.target.value); setBulkPreview(null); setBulkDone(null); }} style={baseInp} /></div>
              </div>

              <button onClick={previewBulk} style={{ padding: "0.6rem 1.2rem", background: C.blueBg, color: C.blue, border: `1.5px solid ${C.blueBorder}`, borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                🔍 Preview Orders
              </button>
            </div>

            {bulkPreview !== null && (
              <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.25rem" }}>
                {bulkPreview.length === 0 ? (
                  <div style={{ color: C.soft, fontSize: "0.88rem" }}>No orders found in this date range.</div>
                ) : (<>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: "0.75rem" }}>{bulkPreview.length} order{bulkPreview.length !== 1 ? "s" : ""} found</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem", maxHeight: 240, overflowY: "auto" }}>
                    {bulkPreview.map(o => (
                      <div key={o.id || o.order_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.7rem", background: C.mist, borderRadius: 7, fontSize: "0.82rem" }}>
                        <div>
                          <span style={{ fontWeight: 700, color: C.text }}>{o.name || o.customer_name || "—"}</span>
                          <span style={{ color: C.soft, marginLeft: 8 }}>{o.city || ""}</span>
                        </div>
                        {badge(o.logistics_status || "processing")}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label style={labelStyle}>Mark all as</label>
                      <select value={bulkMarkStatus} onChange={e => setBulkMarkStatus(e.target.value)} style={baseInp}>
                        <option value="">Choose status…</option>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
                      </select>
                    </div>
                    <button onClick={applyBulk} disabled={bulkMarking || !bulkMarkStatus}
                      style={{ padding: "0.65rem 1.2rem", background: bulkMarkStatus ? `linear-gradient(90deg, ${C.blue}, ${C.deep})` : "#d1d5db", color: "#fff", border: "none", borderRadius: 8, cursor: bulkMarkStatus ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.85rem", opacity: bulkMarking ? 0.7 : 1 }}>
                      {bulkMarking ? "Marking…" : `✅ Apply to ${bulkPreview.length} orders`}
                    </button>
                  </div>
                </>)}
              </div>
            )}

            {bulkDone !== null && (
              <div style={{ marginTop: "1rem", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "1rem 1.2rem", color: "#065f46", fontWeight: 700, fontSize: "0.9rem" }}>
                ✅ {bulkDone} order{bulkDone !== 1 ? "s" : ""} marked as <strong>{STATUS_COLORS[bulkMarkStatus]?.label}</strong>!
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL ══ */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.mist, border: `2px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              {modal.type === "dm" ? "💬" : "📦"}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: C.deep }}>{modal.type === "dm" ? "DM Order" : "Website Order"}</div>
              <div style={{ fontSize: "0.73rem", color: C.soft, fontFamily: "monospace" }}>
                {modal.type === "dm" ? modal.order.order_id : String(modal.order.id).slice(0, 16) + "…"}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.72rem", color: C.soft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.6rem" }}>Customer Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "0.65rem" }}>
            <div><label style={labelStyle}>Name</label><input value={mName} onChange={e => setMName(e.target.value)} style={baseInp} /></div>
            <div><label style={labelStyle}>Phone</label><input value={mPhone} onChange={e => setMPhone(e.target.value)} style={baseInp} /></div>
            <div><label style={labelStyle}>City</label><input value={mCity} onChange={e => setMCity(e.target.value)} style={baseInp} /></div>
            {modal.type !== "dm" && <div><label style={labelStyle}>Total (Rs)</label><input type="number" value={mTotal} onChange={e => setMTotal(e.target.value)} style={baseInp} /></div>}
          </div>
          <div style={{ marginBottom: "0.65rem" }}>
            <label style={labelStyle}>Full Address</label>
            <input value={mAddress} onChange={e => setMAddress(e.target.value)} style={baseInp} placeholder="House #, Street, Area" />
          </div>

          <Divider />

          {modal.type !== "dm" && (() => {
            const items = parseItems(modal.order.items);
            return items.length > 0 ? (
              <>
                <div style={{ fontSize: "0.72rem", color: C.soft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.5rem" }}>Items Ordered</div>
                <div style={{ background: C.mist, borderRadius: 8, padding: "0.65rem 0.85rem", marginBottom: "0.5rem" }}>
                  {items.map((it, i) => <div key={i} style={{ fontSize: "0.83rem", color: C.text, padding: "2px 0" }}>{it.name} <span style={{ color: C.soft }}>× {it.quantity || 1}</span></div>)}
                </div>
                <Divider />
              </>
            ) : null;
          })()}

          <div style={{ marginBottom: "0.65rem" }}>
            <label style={labelStyle}>Order Status</label>
            <select value={mStatus} onChange={e => setMStatus(e.target.value)} style={{ ...baseInp, fontWeight: 600 }}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
            </select>
          </div>

          <Divider />

          <div style={{ fontSize: "0.72rem", color: C.soft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: "0.6rem" }}>Tracking IDs</div>

          {modal.type !== "dm" && (
            <div style={{ marginBottom: "0.65rem" }}>
              <label style={{ ...labelStyle, color: "#92400e" }}>Temp / Order ID <span style={{ fontWeight: 400, textTransform: "none" }}>(customer uses this)</span></label>
              <input value={mTempId} onChange={e => setMTempId(e.target.value.toUpperCase())}
                placeholder="e.g. TEMP-ABC123"
                style={{ ...baseInp, fontFamily: "monospace", fontWeight: 700, color: "#92400e", borderColor: "#fcd34d" }} />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ ...labelStyle, color: C.blue }}>
              Real Tracking ID &nbsp;
              {!mRealId && <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.65rem", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>Not assigned yet</span>}
            </label>
            <input value={mRealId} onChange={e => setMRealId(e.target.value.toUpperCase())}
              placeholder="Type to assign real tracking ID"
              style={{ ...baseInp, fontFamily: "monospace", fontWeight: 700, color: C.blue, borderColor: mRealId ? C.blueBorder : "#e9d5ff" }} />
            <div style={{ fontSize: "0.72rem", color: C.soft, marginTop: 5 }}>
              Customer entering their order/temp ID will see this real tracking ID.
            </div>
          </div>

          <button onClick={saveModal} disabled={mSaving}
            style={{ width: "100%", padding: "0.75rem", background: `linear-gradient(90deg, ${C.blue}, ${C.deep})`, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", opacity: mSaving ? 0.7 : 1 }}>
            {mSaving ? "Saving…" : "✅ Save Changes"}
          </button>
        </Modal>
      )}
    </div>
  );
}