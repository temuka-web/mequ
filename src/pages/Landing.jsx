// src/pages/Landing.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const WHATSAPP_NUMBER = "923193128443";

// ── SVG Icon Components ───────────────────────────────────────────────────────
const Icon = {
  Gift: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  Cash: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Truck: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Globe: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  Zap: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Tag: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Cart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Package: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  SoldOut: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Star: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Warning: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

// ── Fuzzy category extractor ──────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  "Stickers":    ["sticker", "stickers", "decal", "decals", "vinyl"],
  "Bookmarks":   ["bookmark", "bookmarks", "book mark"],
  "Keychains":   ["keychain", "keychains", "key chain", "keyring"],
  "Posters":     ["poster", "posters", "print", "art print"],
  "Notebooks":   ["notebook", "notebooks", "journal", "planner", "diary"],
  "Bags":        ["bag", "bags", "tote", "pouch", "wallet"],
  "Accessories": ["accessory", "accessories", "bracelet", "necklace", "ring", "earring"],
  "Clothing":    ["shirt", "tshirt", "t-shirt", "hoodie", "sweatshirt", "jacket", "cap", "hat"],
  "Beauty":      ["lip", "gloss", "blush", "mascara", "eyeliner", "skincare", "serum", "moisturizer"],
  "Toys":        ["toy", "toys", "plush", "stuffed", "doll", "figurine"],
  "Tech":        ["cable", "charger", "phone", "case", "earbuds", "wireless"],
  "Home":        ["mug", "cup", "candle", "cushion", "pillow", "lamp", "clock"],
};

function detectCategory(name = "") {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Other";
}

// ── Checkout Tip Popup ────────────────────────────────────────────────────────
// Uses sessionStorage: shows once per fresh browser session.
// Navigating between pages won't retrigger it, but opening a new tab/session will.
const TIP_SESSION_KEY = "mequ_tip_seen";

