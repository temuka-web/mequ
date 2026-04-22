// src/pages/TrackOrder.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

const C = {
  deep: "#6b21a8", mid: "#9333ea", pink: "#db2777",
  mist: "#faf5ff", border: "#e9d5ff", text: "#3b0764", soft: "#a78bca",
};

const STATUS_STEPS = ["processing", "packed", "shipped", "delivered"];
const STATUS_INFO = {
  processing: { label: "Order Placed", icon: "📦", color: "#b45309", bg: "#fef9c3" },
  packed:     { label: "Packed",       icon: "📫", color: "#3730a3", bg: "#e0e7ff" },
  shipped:    { label: "Shipped",      icon: "🚚", color: "#065f46", bg: "#d1fae5" },
  delivered:  { label: "Delivered",    icon: "✅", color: "#14532d", bg: "#bbf7d0" },
  returned:   { label: "Returned",     icon: "↩️", color: "#991b1b", bg: "#fee2e2" },
};

const WHATSAPP_NO = "923028862284";
// ✅ FIXED: ep.gov.pk doesn't support pre-filled URLs — link to homepage only
const PAK_POST_URL = "https://ep.gov.pk/";

export default function TrackOrder() {
  const [trackingInput, setTrackingInput] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pakPostData, setPakPostData] = useState(null);
  const [pakPostLoading, setPakPostLoading] = useState(false);
  const [isPakPostOnly, setIsPakPostOnly] = useState(false);

  const fetchPakPostTracking = async (trackId) => {
    setPakPostLoading(true);
    setPakPostData(null);
    try {
      const res = await fetch("https://api.trackingmore.com/v4/trackings/realtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Tracking-Api-Key": "YOUR_TRACKINGMORE_API_KEY",
        },
        body: JSON.stringify({
          tracking_number: trackId,
          carrier_code: "pakistan-post",
        }),
      });
      const data = await res.json();
      if (data && data.data && data.data.items && data.data.items[0]) {
        setPakPostData(data.data.items[0]);
      }
    } catch (e) {
      console.error("Pak Post API error:", e);
    }
    setPakPostLoading(false);
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setPakPostData(null);
    setIsPakPostOnly(false);

    const input = trackingInput.trim().toUpperCase();

    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .or("tracking_id.eq." + input + ",temp_tracking_id.eq." + input)
      .single();

    setLoading(false);

    if (err || !data) {
      // Not found in our system — try Pak Post directly
      setIsPakPostOnly(true);
      fetchPakPostTracking(input);
      return;
    }

    setOrder(data);

    if (data.logistics_status === "shipped" || data.logistics_status === "delivered") {
      fetchPakPostTracking(input);
    }
  };

  const items = order
    ? (typeof order.items === "string" ? JSON.parse(order.items || "[]") : (order.items || []))
    : [];
  const status = order ? (order.logistics_status || "processing") : "processing";
  const statusInfo = STATUS_INFO[status] || STATUS_INFO.processing;
  const stepIndex = STATUS_STEPS.indexOf(status);
  const isReturned = status === "returned";
  const isShipped = status === "shipped" || status === "delivered";

  const waLink = order
    ? "https://wa.me/" + WHATSAPP_NO + "?text=Hi! I need real-time tracking for my order. My tracking ID is " + (order.tracking_id || "") + " and my name is " + (order.name || order.customer_name || "") + ", city " + (order.city || "")
    : "#";

  return (
    <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)", minHeight: "100vh" }}>

      <nav style={{ background: "#eae7dc", padding: "0.7rem 1.5rem", display: "flex", justifyContent: "center", borderBottom: "1px solid #d6d1c4", gap: "1.5rem", flexWrap: "wrap" }}>
        {[["Home", "/"], ["Catalogue", "/products"], ["Checkout", "/checkout"], ["Policies", "/policies"], ["Contact", "/contact"], ["Track Order", "/track"]].map(([label, to]) => (
          <Link key={to} to={to} style={{ textDecoration: "none", color: "#111", fontWeight: label === "Track Order" ? 700 : 500, fontSize: "0.9rem", borderBottom: label === "Track Order" ? "2px solid #c6338c" : "2px solid transparent", paddingBottom: "2px" }}>
            {label}
          </Link>
        ))}
      </nav>

      <div style={{ padding: "2rem 1rem 5rem", maxWidth: 560, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "2.5rem" }}>🚚</span>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", color: "#6b21a8", margin: "0.5rem 0 0.3rem" }}>Track Your Order</h1>
          <div style={{ color: "#a78bca", fontSize: "0.88rem" }}>Enter your Mequ order ID or your Pak Post tracking ID</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e9d5ff", borderRadius: 14, padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 20px rgba(147,51,234,0.08)" }}>
          <form onSubmit={handleTrack} style={{ display: "flex", gap: "0.6rem" }}>
            <input
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              placeholder="Enter your tracking ID"
              style={{ flex: 1, padding: "0.7rem 1rem", borderRadius: 9, border: "1.5px solid #e9d5ff", fontSize: "0.95rem", outline: "none", textTransform: "uppercase" }}
              onFocus={e => { e.target.style.borderColor = "#9333ea"; }}
              onBlur={e => { e.target.style.borderColor = "#e9d5ff"; }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "0.7rem 1.3rem", background: "linear-gradient(135deg, #6b21a8, #db2777)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {loading ? "…" : "Track"}
            </button>
          </form>
        </div>

        {/* Pak Post only result — ID not found in our system */}
        {isPakPostOnly && (
          <div style={{ background: "#fff", border: "1px solid #e9d5ff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(147,51,234,0.08)" }}>
            <div style={{ background: "#dbeafe", padding: "1.2rem 1.5rem", borderBottom: "1px solid #e9d5ff" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#1e40af" }}>🔍 Searching Pak Post live data…</div>
              <div style={{ fontSize: "0.78rem", color: "#1e40af", marginTop: 4, opacity: 0.8 }}>Tracking ID: {trackingInput.toUpperCase()}</div>
            </div>

            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e9d5ff" }}>
              {pakPostLoading && (
                <div style={{ fontSize: "0.85rem", color: "#a78bca" }}>Fetching live updates from Pak Post…</div>
              )}
              {!pakPostLoading && pakPostData && pakPostData.origin_info && pakPostData.origin_info.trackinfo && pakPostData.origin_info.trackinfo.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {pakPostData.origin_info.trackinfo.slice(0, 6).map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.82rem", padding: "0.4rem 0", borderBottom: "1px solid #e9d5ff" }}>
                      <span style={{ color: "#a78bca", whiteSpace: "nowrap", minWidth: 80 }}>{t.Date}</span>
                      <span style={{ color: "#3b0764" }}>{t.StatusDescription}</span>
                    </div>
                  ))}
                </div>
              )}
              {!pakPostLoading && (!pakPostData || !pakPostData.origin_info || !pakPostData.origin_info.trackinfo || pakPostData.origin_info.trackinfo.length === 0) && (
                <div style={{ fontSize: "0.85rem", color: "#3b0764" }}>
                  No live data found for this ID. It may take a moment for Pak Post to update — try tracking directly on their official website below.
                </div>
              )}
            </div>

            <div style={{ padding: "1rem 1.5rem", background: "#faf5ff" }}>
              <div style={{ fontSize: "0.78rem", color: "#a78bca", marginBottom: "0.6rem" }}>
                If this feels slow, head to the official Pak Post tracking website:
              </div>
              <div style={{ fontSize: "0.78rem", color: "#a78bca", marginBottom: "0.6rem" }}>
                Go to the official Pak Post website and enter your ID <strong style={{ color: "#3b0764" }}>{trackingInput.toUpperCase()}</strong> there:
              </div>
              <a
                href={PAK_POST_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "0.6rem 1.2rem", background: "linear-gradient(135deg, #6b21a8, #db2777)", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", textDecoration: "none" }}
              >
                Track on Pak Post official website →
              </a>
            </div>
          </div>
        )}

        {/* Our order result */}
        {order && (
          <div style={{ background: "#fff", border: "1px solid #e9d5ff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(147,51,234,0.08)" }}>

            <div style={{ background: statusInfo.bg, padding: "1.2rem 1.5rem", borderBottom: "1px solid #e9d5ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.8rem" }}>{statusInfo.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: statusInfo.color }}>{statusInfo.label}</div>
                  <div style={{ fontSize: "0.78rem", color: statusInfo.color, opacity: 0.8, marginTop: 2 }}>
                    Tracking ID: <strong>{order.tracking_id}</strong>
                  </div>
                </div>
              </div>
            </div>

            {isShipped && (
              <div style={{ background: "#d1fae5", padding: "1rem 1.5rem", borderBottom: "1px solid #e9d5ff", fontSize: "0.85rem", color: "#065f46" }}>
                <div style={{ fontWeight: 700, marginBottom: "0.4rem" }}>🚚 Your order has been shipped!</div>
                <div style={{ marginBottom: "0.4rem" }}>You'll receive it within 5–7 working days.</div>
                <div>
                  For real-time tracking contact{" "}
                  <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ color: "#065f46", fontWeight: 700, textDecoration: "underline" }}>
                    0302-8862284
                  </a>
                  {" "}and provide your name and city to get your Pak Post tracking ID.
                </div>
              </div>
            )}

            {!isReturned && (
              <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid #e9d5ff" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "#e9d5ff", transform: "translateY(-50%)", zIndex: 0 }} />
                  <div style={{ position: "absolute", top: "50%", left: 0, height: 3, background: "#9333ea", transform: "translateY(-50%)", zIndex: 1, width: String(Math.max(0, (stepIndex / (STATUS_STEPS.length - 1)) * 100)) + "%", transition: "width 0.5s ease" }} />
                  {STATUS_STEPS.map((s, i) => {
                    const info = STATUS_INFO[s];
                    const done = i <= stepIndex;
                    return (
                      <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 2 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "#9333ea" : "#fff", border: "2px solid " + (done ? "#9333ea" : "#e9d5ff"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#fff" }}>
                          {done ? "✓" : ""}
                        </div>
                        <span style={{ fontSize: "0.62rem", color: done ? "#6b21a8" : "#a78bca", fontWeight: done ? 700 : 400, textAlign: "center", maxWidth: 52 }}>
                          {info.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isShipped && (
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e9d5ff", background: "#faf5ff" }}>
                <div style={{ fontSize: "0.78rem", color: "#a78bca", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Live Pak Post Updates
                </div>
                {pakPostLoading && (
                  <div style={{ fontSize: "0.82rem", color: "#a78bca" }}>Fetching live updates…</div>
                )}
                {!pakPostLoading && pakPostData && pakPostData.origin_info && pakPostData.origin_info.trackinfo && pakPostData.origin_info.trackinfo.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {pakPostData.origin_info.trackinfo.slice(0, 5).map((t, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem" }}>
                        <span style={{ color: "#a78bca", whiteSpace: "nowrap" }}>{t.Date}</span>
                        <span style={{ color: "#3b0764" }}>{t.StatusDescription}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!pakPostLoading && !pakPostData && (
                  <div style={{ fontSize: "0.82rem", color: "#a78bca", marginBottom: "0.5rem" }}>
                    Live updates available once your Pak Post tracking ID is assigned. Contact us on WhatsApp to get your Pak Post ID.
                  </div>
                )}
                <a
                  href={PAK_POST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: "0.6rem", fontSize: "0.78rem", color: "#6b21a8", fontWeight: 700, textDecoration: "underline" }}
                >
                  If this feels slow, track on the official Pak Post website →
                </a>
              </div>
            )}

            <div style={{ padding: "1.2rem 1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
                {[
                  ["Name", order.name || order.customer_name],
                  ["City", order.city || (order.address ? order.address.split(",").slice(-1)[0].trim() : "—")],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: "#faf5ff", borderRadius: 8, padding: "0.65rem 0.85rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#a78bca", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 700, color: "#3b0764", fontSize: "0.9rem" }}>{val || "—"}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.78rem", color: "#a78bca", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Items</div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: i < items.length - 1 ? "1px solid #e9d5ff" : "none", fontSize: "0.85rem" }}>
                    <span style={{ color: "#3b0764" }}>{item.name}</span>
                    <span style={{ color: "#a78bca" }}>× {item.quantity || 1}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#faf5ff", borderRadius: 8, padding: "0.75rem 1rem" }}>
                <span style={{ fontWeight: 700, color: "#3b0764" }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#6b21a8" }}>Rs {Number(order.total || 0).toLocaleString()}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}