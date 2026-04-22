// src/pages/ScannerPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

const C = {
  deep: "#6b21a8", mid: "#9333ea", pink: "#db2777",
  mist: "#faf5ff", border: "#e9d5ff", text: "#3b0764", soft: "#a78bca",
  blue: "#0369a1", blueBg: "#f0f9ff", blueBorder: "#bae6fd",
};

const STATUSES = ["processing", "tracking_assigned", "packed", "shipped", "out_for_delivery", "delivered", "return_received", "returned"];
const STATUS_COLORS = {
  processing:        { bg: "#fef9c3", color: "#854d0e",  label: "⏳ Processing" },
  tracking_assigned: { bg: "#dbeafe", color: "#1e40af",  label: "🔖 Tracking Assigned" },
  packed:            { bg: "#e0e7ff", color: "#3730a3",  label: "📫 Packed" },
  shipped:           { bg: "#d1fae5", color: "#065f46",  label: "🚚 Shipped" },
  out_for_delivery:  { bg: "#fef3c7", color: "#92400e",  label: "🛵 Out for Delivery" },
  delivered:         { bg: "#bbf7d0", color: "#14532d",  label: "✅ Delivered" },
  return_received:   { bg: "#fde8d8", color: "#9a3412",  label: "📥 Return Received" },
  returned:          { bg: "#fee2e2", color: "#991b1b",  label: "↩️ Returned" },
};

const badge = (status) => {
  const s = STATUS_COLORS[status] || { bg: "#f3f4f6", color: "#374151", label: status || "—" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const parseItems = (raw) => {
  try { return typeof raw === "string" ? JSON.parse(raw || "[]") : (raw || []); }
  catch { return []; }
};

const parseTrackingHistory = (raw) => {
  try { return typeof raw === "string" ? JSON.parse(raw || "[]") : (Array.isArray(raw) ? raw : []); }
  catch { return []; }
};

const inp = {
  padding: "0.65rem 1rem", borderRadius: 9, border: "1.5px solid #e9d5ff",
  fontSize: "0.95rem", outline: "none", background: "#fff",
  width: "100%", boxSizing: "border-box",
};

let _jsQR = null;
const loadJsQR = () => new Promise((resolve, reject) => {
  if (_jsQR) return resolve(_jsQR);
  if (window.jsQR) { _jsQR = window.jsQR; return resolve(_jsQR); }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js";
  s.onload = () => { _jsQR = window.jsQR; resolve(_jsQR); };
  s.onerror = () => reject(new Error("jsQR failed to load"));
  document.head.appendChild(s);
});

// ── Internal IDs: the IDs YOU generate — NEVER overwritten ──
const getInternalIds = (order, source) => {
  const ids = [];
  if (source === "dm" && order.order_id)
    ids.push({ label: "DM ID",    value: order.order_id,         color: "#9d174d", bg: "#fce7f3" });
  if (order.temp_tracking_id)
    ids.push({ label: "Internal", value: order.temp_tracking_id, color: "#5b21b6", bg: "#ede9fe" });
  return ids;
};

// ── Courier IDs: only the real courier tracking IDs ──
const getCourierIds = (order) => {
  const current = order.tracking_id || null;
  const history = parseTrackingHistory(order.tracking_ids_history);
  const all = current
    ? [current, ...history.filter(h => h !== current)]
    : history;
  return { current, all };
};

const InternalIdBadges = ({ order, source, size = "md" }) => {
  const ids = getInternalIds(order, source);
  if (!ids.length) return null;
  const fs  = size === "sm" ? "0.71rem" : "0.8rem";
  const pad = size === "sm" ? "2px 7px"  : "3px 10px";
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center" }}>
      {ids.map(({ label, value, color, bg }) => (
        <span key={label} style={{
          background: bg, color, fontFamily: "monospace",
          fontWeight: 800, fontSize: fs, borderRadius: 6, padding: pad,
          border: `1px solid ${color}33`,
        }}>🔒 {label}: {value}</span>
      ))}
    </div>
  );
};

const CourierIdBadges = ({ order, size = "md" }) => {
  const { current, all } = getCourierIds(order);
  if (!all.length) return null;
  const fs  = size === "sm" ? "0.71rem" : "0.8rem";
  const pad = size === "sm" ? "2px 7px"  : "3px 10px";
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center" }}>
      {all.map((id, i) => (
        <span key={i} style={{
          background: id === current ? "#eff6ff" : "#f8fafc",
          color: id === current ? C.blue : "#64748b",
          fontFamily: "monospace", fontWeight: id === current ? 800 : 600,
          fontSize: fs, borderRadius: 6, padding: pad,
          border: `1px solid ${id === current ? "#bfdbfe" : "#e2e8f0"}`,
          textDecoration: id === current ? "none" : "line-through",
          opacity: id === current ? 1 : 0.7,
        }}>
          {id === current ? "🚚" : "⬜"} {id}
        </span>
      ))}
    </div>
  );
};