const CheckoutTipPopup = ({ onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setVisible(false);
    sessionStorage.setItem(TIP_SESSION_KEY, "1");
    setTimeout(onClose, 350);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 1rem",
    }} onClick={close}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff",
        borderRadius: "20px 20px 16px 16px",
        width: "100%", maxWidth: 440,
        overflow: "hidden",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: "0 -8px 40px rgba(198,51,140,0.18)",
      }}>
        {/* Header stripe */}
        <div style={{
          background: "linear-gradient(135deg, #be185d 0%, #c6338c 60%, #f472b6 100%)",
          padding: "1.1rem 1.4rem 1rem",
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ color: "#fff", flexShrink: 0, opacity: 0.9 }}>
              <Icon.Info />
            </div>
            <span style={{
              color: "#fff", fontWeight: 800, fontSize: "0.95rem",
              letterSpacing: "-0.01em",
            }}>
              Quick tip before you shop
            </span>
          </div>
          <button onClick={close} style={{
            position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
            width: 28, height: 28, cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon.X />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.2rem 1.4rem 1.5rem" }}>
          <div style={{
            background: "#fdf2f8", border: "1.5px solid #f9a8d4",
            borderRadius: 12, padding: "1rem 1.1rem",
            display: "flex", gap: "0.8rem", alignItems: "flex-start",
            marginBottom: "1.2rem",
          }}>
            <div style={{
              background: "linear-gradient(135deg, #be185d, #c6338c)",
              color: "#fff", borderRadius: 8,
              padding: "0.45rem", flexShrink: 0, marginTop: 1,
            }}>
              <Icon.Package />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111", marginBottom: "0.3rem" }}>
                Have a custom preference?
              </div>
              <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>
                Specify your type, colour, design, or any preference in the{" "}
                <strong style={{ color: "#c6338c" }}>Notes</strong> field at checkout —
                we'll do our best to match it from available stock.
              </div>
            </div>
          </div>

          <button onClick={close} style={{
            width: "100%", padding: "0.78rem",
            background: "linear-gradient(135deg, #be185d, #c6338c)",
            color: "#fff", border: "none", borderRadius: 10,
            fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            letterSpacing: "0.02em",
            boxShadow: "0 4px 14px rgba(198,51,140,0.35)",
          }}>
            Got it, let's shop →
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Flying dot animation ──────────────────────────────────────────────────────
const FlyingDot = ({ dot }) => {
  const dx = dot.endX - dot.startX;
  const dy = dot.endY - dot.startY;
  return (
    <div style={{
      position: "fixed", left: dot.startX - 22, top: dot.startY - 22,
      width: 44, height: 44, borderRadius: "50%", overflow: "hidden",
      border: "2px solid #fff", boxShadow: "0 3px 12px rgba(0,0,0,0.3)",
      pointerEvents: "none", zIndex: 99999,
      animation: "flyToBag 0.78s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      "--fly-dx": `${dx}px`, "--fly-dy": `${dy}px`,
    }}>
      {dot.img
        ? <img src={dot.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: "#c6338c" }} />}
    </div>
  );
};

// ── Main Landing Component ────────────────────────────────────────────────────
const Landing = ({ cartItems = [], onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [flyingDots, setFlyingDots] = useState([]);

  // Show tip popup once per fresh browser session (sessionStorage resets on new tab/window open)
  const [showTip, setShowTip] = useState(
    () => !sessionStorage.getItem(TIP_SESSION_KEY)
  );

  const cartIconRef = useRef(null);
  const navigate = useNavigate();

  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);

  useEffect(() => {
    supabase.from("products").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => { if (!error) setProducts(data || []); });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => cats.add(detectCategory(p.name)));
    const sorted = Array.from(cats).filter((c) => c !== "Other").sort();
    if (cats.has("Other")) sorted.push("Other");
    return ["All", ...sorted];
  }, [products]);

  const resolveImg = (p) => {
    const raw = p.image || p.colors?.[0]?.imagePath || (typeof p.colors?.[0] === "string" ? p.colors[0] : "") || "";
    if (!raw) return "";
    const s = String(raw).trim();
    if (s.startsWith("http") || s.startsWith("/images/")) return s;
    return `/images/${s.replace(/^\/+/, "")}`;
  };

  const getProductQty = (p) => Number(p.totalQuantity ?? p.totalquantity ?? 0);
  const isProductAvailable = (p) => !p.soldOut && getProductQty(p) > 0;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === "All" || detectCategory(p.name) === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, activeCategory]);

  const featured = searchTerm || activeCategory !== "All" ? filteredProducts : products.slice(0, 8);

  const triggerFlyAnimation = (e, productImg) => {
    e.stopPropagation();
    const cartRect = cartIconRef.current?.getBoundingClientRect();
    if (!cartRect) return;
    const id = Date.now() + Math.random();
    setFlyingDots((prev) => [...prev, {
      id, startX: e.clientX, startY: e.clientY,
      endX: cartRect.left + cartRect.width / 2,
      endY: cartRect.top + cartRect.height / 2,
      img: productImg,
    }]);
    setTimeout(() => setFlyingDots((prev) => prev.filter((d) => d.id !== id)), 850);
  };

  const handleAddToCart = (e, p) => {
    e.stopPropagation();
    if (!isProductAvailable(p)) return;
    const imgSrc = resolveImg(p);
    if (typeof onAddToCart === "function") {
      onAddToCart({ id: p.id, name: p.name, price: p.price, image: imgSrc, quantity: 1 });
    }
    triggerFlyAnimation(e, imgSrc);
  };

  const announceItems = [
    "Free Gifts on all orders above Rs. 3,000", "Cash on Delivery available",
    "Worldwide Shipping", "Unbeatable Prices · No Extra Tax", "Imported Products", "Flash Deals",
  ];
  const track = [...announceItems, ...announceItems];

  const trustItems = [
    { Icon: Icon.Gift,  title: "Free Gift",          sub: "Orders above Rs. 3,000" },
    { Icon: Icon.Cash,  title: "Cash on Delivery",   sub: "Pay when it arrives" },
    { Icon: Icon.Truck, title: "Nationwide Shipping", sub: "We ship everywhere" },
    { Icon: Icon.Globe, title: "Imported Products",   sub: "Curated from abroad" },
    { Icon: Icon.Zap,   title: "Flash Deals",         sub: "Limited-time offers" },
    { Icon: Icon.Tag,   title: "0% Extra Tax",         sub: "Price you see is final" },
  ];

  return (
    <>
      {showTip && <CheckoutTipPopup onClose={() => setShowTip(false)} />}

      <div style={{ backgroundColor: "#fffdf4", minHeight: "100vh" }}>
        <style>{`
          @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes flyToBag {
            0% { transform: translate(0,0) scale(1); opacity: 1; }
            70% { opacity: 0.9; }
            100% { transform: translate(var(--fly-dx), var(--fly-dy)) scale(0.15); opacity: 0; }
          }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse-badge { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
          .lnd-card {
            transition: transform 0.22s ease, box-shadow 0.22s ease; cursor: pointer;
            border: 1px solid #e0ddd4; border-radius: 12px; background: #fff;
            overflow: hidden; display: flex; flex-direction: column;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05); animation: fadeInUp 0.4s ease both;
          }
          .lnd-card:hover { transform: translateY(-5px) scale(1.015); box-shadow: 0 14px 36px rgba(0,0,0,0.13) !important; }
          .lnd-card-imgwrap { overflow: hidden; position: relative; }
          .lnd-card-imgwrap img { transition: transform 0.38s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
          .lnd-card:hover .lnd-card-imgwrap img { transform: scale(1.08); }
          .lnd-add-btn {
            transition: background 0.18s, transform 0.12s; background: #111; color: #fff;
            border: none; border-radius: 7px; cursor: pointer; font-weight: 600;
            letter-spacing: 0.04em; width: 100%;
            display: flex; align-items: center; justify-content: center; gap: 4px;
          }
          .lnd-add-btn:hover:not(:disabled) { background: #c6338c !important; transform: scale(1.03); }
          .lnd-add-btn:disabled { background: #ddd !important; cursor: not-allowed !important; color: #aaa !important; }
          .lnd-trust-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
            background: #e0ddd4; border: 1px solid #e0ddd4; border-radius: 14px; overflow: hidden;
          }
          .lnd-trust-item { background: #fff; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.1rem; }
          .lnd-trust-icon { color: #111; flex-shrink: 0; display: flex; align-items: center; }
          .lnd-trust-title { font-size: 0.85rem; font-weight: 700; color: #111; line-height: 1.2; }
          .lnd-trust-sub { font-size: 0.72rem; color: #888; margin-top: 0.1rem; }
          .lnd-wa-btn {
            position: fixed; bottom: 1.5rem; right: 1.5rem; width: 52px; height: 52px;
            border-radius: 50%; background: #25D366; display: flex; align-items: center;
            justify-content: center; cursor: pointer; z-index: 9998;
            box-shadow: 0 4px 18px rgba(37,211,102,0.5); transition: transform 0.2s, box-shadow 0.2s; text-decoration: none;
          }
          .lnd-wa-btn:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(37,211,102,0.65); }
          .lnd-cart-btn {
            position: fixed; bottom: 5.2rem; right: 1.5rem; width: 52px; height: 52px;
            border-radius: 50%; background: #111; display: flex; align-items: center;
            justify-content: center; cursor: pointer; z-index: 9998;
            box-shadow: 0 4px 18px rgba(0,0,0,0.28); transition: transform 0.2s, box-shadow 0.2s;
          }
          .lnd-cart-btn:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(0,0,0,0.38); }
          .lnd-cart-badge {
            position: absolute; top: -4px; right: -4px; background: #c6338c; color: #fff;
            border-radius: 50%; width: 20px; height: 20px; font-size: 11px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            animation: pulse-badge 2s ease infinite;
          }
          .lnd-brand {
            font-size: clamp(2.4rem, 8vw, 4rem); font-weight: 800; letter-spacing: -0.04em;
            background: linear-gradient(135deg, #111 0%, #555 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; line-height: 1; margin: 0 0 0.15rem;
          }
          .lnd-section-heading { font-size: clamp(1rem, 3vw, 1.2rem); font-weight: 700; color: #111; margin: 0; letter-spacing: -0.01em; }
          .lnd-nav a {
            text-decoration: none; color: #111; font-weight: 500;
            font-size: clamp(0.82rem, 2.2vw, 0.96rem); padding: 0.25rem 0;
            border-bottom: 2px solid transparent; transition: border-color 0.15s;
          }
          .lnd-nav a:hover { border-bottom-color: #c6338c; }
          .lnd-cat-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
          .lnd-cat-chip {
            padding: 0.28rem 0.85rem; border-radius: 100px; font-size: 0.78rem; font-weight: 600;
            border: 1.5px solid #ddd; background: #fff; color: #555; cursor: pointer;
            transition: all 0.15s; white-space: nowrap;
          }
          .lnd-cat-chip:hover { border-color: #c6338c; color: #c6338c; }
          .lnd-cat-chip.active { background: #111; color: #fff; border-color: #111; }
          .lnd-sold-badge {
            position: absolute; top: 0.45rem; left: 0.45rem;
            background: rgba(0,0,0,0.85); color: #fff; font-size: 0.58rem; font-weight: 700;
            letter-spacing: 0.06em; text-transform: uppercase;
            padding: 0.18rem 0.45rem; border-radius: 4px; pointer-events: none;
            display: flex; align-items: center; gap: 3px;
          }
          .lnd-low-badge {
            display: inline-flex; align-items: center; gap: 3px;
            margin: 0; font-size: 0.65rem; color: #b45309; font-weight: 600;
          }
          .lnd-star { color: #f0c040; display: inline-flex; align-items: center; }
          @media (max-width: 900px) {
            .lnd-pgrid { grid-template-columns: repeat(3, 1fr) !important; }
            .lnd-trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 560px) {
            .lnd-pgrid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.6rem !important; }
            .lnd-trust-grid { grid-template-columns: repeat(1, 1fr) !important; }
          }
        `}</style>

        {flyingDots.map((dot) => <FlyingDot key={dot.id} dot={dot} />)}

        {/* Cart FAB */}
        <div ref={cartIconRef} className="lnd-cart-btn" onClick={() => navigate("/checkout")} title="View Cart">
          <Icon.Cart />
          {cartCount > 0 && <span className="lnd-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>}
        </div>

        {/* WhatsApp FAB */}
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="lnd-wa-btn" title="Chat on WhatsApp">
          <Icon.WhatsApp />
        </a>

        {/* Marquee */}
        <div style={{ width: "100%", backgroundColor: "#111", color: "#fff", overflow: "hidden", whiteSpace: "nowrap", padding: "9px 0", fontSize: "clamp(11px, 2.4vw, 13px)", letterSpacing: "0.04em" }}>
          <div style={{ display: "inline-flex", animation: "marquee 32s linear infinite", willChange: "transform" }}>
            {track.map((t, i) => (
              <span key={i} style={{ padding: "0 2.5rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                <span className="lnd-star"><Icon.Sparkle /></span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* Navbar */}
        <nav className="lnd-nav" style={{ backgroundColor: "#eae7dc", padding: "0.7rem 1.5rem", display: "flex", justifyContent: "center", borderBottom: "1px solid #d6d1c4", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "1.5rem" }}>
          <Link to="/">Home</Link>
          <Link to="/products">Catalogue</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/track" style={{ color: "#c6338c", fontWeight: 700 }}>Track Order</Link>
        </nav>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "1.4rem 1rem 0.5rem" }}>
          <div style={{ display: "inline-block", background: "linear-gradient(135deg, #fff7e6 0%, #fff 100%)", border: "1px solid #e8dfc8", borderRadius: "16px", padding: "1rem 2rem 1.1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", maxWidth: 480, width: "100%" }}>
            <h1 className="lnd-brand">Mequ</h1>
            <p style={{ fontSize: "clamp(0.8rem, 2.3vw, 0.95rem)", color: "#666", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
              "Where your money learns to stretch."
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", justifyContent: "center", margin: "1rem 1rem 0" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
            <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#aaa", display: "flex", alignItems: "center", pointerEvents: "none" }}>
              <Icon.Search />
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setActiveCategory("All"); }}
              style={{ padding: "0.55rem 1rem 0.55rem 2.4rem", width: "100%", fontSize: "0.95rem", borderRadius: "10px", border: "1.5px solid #ddd", outline: "none", background: "#fff", transition: "border-color 0.18s", boxSizing: "border-box" }}
              onFocus={(e) => e.target.style.borderColor = "#c6338c"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div style={{ padding: "1rem 1rem 0.5rem", maxWidth: "1100px", margin: "0 auto" }}>

          {categories.length > 1 && (
            <div className="lnd-cat-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`lnd-cat-chip${activeCategory === cat ? " active" : ""}`}
                  onClick={() => { setActiveCategory(cat); setSearchTerm(""); }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {(searchTerm || activeCategory !== "All") && filteredProducts.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", marginTop: "1.5rem", fontStyle: "italic" }}>
              No products found{searchTerm ? ` for "${searchTerm}"` : ` in ${activeCategory}`}
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
                <h2 className="lnd-section-heading" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {searchTerm
                    ? <><span style={{ display: "inline-flex" }}><Icon.Search /></span> Search Results</>
                    : activeCategory !== "All"
                      ? <><span style={{ display: "inline-flex" }}><Icon.Tag /></span> {activeCategory}</>
                      : <><span className="lnd-star"><Icon.Star /></span> Featured Products</>
                  }
                </h2>
                {!searchTerm && activeCategory === "All" && (
                  <Link to="/products" style={{ fontSize: "0.78rem", color: "#c6338c", textDecoration: "none", fontWeight: 600, border: "1px solid #c6338c", borderRadius: "100px", padding: "0.25rem 0.75rem" }}>
                    View all →
                  </Link>
                )}
              </div>

              <div className="lnd-pgrid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem" }}>
                {featured.map((p, i) => {
                  const imgSrc = resolveImg(p);
                  const available = isProductAvailable(p);
                  const qty = getProductQty(p);
                  return (
                    <div
                      key={p.id}
                      className="lnd-card"
                      style={{ animationDelay: `${i * 0.04}s` }}
                      onClick={() => navigate("/products", { state: { openProductId: p.id } })}
                    >
                      <div className="lnd-card-imgwrap" style={{ height: "clamp(100px, 18vw, 175px)" }}>
                        {!available && (
                          <span className="lnd-sold-badge">
                            <Icon.SoldOut /> Sold Out
                          </span>
                        )}
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={p.name}
                            loading={i < 4 ? "eager" : "lazy"}
                            decoding="async"
                            fetchpriority={i === 0 ? "high" : "auto"}
                            width="400"
                            height="300"
                            style={{ opacity: available ? 1 : 0.45 }}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "#f0ede4", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: "0.75rem" }}>No Image</div>
                        )}
                      </div>
                      <div style={{ padding: "0.55rem 0.65rem 0.7rem", display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: "clamp(0.75rem, 1.9vw, 0.9rem)", fontWeight: 600, color: "#111", lineHeight: 1.3 }}>{p.name}</h4>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "clamp(0.73rem, 1.8vw, 0.85rem)", color: "#444" }}>Rs {Number(p.price ?? 0).toLocaleString()}</p>
                        {available && qty <= 7 && (
                          <p className="lnd-low-badge">
                            <Icon.Warning /> Only {qty} left!
                          </p>
                        )}
                        <button
                          className="lnd-add-btn"
                          style={{ marginTop: "0.4rem", padding: "0.38rem 0", fontSize: "0.74rem" }}
                          disabled={!available}
                          onClick={(e) => handleAddToCart(e, p)}
                        >
                          {available ? <><Icon.Plus /> Add</> : <><Icon.SoldOut /> Sold Out</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!searchTerm && activeCategory === "All" && (
                <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
                  <Link to="/products" style={{ textDecoration: "none", color: "#fff", backgroundColor: "#111", padding: "0.55rem 1.6rem", borderRadius: "8px", fontSize: "clamp(0.82rem, 2.5vw, 0.92rem)", display: "inline-block", fontWeight: 600, letterSpacing: "0.03em", boxShadow: "0 3px 12px rgba(0,0,0,0.18)" }}>
                    View Full Catalogue
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Trust Strip */}
        <div style={{ padding: "2.5rem 1rem 5rem", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "1.1rem" }}>
            <h3 style={{ fontSize: "clamp(1rem, 3vw, 1.2rem)", fontWeight: 700, color: "#111", margin: 0, letterSpacing: "-0.01em" }}>Why shop with Mequ?</h3>
            <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "0.3rem" }}>Everything you need to shop with confidence</p>
          </div>
          <div className="lnd-trust-grid">
            {trustItems.map((item) => (
              <div key={item.title} className="lnd-trust-item">
                <span className="lnd-trust-icon"><item.Icon /></span>
                <div>
                  <div className="lnd-trust-title">{item.title}</div>
                  <div className="lnd-trust-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Landing;