export default function ScannerPage() {
  const [tab, setTab] = useState("scanner"); // "scanner" | "allorders"

  // ── Scanner state ──
  const [pendingOrder, setPendingOrder]   = useState(null);
  const [idInput, setIdInput]             = useState("");
  const [trackInput, setTrackInput]       = useState(""); // always starts empty
  const [idLoading, setIdLoading]         = useState(false);
  const [idError, setIdError]             = useState("");
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [sessionOrders, setSessionOrders] = useState([]);
  const [bulkStatus, setBulkStatus]       = useState("shipped");
  const [bulkSaving, setBulkSaving]       = useState(false);

  // ── Camera ──
  const [cameraOn, setCameraOn]   = useState(false);
  const [camStep, setCamStep]     = useState("id");
  const [cameraErr, setCameraErr] = useState("");
  const [lastScan, setLastScan]   = useState("");

  // ── All orders with courier IDs (tab 2) ──
  const [allOrders, setAllOrders]         = useState([]);
  const [allLoading, setAllLoading]       = useState(false);
  const [allSearch, setAllSearch]         = useState("");
  const [allStatusFilter, setAllStatusFilter] = useState("all");

  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const streamRef       = useRef(null);
  const rafRef          = useRef(null);
  const coolRef         = useRef({});
  const cameraOnRef     = useRef(false);
  const camStepRef      = useRef("id");
  const pendingOrderRef = useRef(null);
  const jsQRRef         = useRef(null);
  const doScanIdRef     = useRef(null);
  const setTrackRef     = useRef(null);
  const showToastRef    = useRef(null);
  const setLastScanRef  = useRef(null);
  const idInputRef      = useRef(null);
  const trackInputRef   = useRef(null);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => { camStepRef.current = camStep; },           [camStep]);
  useEffect(() => { pendingOrderRef.current = pendingOrder; }, [pendingOrder]);
  useEffect(() => { cameraOnRef.current = cameraOn; },         [cameraOn]);
  useEffect(() => { showToastRef.current = showToast; },       [showToast]);
  useEffect(() => { setTrackRef.current = setTrackInput; },    []);
  useEffect(() => { setLastScanRef.current = setLastScan; },   []);

  useEffect(() => {
    const step = pendingOrder ? "tracking" : "id";
    setCamStep(step); camStepRef.current = step;
  }, [pendingOrder]);

  useEffect(() => () => { stopCamera(); clearTimeout(toastTimerRef.current); }, []);

  // ── Fetch all orders that have a courier tracking ID ──
  const fetchAllWithCourier = useCallback(async () => {
    setAllLoading(true);
    const [{ data: wsData }, { data: dmData }] = await Promise.all([
      supabase.from("orders").select("*").not("tracking_id", "is", null).order("created_at", { ascending: false }),
      supabase.from("dm_orders").select("*").not("tracking_id", "is", null).order("created_at", { ascending: false }),
    ]);
    const ws = (wsData || []).map(o => ({ order: o, source: "website", saving: false, editTrack: o.tracking_id || "" }));
    const dm = (dmData || []).map(o => ({ order: o, source: "dm",     saving: false, editTrack: o.tracking_id || "" }));
    // merge: website first then dm, sorted by created_at
    const merged = [...ws, ...dm].sort((a, b) => new Date(b.order.created_at) - new Date(a.order.created_at));
    setAllOrders(merged);
    setAllLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "allorders") fetchAllWithCourier();
  }, [tab, fetchAllWithCourier]);

  const buildHistory = (order, newCourierId) => {
    const existingHistory = parseTrackingHistory(order.tracking_ids_history);
    const existingCurrent = order.tracking_id || null;
    const allPrevious = existingCurrent
      ? [existingCurrent, ...existingHistory.filter(h => h !== existingCurrent)]
      : existingHistory;
    return newCourierId
      ? [newCourierId, ...allPrevious.filter(h => h !== newCourierId)]
      : allPrevious;
  };

  const fetchOrder = async (raw) => {
    const upper = raw.trim().toUpperCase();
    const [{ data: wsData }, { data: dmData }] = await Promise.all([
      supabase.from("orders").select("*")
        .or(`temp_tracking_id.eq.${upper},tracking_id.eq.${upper}`),
      supabase.from("dm_orders").select("*")
        .or(`order_id.eq.${upper},tracking_id.eq.${upper},temp_tracking_id.eq.${upper}`),
    ]);
    const ws = wsData?.[0] || null;
    const dm = dmData?.[0] || null;
    if (!ws && !dm) return null;
    return ws ? { order: ws, source: "website" } : { order: dm, source: "dm" };
  };

  const doScanId = useCallback(async (rawOverride) => {
    const raw = (rawOverride !== undefined ? String(rawOverride) : idInput).trim().toUpperCase();
    if (!raw) return;
    if (pendingOrderRef.current) return;
    setIdLoading(true); setIdError("");
    const found = await fetchOrder(raw);
    setIdLoading(false);
    if (!found) { setIdError(`No order found for "${raw}"`); return; }
    setPendingOrder({ ...found, scannedId: raw });
    setIdInput("");
    setTrackInput(""); // ← always empty — user types courier ID fresh every time
    showToast("✅ Order found — enter Courier Tracking ID on the right");
    setTimeout(() => trackInputRef.current?.focus(), 150);
  }, [idInput, showToast]);

  useEffect(() => { doScanIdRef.current = doScanId; }, [doScanId]);

  // Saves courier tracking ID + history + status — NEVER touches internal IDs
  const handleConfirm = async () => {
    if (!pendingOrder || confirmSaving) return;
    const { order, source } = pendingOrder;
    const newCourierId = trackInput.trim().toUpperCase() || null;
    setConfirmSaving(true);

    const newHistory = buildHistory(order, newCourierId);
    const updates = {
      tracking_id:          newCourierId,
      tracking_ids_history: JSON.stringify(newHistory),
      logistics_status:     order.logistics_status || "processing",
    };

    let error;
    if (source === "dm") {
      ({ error } = await supabase.from("dm_orders").update(updates).eq("order_id", order.order_id));
    } else {
      ({ error } = await supabase.from("orders").update(updates).eq("id", order.id));
    }
    setConfirmSaving(false);
    if (error) { showToast("❌ " + error.message, false); return; }

    const uidKey = source === "dm" ? order.order_id : String(order.id);
    const updatedOrder = { ...order, ...updates };
    const sessionEntry = {
      ...pendingOrder, order: updatedOrder,
      selected: true, newStatus: updatedOrder.logistics_status,
      newTrackingId: newCourierId || "", saving: false,
    };

    setSessionOrders(prev => {
      const exists = prev.some(r => uidOf(r) === uidKey);
      return exists
        ? prev.map(r => uidOf(r) === uidKey ? sessionEntry : r)
        : [sessionEntry, ...prev];
    });

    showToast(`✅ Saved! Internal ID kept · Courier → ${newCourierId || "(none)"}`);
    setPendingOrder(null);
    setTrackInput("");
    setTimeout(() => idInputRef.current?.focus(), 100);
  };

  // ── Camera tick ──
  const tickRef = useRef(null);
  tickRef.current = () => {
    if (!cameraOnRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const fn     = jsQRRef.current || _jsQR || window.jsQR;
    if (!video || !canvas || !fn || video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(() => tickRef.current?.());
      return;
    }
    const w = video.videoWidth, h = video.videoHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, w, h);
    const code = fn(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
    if (code?.data) {
      const raw = code.data.trim().toUpperCase();
      const now = Date.now();
      const key = camStepRef.current + ":" + raw;
      if (!coolRef.current[key] || now - coolRef.current[key] > 3500) {
        coolRef.current[key] = now;
        setLastScanRef.current?.(raw);
        if (camStepRef.current === "id") {
          if (!pendingOrderRef.current) doScanIdRef.current?.(raw);
        } else {
          setTrackRef.current?.(raw);
          showToastRef.current?.("📷 Courier ID scanned: " + raw);
        }
      }
    }
    rafRef.current = requestAnimationFrame(() => tickRef.current?.());
  };

  const startCamera = async () => {
    setCameraErr(""); setLastScan("");
    try { await loadJsQR(); jsQRRef.current = _jsQR || window.jsQR; }
    catch { setCameraErr("Could not load barcode library."); return; }
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
    } catch {
      try { stream = await navigator.mediaDevices.getUserMedia({ video: true }); }
      catch (err) { setCameraErr("Camera blocked: " + err.message); return; }
    }
    streamRef.current = stream; cameraOnRef.current = true; setCameraOn(true);
    requestAnimationFrame(() => {
      const video = videoRef.current;
      if (!video) { setCameraErr("Video element missing."); stopCamera(); return; }
      video.srcObject = stream; video.muted = true;
      const onCanPlay = () => {
        video.removeEventListener("canplay", onCanPlay);
        video.play().catch(e => setCameraErr("Playback failed: " + e.message));
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => tickRef.current?.());
      };
      video.addEventListener("canplay", onCanPlay);
      video.load();
    });
  };

  const stopCamera = () => {
    cameraOnRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false); setLastScan("");
  };

  // ── Session helpers ──
  const uidOf      = (r) => r.source === "dm" ? r.order.order_id : String(r.order.id);
  const toggleSel  = (u) => setSessionOrders(p => p.map(r => uidOf(r) === u ? { ...r, selected: !r.selected } : r));
  const selectAll  = ()  => setSessionOrders(p => p.map(r => ({ ...r, selected: true })));
  const deselectAll= ()  => setSessionOrders(p => p.map(r => ({ ...r, selected: false })));
  const removeRow  = (u) => setSessionOrders(p => p.filter(r => uidOf(r) !== u));
  const updField   = (u, field, val) => setSessionOrders(p => p.map(r => uidOf(r) === u ? { ...r, [field]: val } : r));
  const selectedCt = sessionOrders.filter(r => r.selected).length;

  const updateStatus = async (order, source, newSt, isAllTab = false) => {
    let error;
    if (source === "dm") ({ error } = await supabase.from("dm_orders").update({ logistics_status: newSt }).eq("order_id", order.order_id));
    else ({ error } = await supabase.from("orders").update({ logistics_status: newSt }).eq("id", order.id));
    if (error) { showToast("❌ " + error.message, false); return; }
    const uid = source === "dm" ? order.order_id : String(order.id);
    if (isAllTab) {
      setAllOrders(p => p.map(r => {
        const ruid = r.source === "dm" ? r.order.order_id : String(r.order.id);
        return ruid === uid ? { ...r, order: { ...r.order, logistics_status: newSt } } : r;
      }));
    } else {
      setSessionOrders(p => p.map(r => uidOf(r) === uid
        ? { ...r, newStatus: newSt, order: { ...r.order, logistics_status: newSt } } : r
      ));
    }
    showToast("✅ " + STATUS_COLORS[newSt]?.label + " — live now");
  };

  const saveCourierTracking = async (order, source, trackVal, isAllTab = false) => {
    const newCourierId = trackVal.trim().toUpperCase() || null;
    const newHistory   = buildHistory(order, newCourierId);
    const updates = {
      tracking_id:          newCourierId,
      tracking_ids_history: JSON.stringify(newHistory),
    };
    let error;
    if (source === "dm") ({ error } = await supabase.from("dm_orders").update(updates).eq("order_id", order.order_id));
    else ({ error } = await supabase.from("orders").update(updates).eq("id", order.id));
    if (error) { showToast("❌ " + error.message, false); return; }
    const uid = source === "dm" ? order.order_id : String(order.id);
    if (isAllTab) {
      setAllOrders(p => p.map(r => {
        const ruid = r.source === "dm" ? r.order.order_id : String(r.order.id);
        return ruid === uid ? { ...r, editTrack: newCourierId || "", order: { ...r.order, ...updates } } : r;
      }));
    } else {
      setSessionOrders(p => p.map(r => uidOf(r) === uid
        ? { ...r, newTrackingId: newCourierId || "", order: { ...r.order, ...updates } } : r
      ));
    }
    showToast("✅ Courier ID saved & history kept — live on tracking page!");
  };

  const bulkSave = async () => {
    const sel = sessionOrders.filter(r => r.selected);
    if (!sel.length) { showToast("⚠️ Nothing selected", false); return; }
    setBulkSaving(true);
    await Promise.all(sel.map(async r => {
      const uid = uidOf(r);
      const updates = { logistics_status: bulkStatus };
      let error;
      if (r.source === "dm") ({ error } = await supabase.from("dm_orders").update(updates).eq("order_id", r.order.order_id));
      else ({ error } = await supabase.from("orders").update(updates).eq("id", r.order.id));
      if (!error) setSessionOrders(p => p.map(x => uidOf(x) === uid ? { ...x, newStatus: bulkStatus, order: { ...x.order, logistics_status: bulkStatus } } : x));
    }));
    setBulkSaving(false);
    showToast(`✅ ${sel.length} order(s) → ${STATUS_COLORS[bulkStatus]?.label}`);
  };

  const fmtDate = (ts) => ts
    ? new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
    : "—";

  const orderName = (r) => r.order.name || r.order.customer_name || "—";

  const Lbl = ({ text, color = C.soft }) => (
    <div style={{ fontSize: "0.62rem", color, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>{text}</div>
  );

  const QuickMarkButtons = ({ order, source, isAllTab = false }) => {
    const st = order.logistics_status;
    const btn = (label, bg, color, val) =>
      st !== val && (
        <button key={val} onClick={() => updateStatus(order, source, val, isAllTab)} style={{
          padding: "0.3rem 0.65rem", fontSize: "0.69rem",
          background: bg, color, border: "none", borderRadius: 7,
          fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
        }}>{label}</button>
      );
    return (
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
        {btn("✅ Delivered",        "#bbf7d0", "#14532d", "delivered")}
        {btn("🛵 Out for Delivery", "#fef3c7", "#92400e", "out_for_delivery")}
        {btn("📥 Return Received",  "#fde8d8", "#9a3412", "return_received")}
        {btn("↩️ Returned",         "#fee2e2", "#991b1b", "returned")}
        {btn("🚚 Shipped",          "#d1fae5", "#065f46", "shipped")}
        {btn("📫 Packed",           "#e0e7ff", "#3730a3", "packed")}
      </div>
    );
  };

  // ── Unified order card ──
  const OrderCard = ({ r, showCheckbox = false, isAllTab = false }) => {
    const u     = isAllTab
      ? (r.source === "dm" ? r.order.order_id : String(r.order.id))
      : uidOf(r);
    const items    = parseItems(r.order.items);
    const trackVal = isAllTab
      ? (r.editTrack !== undefined ? r.editTrack : (r.order.tracking_id || ""))
      : (r.newTrackingId !== undefined ? r.newTrackingId : (r.order.tracking_id || ""));

    const setTrackVal = (val) => {
      if (isAllTab) {
        setAllOrders(p => p.map(x => {
          const xuid = x.source === "dm" ? x.order.order_id : String(x.order.id);
          return xuid === u ? { ...x, editTrack: val } : x;
        }));
      } else {
        updField(u, "newTrackingId", val);
      }
    };

    return (
      <div style={{
        background: "#fff",
        border: `1.5px solid ${(!isAllTab && r.selected) ? C.mid : C.border}`,
        borderRadius: 12, overflow: "hidden",
        boxShadow: (!isAllTab && r.selected) ? "0 0 0 2px #ede9fe" : "0 2px 8px rgba(147,51,234,0.06)",
      }}>
        {/* Header */}
        <div style={{
          padding: "0.75rem 1rem",
          background: (!isAllTab && r.selected) ? "#faf5ff" : C.mist,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
            {showCheckbox && (
              <input type="checkbox" checked={r.selected} onChange={() => toggleSel(u)}
                style={{ width: 16, height: 16, accentColor: C.deep, cursor: "pointer", flexShrink: 0 }} />
            )}
            <span style={{ fontWeight: 700, color: C.text, fontSize: "0.86rem" }}>{orderName(r)}</span>
            <span style={{
              background: r.source === "dm" ? "#fce7f3" : "#eff6ff",
              color: r.source === "dm" ? "#9d174d" : "#1e40af",
              borderRadius: 999, padding: "2px 8px", fontSize: "0.67rem", fontWeight: 700,
            }}>{r.source === "dm" ? "💬 DM" : "🛒 Web"}</span>
            {r.order.city && <span style={{ color: C.soft, fontSize: "0.73rem" }}>{r.order.city}</span>}
            <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: C.soft }}>{fmtDate(r.order.created_at)}</span>
            {badge(r.order.logistics_status || "processing")}
            {showCheckbox && (
              <button onClick={() => removeRow(u)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", fontSize: "0.88rem", marginLeft: 2 }}>✕</button>
            )}
          </div>

          {/* Internal IDs — always shown, never editable */}
          <div style={{ marginBottom: "0.3rem" }}>
            <InternalIdBadges order={r.order} source={r.source} size="sm" />
          </div>

          {/* Courier IDs — current + history */}
          <CourierIdBadges order={r.order} size="sm" />
        </div>

        {/* Body */}
        <div style={{ padding: "0.75rem 1rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.45rem", fontSize: "0.81rem" }}>
            {(r.order.phone || r.order.customer_phone) && (
              <div><span style={{ color: C.soft, fontSize: "0.69rem" }}>Phone </span><span style={{ fontWeight: 700, color: C.text }}>{r.order.phone || r.order.customer_phone}</span></div>
            )}
            {r.order.total && (
              <div><span style={{ color: C.soft, fontSize: "0.69rem" }}>Total </span><span style={{ fontWeight: 700, color: C.text }}>Rs {Number(r.order.total).toLocaleString()}</span></div>
            )}
          </div>

          {items.length > 0 && (
            <div style={{ fontSize: "0.73rem", color: C.soft, marginBottom: "0.5rem" }}>
              {items.map((it, j) => <span key={j}>{it.name} × {it.quantity || 1}{j < items.length - 1 ? " · " : ""}</span>)}
            </div>
          )}

          {/* Quick mark */}
          <div style={{ padding: "0.5rem 0.65rem", background: "#faf5ff", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "0.6rem", color: C.soft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: "0.35rem" }}>
              Quick Mark — saves &amp; goes live instantly
            </div>
            <QuickMarkButtons order={r.order} source={r.source} isAllTab={isAllTab} />
          </div>

          {/* Courier tracking edit + status dropdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", alignItems: "end" }}>
            <div>
              <Lbl text="Courier Tracking ID" color={C.blue} />
              <div style={{ display: "flex", gap: "0.28rem" }}>
                <input
                  value={trackVal}
                  onChange={e => setTrackVal(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter") saveCourierTracking(r.order, r.source, trackVal, isAllTab); }}
                  placeholder="PP1234…"
                  style={{ ...inp, fontSize: "0.74rem", padding: "0.37rem 0.55rem", fontFamily: "monospace", fontWeight: 700, color: C.blue, borderColor: C.blueBorder }}
                />
                <button onClick={() => saveCourierTracking(r.order, r.source, trackVal, isAllTab)} style={{
                  padding: "0.37rem 0.55rem", background: "#eff6ff", color: C.blue,
                  border: `1px solid ${C.blueBorder}`, borderRadius: 7,
                  fontWeight: 700, fontSize: "0.71rem", cursor: "pointer", whiteSpace: "nowrap",
                }}>Save</button>
              </div>
            </div>
            <div>
              <Lbl text="Status" />
              <select
                value={r.order.logistics_status || "processing"}
                onChange={e => updateStatus(r.order, r.source, e.target.value, isAllTab)}
                style={{ ...inp, fontSize: "0.74rem", padding: "0.37rem 0.55rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Filtered all-orders list ──
  const filteredAllOrders = allOrders.filter(r => {
    const q = allSearch.trim().toLowerCase();
    const o = r.order;
    const matchSearch = !q || [
      o.tracking_id, o.temp_tracking_id, o.order_id,
      o.name, o.customer_name, o.phone, o.customer_phone, o.city,
    ].some(v => (v || "").toLowerCase().includes(q));
    const matchStatus = allStatusFilter === "all" || o.logistics_status === allStatusFilter;
    return matchSearch && matchStatus;
  });

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ background: `linear-gradient(160deg,${C.mist} 0%,#fce7f3 100%)`, minHeight: "100vh" }}>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#064e3b" : "#7f1d1d", color: "#fff",
          padding: "0.75rem 1.5rem", borderRadius: 12, fontWeight: 700,
          fontSize: "0.88rem", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>{toast.msg}</div>
      )}

      {/* Topbar */}
      <div style={{
        background: `linear-gradient(90deg,${C.deep} 0%,${C.pink} 100%)`,
        padding: "0 1.5rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", minHeight: 52,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.3rem" }}>📦</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>Scanner</span>
        </div>
        <Link to="/admin" style={{
          padding: "0.3rem 0.85rem", background: "rgba(255,255,255,0.15)",
          color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 8, fontSize: "0.82rem", textDecoration: "none",
        }}>← Dashboard</Link>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: 760, margin: "0 auto" }}>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "0.4rem", marginBottom: "1.5rem",
          background: "#fff", border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "0.35rem", width: "fit-content",
        }}>
          {[
            ["scanner",   "📦 Scan Session"],
            ["allorders", "🚚 All Courier Orders"],
          ].map(([key, lbl]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "0.45rem 1.1rem", borderRadius: 7, border: "none", cursor: "pointer",
              fontWeight: tab === key ? 700 : 400,
              background: tab === key ? C.deep : "transparent",
              color: tab === key ? "#fff" : C.text, fontSize: "0.85rem",
              display: "flex", alignItems: "center", gap: "0.35rem",
            }}>
              {lbl}
              {key === "scanner" && sessionOrders.length > 0 && (
                <span style={{ background: C.pink, color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: "0.68rem", fontWeight: 800 }}>
                  {sessionOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════ SCANNER TAB ═══════════════ */}
        {tab === "scanner" && (<>

          {/* Camera bar */}
          <div style={{
            background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "0.9rem 1.1rem", marginBottom: "1rem",
            display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
            boxShadow: "0 2px 12px rgba(147,51,234,0.07)",
          }}>
            <button onClick={cameraOn ? stopCamera : startCamera} style={{
              padding: "0.55rem 1.2rem",
              background: cameraOn ? "linear-gradient(135deg,#dc2626,#f97316)" : "linear-gradient(135deg,#0369a1,#0ea5e9)",
              color: "#fff", border: "none", borderRadius: 10,
              fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.45rem",
            }}>{cameraOn ? "⏹ Stop Camera" : "📷 Open Camera"}</button>
            {cameraOn && (<>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {[["id","Scan Order ID",C.deep],["tracking","Scan Courier ID","#0369a1"]].map(([val,lbl,bg]) => (
                  <button key={val} onClick={() => { setCamStep(val); camStepRef.current = val; }} style={{
                    padding: "0.38rem 0.8rem", borderRadius: 7, border: "none",
                    background: camStep === val ? bg : "#e5e7eb",
                    color: camStep === val ? "#fff" : C.text,
                    fontWeight: 700, fontSize: "0.76rem", cursor: "pointer",
                  }}>{lbl}</button>
                ))}
              </div>
              {lastScan && <span style={{ fontSize: "0.72rem", color: C.soft, fontFamily: "monospace" }}>Last: <strong>{lastScan}</strong></span>}
            </>)}
            {!cameraOn && <span style={{ fontSize: "0.75rem", color: C.soft }}>Open camera to scan — or type below</span>}
          </div>

          {/* Camera viewport */}
          {cameraOn && (
            <div style={{ marginBottom: "1.25rem", borderRadius: 14, overflow: "hidden", background: "#111", position: "relative", boxShadow: "0 6px 28px rgba(0,0,0,0.35)" }}>
              {cameraErr ? (
                <div style={{ padding: "1.25rem 1.5rem", background: "#fee2e2", color: "#991b1b", fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.6 }}>
                  ❌ {cameraErr}<br />
                  <button onClick={() => { setCameraErr(""); setCameraOn(false); cameraOnRef.current = false; setTimeout(startCamera, 100); }}
                    style={{ marginTop: "0.75rem", padding: "0.4rem 1rem", background: "#991b1b", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, cursor: "pointer", fontSize: "0.82rem" }}>Retry</button>
                </div>
              ) : (<>
                <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", maxHeight: 300, objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div style={{ width: 240, height: 140, border: `3px solid ${camStep==="id"?"#a855f7":"#0ea5e9"}`, borderRadius: 12, boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)", position: "relative" }}>
                    {[
                      {top:-3,left:-3,    borderTop:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`,borderLeft:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`},
                      {top:-3,right:-3,   borderTop:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`,borderRight:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`},
                      {bottom:-3,left:-3, borderBottom:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`,borderLeft:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`},
                      {bottom:-3,right:-3,borderBottom:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`,borderRight:`5px solid ${camStep==="id"?"#ec4899":"#38bdf8"}`},
                    ].map((s,i) => <div key={i} style={{ position:"absolute",width:20,height:20,borderRadius:3,...s }} />)}
                    <div style={{ position:"absolute",left:6,right:6,top:"10%",height:2,background:`linear-gradient(90deg,transparent,${camStep==="id"?"#a855f7":"#0ea5e9"},transparent)`,animation:"scanLine 1.8s ease-in-out infinite" }} />
                  </div>
                </div>
                <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:"0.73rem",fontWeight:600,padding:"0.45rem 1rem",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span>🟢 {camStep==="id"?(pendingOrder?"Order loaded — switch to 'Scan Courier ID'":"Point at Order ID barcode / QR"):"Point at Courier Tracking barcode"}</span>
                  {lastScan && <span style={{ fontFamily:"monospace",color:"#c4b5fd" }}>{lastScan}</span>}
                </div>
              </>)}
            </div>
          )}

          {/* Dual input panel */}
          <div style={{
            background: "#fff", border: `1.5px solid ${C.border}`,
            borderRadius: 14, overflow: "hidden", marginBottom: "1rem",
            boxShadow: "0 4px 20px rgba(147,51,234,0.08)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

              {/* LEFT — Internal Order ID */}
              <div style={{ padding: "1.1rem 1.1rem 0.9rem", borderRight: `1.5px solid ${C.border}`, background: pendingOrder ? "#f9f9f9" : "#fff", opacity: pendingOrder ? 0.45 : 1, transition: "opacity 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem" }}>
                  <span style={{ background: pendingOrder ? "#d1d5db" : C.deep, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 800, flexShrink: 0 }}>1</span>
                  <span style={{ fontWeight: 700, color: pendingOrder ? "#9ca3af" : C.deep, fontSize: "0.82rem" }}>Internal Order ID</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: C.soft, marginBottom: "0.65rem" }}>DM Order ID · Temp ID · ORD-… ID</div>
                <form onSubmit={e => { e.preventDefault(); doScanId(); }} style={{ display: "flex", gap: "0.4rem" }}>
                  <input ref={idInputRef} value={idInput} onChange={e => setIdInput(e.target.value.toUpperCase())} placeholder="ORD-EXWOFO · DM-1234…"
                    style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: "0.82rem", padding: "0.5rem 0.75rem", letterSpacing: "0.03em" }}
                    disabled={!!pendingOrder} autoFocus />
                  <button type="submit" disabled={idLoading || !!pendingOrder} style={{
                    padding: "0.5rem 0.85rem", background: pendingOrder ? "#e5e7eb" : `linear-gradient(135deg,${C.deep},${C.pink})`,
                    color: pendingOrder ? "#9ca3af" : "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem",
                    cursor: (idLoading || pendingOrder) ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                  }}>{idLoading ? "…" : "Find"}</button>
                </form>
                {idError && <div style={{ marginTop: "0.5rem", background: "#fee2e2", color: "#991b1b", borderRadius: 7, padding: "0.4rem 0.7rem", fontSize: "0.78rem", fontWeight: 600 }}>{idError}</div>}
              </div>

              {/* RIGHT — Courier Tracking ID (always empty when order first loaded) */}
              <div style={{ padding: "1.1rem 1.1rem 0.9rem", background: pendingOrder ? "#f0f9ff" : "#fafafa", opacity: pendingOrder ? 1 : 0.45, transition: "opacity 0.2s, background 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem" }}>
                  <span style={{ background: pendingOrder ? C.blue : "#d1d5db", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 800, flexShrink: 0 }}>2</span>
                  <span style={{ fontWeight: 700, color: pendingOrder ? C.blue : "#9ca3af", fontSize: "0.82rem" }}>Courier Tracking ID</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: C.soft, marginBottom: "0.65rem" }}>
                  {pendingOrder
                    ? <>Type real courier ID here — press <strong>Enter ↵</strong> to save</>
                    : "Find an order first (Step 1) →"}
                </div>
                <input
                  ref={trackInputRef}
                  value={trackInput}
                  onChange={e => setTrackInput(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter" && pendingOrder) { e.preventDefault(); handleConfirm(); } }}
                  placeholder="PP1234567890PK · TCS-…"
                  style={{ ...inp, fontFamily: "monospace", fontSize: "0.82rem", padding: "0.5rem 0.75rem", letterSpacing: "0.03em", color: C.blue, borderColor: pendingOrder ? C.blueBorder : "#e9d5ff", background: pendingOrder ? "#fff" : "#f9fafb" }}
                  disabled={!pendingOrder}
                />
              </div>
            </div>

            {/* Pending order preview + confirm */}
            {pendingOrder && (() => {
              const { order, source } = pendingOrder;
              const items = parseItems(order.items);
              return (<>
                <div style={{ padding: "0.8rem 1.1rem", borderTop: `1.5px solid ${C.border}`, background: "linear-gradient(90deg,#ede9fe 0%,#fce7f3 100%)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {/* Internal IDs — always visible, never replaced */}
                  <InternalIdBadges order={order} source={source} size="md" />
                  {/* Previous courier IDs (history) */}
                  <CourierIdBadges order={order} size="md" />
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ background: source==="dm"?"#fce7f3":"#eff6ff", color: source==="dm"?"#9d174d":"#1e40af", borderRadius: 999, padding: "2px 9px", fontSize: "0.68rem", fontWeight: 700 }}>
                      {source==="dm"?"💬 DM":"🛒 Website"}
                    </span>
                    <span style={{ fontWeight: 700, color: C.text, fontSize: "0.84rem" }}>{order.name || order.customer_name || "—"}</span>
                    {order.city && <span style={{ color: C.soft, fontSize: "0.78rem" }}>{order.city}</span>}
                    {order.total && <span style={{ fontWeight: 700, color: C.deep }}>Rs {Number(order.total).toLocaleString()}</span>}
                    {badge(order.logistics_status || "processing")}
                    <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: C.soft }}>{fmtDate(order.created_at)}</span>
                  </div>
                  {items.length > 0 && (
                    <div style={{ fontSize: "0.73rem", color: C.soft }}>
                      {items.map((it,j) => `${it.name} ×${it.quantity||1}`).join(" · ")}
                    </div>
                  )}
                </div>

                <div style={{ padding: "0.4rem 1.1rem", background: "#fefce8", borderTop: "1px solid #fef08a", fontSize: "0.72rem", color: "#854d0e", fontWeight: 600 }}>
                  🔒 Internal ID (ORD-… / DM-…) is permanent and will NOT be changed. Only the Courier ID &amp; Status are saved.
                </div>

                <div style={{ padding: "0.75rem 1.1rem", borderTop: `1px solid ${C.border}`, background: "#fff", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <button onClick={handleConfirm} disabled={confirmSaving} style={{
                    flex: 1, padding: "0.72rem",
                    background: confirmSaving ? "#9ca3af" : `linear-gradient(135deg,${C.deep},${C.pink})`,
                    color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem",
                    cursor: confirmSaving ? "not-allowed" : "pointer",
                  }}>{confirmSaving ? "Saving…" : "✅ Confirm & Save — Courier ID + Internal ID both live on tracking page"}</button>
                  <button onClick={() => { setPendingOrder(null); setTrackInput(""); setIdError(""); setTimeout(() => idInputRef.current?.focus(), 50); }}
                    style={{ padding: "0.72rem 1rem", background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>✕ Cancel</button>
                </div>
                <div style={{ textAlign: "center", paddingBottom: "0.6rem" }}>
                  <button onClick={() => { setTrackInput(""); setTimeout(handleConfirm, 0); }}
                    style={{ background: "none", border: "none", color: C.soft, fontSize: "0.73rem", cursor: "pointer", textDecoration: "underline" }}>
                    Skip — save without courier tracking ID for now
                  </button>
                </div>
              </>);
            })()}
          </div>

          {/* Session bulk bar + list */}
          {sessionOrders.length > 0 && (<>
            <div style={{
              background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 12,
              padding: "0.8rem 1rem", marginBottom: "0.8rem",
              display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap",
              boxShadow: "0 2px 12px rgba(147,51,234,0.07)",
            }}>
              <span style={{ fontWeight: 700, color: C.deep, fontSize: "0.82rem" }}>
                Session: {sessionOrders.length}
                {selectedCt > 0 && <span style={{ color: C.pink }}> · {selectedCt} selected</span>}
              </span>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button onClick={selectAll}    style={{ padding: "0.28rem 0.6rem", fontSize: "0.72rem", borderRadius: 6, border: `1px solid ${C.border}`, background: C.mist, color: C.text, cursor: "pointer", fontWeight: 600 }}>All</button>
                <button onClick={deselectAll}  style={{ padding: "0.28rem 0.6rem", fontSize: "0.72rem", borderRadius: 6, border: `1px solid ${C.border}`, background: C.mist, color: C.text, cursor: "pointer", fontWeight: 600 }}>None</button>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
                <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ fontSize: "0.78rem", padding: "0.3rem 0.55rem", borderRadius: 7, border: `1px solid ${C.border}`, cursor: "pointer", background: "#fff", color: C.text }}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
                </select>
                <button onClick={bulkSave} disabled={bulkSaving || selectedCt === 0} style={{
                  padding: "0.38rem 0.9rem", fontSize: "0.78rem",
                  background: selectedCt === 0 ? "#e5e7eb" : `linear-gradient(135deg,${C.deep},${C.pink})`,
                  color: selectedCt === 0 ? "#9ca3af" : "#fff",
                  border: "none", borderRadius: 8, fontWeight: 700,
                  cursor: selectedCt === 0 ? "not-allowed" : "pointer",
                }}>{bulkSaving ? "Saving…" : `✅ Bulk (${selectedCt})`}</button>
                <button onClick={() => setSessionOrders([])} style={{ padding: "0.38rem 0.65rem", fontSize: "0.78rem", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {sessionOrders.map(r => <OrderCard key={uidOf(r)} r={r} showCheckbox isAllTab={false} />)}
            </div>
          </>)}

          {!pendingOrder && sessionOrders.length === 0 && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.soft }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📭</div>
              <div style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>No orders in this session yet.<br />Type an Internal Order ID (ORD-… or DM-…) on the left to start.</div>
            </div>
          )}
        </>)}

        {/* ═══════════════ ALL COURIER ORDERS TAB ═══════════════ */}
        {tab === "allorders" && (<>
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.2rem", marginBottom: "1rem", boxShadow: "0 4px 20px rgba(147,51,234,0.07)" }}>
            <div style={{ fontWeight: 700, color: C.deep, fontSize: "0.95rem", marginBottom: "0.18rem" }}>🚚 All Orders with Courier Tracking ID</div>
            <div style={{ fontSize: "0.74rem", color: C.soft, marginBottom: "0.8rem" }}>
              Every order (website + DM) where a courier ID has been assigned — mark status, update courier ID live.
            </div>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
              <input value={allSearch} onChange={e => setAllSearch(e.target.value)} placeholder="Name · phone · ORD-… · PP123… · city…"
                style={{ ...inp, flex: 1, minWidth: 200 }} autoFocus />
              <select value={allStatusFilter} onChange={e => setAllStatusFilter(e.target.value)} style={{ fontSize: "0.82rem", padding: "0.5rem 0.75rem", borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer", background: "#fff", color: C.text }}>
                <option value="all">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s].label}</option>)}
              </select>
              <button onClick={fetchAllWithCourier} style={{ padding: "0.5rem 1rem", background: C.mist, color: C.deep, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap" }}>🔄 Refresh</button>
            </div>
          </div>

          {allLoading && (
            <div style={{ textAlign: "center", padding: "2rem", color: C.soft }}>Loading…</div>
          )}

          {!allLoading && allOrders.length === 0 && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.soft }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📭</div>
              <div style={{ fontSize: "0.88rem" }}>No orders have a courier tracking ID yet.</div>
            </div>
          )}

          {!allLoading && allOrders.length > 0 && (
            <div style={{ fontSize: "0.78rem", color: C.soft, marginBottom: "0.65rem", fontWeight: 600 }}>
              Showing {filteredAllOrders.length} of {allOrders.length} orders
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredAllOrders.map(r => {
              const key = r.source === "dm" ? r.order.order_id : String(r.order.id);
              return <OrderCard key={key} r={r} showCheckbox={false} isAllTab={true} />;
            })}
          </div>
        </>)}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
      <style>{`
        @keyframes scanLine {
          0%   { top: 8%;  opacity: 0.85; }
          50%  { top: 82%; opacity: 1;    }
          100% { top: 8%;  opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}