// src/pages/Products.jsx
import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = "923193128443";

const STYLES = `
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes flyToBag {
    0%   { transform: translate(0,0) scale(1); opacity: 1; }
    70%  { opacity: 0.9; }
    100% { transform: translate(var(--fly-dx), var(--fly-dy)) scale(0.15); opacity: 0; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-badge {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.15); }
  }
  .prd-card {
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    cursor: pointer;
    animation: fadeInUp 0.35s ease both;
  }
  .prd-card:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 14px 36px rgba(0,0,0,0.13) !important;
  }
  .prd-card-imgwrap { overflow: hidden; }
  .prd-card-imgwrap img { transition: transform 0.38s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
  .prd-card:hover .prd-card-imgwrap img { transform: scale(1.08); }
  .prd-addbtn { transition: background 0.18s, transform 0.12s; }
  .prd-addbtn:hover:not(:disabled) { background: #c6338c !important; transform: scale(1.03); }
  .prd-nav a {
    text-decoration: none; color: #111; font-weight: 500;
    font-size: clamp(0.82rem, 2.2vw, 0.96rem);
    padding: 0.25rem 0;
    border-bottom: 2px solid transparent;
    transition: border-color 0.15s;
  }
  .prd-nav a:hover, .prd-nav a.active { border-bottom-color: #c6338c; }
  .prd-wa-btn {
    position: fixed; bottom: 1.5rem; right: 1.5rem;
    width: 52px; height: 52px; border-radius: 50%;
    background: #25D366;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 9998;
    box-shadow: 0 4px 18px rgba(37,211,102,0.5);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
  }
  .prd-wa-btn:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(37,211,102,0.65); }
  .prd-cart-btn {
    position: fixed; bottom: 5.2rem; right: 1.5rem;
    width: 52px; height: 52px; border-radius: 50%;
    background: #111;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 9998;
    box-shadow: 0 4px 18px rgba(0,0,0,0.28);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .prd-cart-btn:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(0,0,0,0.38); }
  .prd-cart-badge {
    position: absolute; top: -4px; right: -4px;
    background: #c6338c; color: #fff;
    border-radius: 50%; width: 20px; height: 20px;
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    animation: pulse-badge 2s ease infinite;
  }
  @media (max-width: 1024px) { .prd-grid { grid-template-columns: repeat(3,1fr) !important; } }
  @media (max-width: 600px)  { .prd-grid { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; } }
  .prd-var-addbtn { transition: background 0.18s; }
  .prd-var-addbtn:hover:not(:disabled) { background: #a0286e !important; }
  .prd-badge {
    position: absolute; top: 0.55rem; left: 0.55rem;
    font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 0.22rem 0.55rem;
    border-radius: 4px; color: #fff; pointer-events: none;
  }
`;

const FloatingCart = React.forwardRef(({ count, onClick }, ref) => (
  <div ref={ref} className="prd-cart-btn" onClick={onClick} title="View Cart">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
    {count > 0 && <span className="prd-cart-badge">{count > 99 ? "99+" : count}</span>}
  </div>
));
FloatingCart.displayName = "FloatingCart";

const FlyingDot = ({ dot }) => {
  const dx = dot.endX - dot.startX;
  const dy = dot.endY - dot.startY;
  return (
    <div style={{
      position: "fixed", left: dot.startX - 22, top: dot.startY - 22,
      width: 44, height: 44, borderRadius: "50%", overflow: "hidden",
      border: "2px solid #fff", boxShadow: "0 3px 12px rgba(0,0,0,0.3)",
      pointerEvents: "none", zIndex: 99999,
      animation: "flyToBag 0.78s cubic-bezier(0.4,0,0.2,1) forwards",
      "--fly-dx": `${dx}px`, "--fly-dy": `${dy}px`,
    }}>
      {dot.img
        ? <img src={dot.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: "#c6338c" }} />
      }
    </div>
  );
};

const TopBar = memo(() => {
  const announceItems = [
    "Free Gifts on all orders above Rs. 3,000",
    "Cash on Delivery available",
    "Worldwide Shipping",
    "Unbeatable Prices · No Extra Tax",
    "Imported Products",
    "Flash Deals",
  ];
  const track = [...announceItems, ...announceItems];
  return (
    <>
      <div style={{ width: "100%", backgroundColor: "#111", color: "#fff", overflow: "hidden", whiteSpace: "nowrap", padding: "9px 0", fontSize: "clamp(11px, 2.4vw, 13px)", letterSpacing: "0.04em" }}>
        <div style={{ display: "inline-flex", animation: "marquee 32s linear infinite", willChange: "transform" }}>
          {track.map((t, i) => (
            <span key={i} style={{ padding: "0 2.5rem" }}>
              <span style={{ color: "#f0c040", marginRight: "0.45rem" }}>✦</span>{t}
            </span>
          ))}
        </div>
      </div>
      <nav className="prd-nav" style={{ backgroundColor: "#eae7dc", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #d6d1c4", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "0.5rem", minHeight: 52 }}>
        <Link to="/" style={{ textDecoration: "none", fontWeight: 800, fontSize: "clamp(1.3rem, 4vw, 1.7rem)", letterSpacing: "-0.03em", background: "linear-gradient(135deg, #111 0%, #555 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1, padding: "0.5rem 0", borderBottom: "none !important" }}>
          Mequ
        </Link>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem", alignItems: "center" }}>
          <Link to="/">Home</Link>
          <Link to="/products" className="active">Catalogue</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </nav>
    </>
  );
});
TopBar.displayName = "TopBar";

/* ── Memoized product card to prevent unnecessary re-renders ── */
const ProductCard = memo(({ p, idx, onView, onAdd, isBusy, variantIdx }) => {
  const resolveImg = (img) => {
    if (!img) return "";
    const s = String(img).trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("/images/")) return s;
    if (s.startsWith("images/")) return `/${s}`;
    if (/\.[a-zA-Z0-9]{2,5}$/.test(s)) return `/images/${s.replace(/^\/+/, "")}`;
    if (/^[0-9a-zA-Z_-]+$/.test(s)) return `/images/${s}.jpg`;
    return `/images/${s.replace(/^\/+/, "")}`;
  };
  const imgErr = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://via.placeholder.com/400x400?text=No+Image"; };
  const rawImg = p.image?.trim() || (Array.isArray(p.images) && p.images[0]) || "";
  const finalImage = resolveImg(rawImg);
  const qty = Number(p.totalQuantity ?? p.totalquantity ?? 0);
  const isLow = qty > 0 && qty <= 7;
  const isOut = qty <= 0;

  return (
    <div
      className="prd-card"
      style={{ textAlign: "center", border: "1px solid #e0ddd4", borderRadius: 12, padding: "0", position: "relative", display: "flex", flexDirection: "column", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", animationDelay: `${idx * 0.03}s` }}
      onClick={() => onView(p, rawImg)}
    >
      {p.soldOut && <span className="prd-badge" style={{ background: "#111" }}>Sold Out</span>}
      {!p.soldOut && isLow && <span className="prd-badge" style={{ background: "#b45309" }}>Only {qty} left</span>}
      <div className="prd-card-imgwrap" style={{ borderRadius: "12px 12px 0 0" }}>
        {finalImage ? (
          <img
            src={finalImage} alt={p.name} onError={imgErr}
            loading={idx < 4 ? "eager" : "lazy"}
            style={{ width: "100%", height: "auto", aspectRatio: "4/3", objectFit: "cover", display: "block", borderRadius: "12px 12px 0 0" }}
          />
        ) : (
          <div style={{ width: "100%", aspectRatio: "4/3", background: "#f0ede4", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "0.75rem", borderRadius: "12px 12px 0 0" }}>No Image</div>
        )}
      </div>
      <div style={{ padding: "0.6rem 0.7rem 0.75rem", display: "flex", flexDirection: "column", flex: 1 }}>
        <h4 style={{ margin: "0 0 0.2rem", fontSize: "clamp(0.78rem, 2vw, 0.92rem)", fontWeight: 600, color: "#111", lineHeight: 1.3, minHeight: "2em" }}>{p.name}</h4>
        <p style={{ fontWeight: 700, margin: "0 0 0.4rem", fontSize: "clamp(0.76rem, 1.9vw, 0.88rem)", color: "#333" }}>
          PKR {Number(p.price ?? 0).toLocaleString()}
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
          <button
            className="prd-addbtn"
            onClick={(e) => { e.stopPropagation(); onAdd(p, variantIdx ?? null, e); }}
            disabled={p.soldOut || isBusy || qty <= 0}
            style={{ flex: 1, padding: "0.4rem 0.4rem", fontSize: "0.78rem", fontWeight: 600, backgroundColor: p.soldOut || isOut ? "#ddd" : "#111", color: p.soldOut || isOut ? "#aaa" : "#fff", border: "none", borderRadius: 7, cursor: p.soldOut || isOut ? "not-allowed" : "pointer" }}
          >
            {p.soldOut || isOut ? "Unavail." : "Add"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView(p, rawImg); }}
            style={{ padding: "0.38rem 0.55rem", fontSize: "0.75rem", backgroundColor: "#fff", color: "#444", border: "1.5px solid #ddd", borderRadius: 7, cursor: "pointer", fontWeight: 500 }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = "ProductCard";

/* ════════════════════════════════════════════════════ */
const Products = ({ addToCart = () => {}, cartItems = [] }) => {
  const [products, setProducts]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [mainImage, setMainImage]   = useState("");
  const [zoomed, setZoomed]         = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading]       = useState(true);
  const [busyIds, setBusyIds]       = useState([]);
  const [variantSelection, setVariantSelection] = useState({});
  const [flyingDots, setFlyingDots] = useState([]);
  const cartIconRef  = useRef(null);
  const didAutoOpen  = useRef(false); // ✅ FIX: track if we already auto-opened
  const navigate     = useNavigate();
  const location     = useLocation();

  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0);

  useEffect(() => {
    if (document.head.querySelector("[data-mequ-prd-css]")) return;
    const el = document.createElement("style");
    el.setAttribute("data-mequ-prd-css", "1");
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);

  const resolveImg = useCallback((img) => {
    if (!img) return "";
    const s = String(img).trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("/images/")) return s;
    if (s.startsWith("images/")) return `/${s}`;
    if (/\.[a-zA-Z0-9]{2,5}$/.test(s)) return `/images/${s.replace(/^\/+/, "")}`;
    if (/^[0-9a-zA-Z_-]+$/.test(s)) return `/images/${s}.jpg`;
    return `/images/${s.replace(/^\/+/, "")}`;
  }, []);

  const imgErr    = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://via.placeholder.com/400x400?text=No+Image"; };
  const getQty    = (p) => Number(p.totalQuantity ?? p.totalquantity ?? 0);
  const variantQty   = (p, i) => { if (!Array.isArray(p?.colors)) return null; const v = p.colors[i]; if (!v) return null; return Number(v.qty ?? v.quantity ?? v.stock ?? 0); };
  const variantPrice = (p, i) => { if (!Array.isArray(p?.colors)) return null; const v = p.colors[i]; if (!v) return null; const n = Number(v.price ?? v.amount ?? v.rate ?? NaN); return isNaN(n) ? null : n; };
  const getVImg   = (cvs, idx) => { const v = cvs[idx]; if (!v) return null; return typeof v === "string" ? resolveImg(v) : resolveImg(v.imagePath || v.image || v.src || ""); };
  const getVName  = (cvs, idx) => { const v = cvs[idx]; if (!v) return ""; return typeof v === "string" ? v : v.name ?? v.colorName ?? v.label ?? ""; };
  const lowStockTxt = (p, vi = null) => { const vq = vi !== null ? variantQty(p, vi) : null; const qty = vq !== null ? vq : getQty(p); if (qty > 0 && qty <= 7) return `Only ${qty} left!`; if (qty <= 0) return "Out of stock"; return ""; };

  const triggerFly = (e, imgSrc) => {
    e.stopPropagation();
    const r = cartIconRef.current?.getBoundingClientRect();
    if (!r) return;
    const id = Date.now() + Math.random();
    setFlyingDots((prev) => [...prev, { id, startX: e.clientX, startY: e.clientY, endX: r.left + r.width / 2, endY: r.top + r.height / 2, img: imgSrc }]);
    setTimeout(() => setFlyingDots((prev) => prev.filter((d) => d.id !== id)), 850);
  };

  /* ── Fetch — only realtime, no polling interval ── */
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      const toMark = (data || []).filter((p) => getQty(p) <= 0 && !p.soldOut);
      if (toMark.length) {
        await Promise.allSettled(toMark.map((p) => supabase.from("products").update({ soldOut: true }).eq("id", p.id)));
        const { data: d2 } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        setProducts(d2 || []);
      } else {
        setProducts(data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchProducts();
    // ✅ FIX: removed setInterval — realtime handles updates, no need to hammer the DB every 8s
    const ch = supabase.channel("mequ-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchProducts)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchProducts)
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch (_) {} };
  }, [fetchProducts]);

  /* ── ✅ FIX: Auto-open product — only fires ONCE, then clears state ── */
  useEffect(() => {
    if (didAutoOpen.current) return;
    if (!location.state?.openProductId || products.length === 0) return;
    const target = products.find((p) => p.id === location.state.openProductId);
    if (target) {
      didAutoOpen.current = true;
      setSelected(target);
      setMainImage(resolveImg(target.image?.trim() || ""));
      setZoomed(false);
      // ✅ FIX: clear router state immediately so Back never re-opens this
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location.state?.openProductId, products, resolveImg]);

  /* ── ✅ FIX: reset didAutoOpen when navigating away & back ── */
  useEffect(() => {
    return () => { didAutoOpen.current = false; };
  }, []);

  const updateLocalStock = (pid, vi, by = 1) => {
    const upd = (p) => {
      if (p.id !== pid) return p;
      const copy = { ...p };
      if (vi !== null && Array.isArray(copy.colors) && copy.colors[vi]) {
        const v = copy.colors[vi];
        if (typeof v === "object") copy.colors[vi] = { ...v, qty: Math.max(0, Number(v.qty ?? v.quantity ?? v.stock ?? 0) - by) };
      }
      copy.totalQuantity = Math.max(0, getQty(copy) - by);
      if (copy.totalQuantity <= 0) copy.soldOut = true;
      return copy;
    };
    setProducts((cur) => cur.map(upd));
    if (selected?.id === pid) setSelected((s) => s ? upd(s) : s);
  };

  const handleAddToCart = useCallback((p, vi = null, e = null) => {
    if (!p) return;
    const idx = typeof vi === "number" && vi >= 0 ? vi : null;
    const vq = idx !== null ? variantQty(p, idx) : null;
    const available = vq !== null ? vq : getQty(p);
    if (available <= 0) return;

    setBusyIds((c) => Array.from(new Set([...c, p.id])));
    const cvs = Array.isArray(p.colors) ? p.colors : [];
    let selImg = "", selName = null, selPrice = null;
    if (idx !== null && cvs[idx]) {
      const cv = cvs[idx];
      selImg = getVImg(cvs, idx) || "";
      selName = typeof cv === "object" ? cv.name || cv.colorName || null : null;
      selPrice = variantPrice(p, idx);
    }
    if (!selImg) selImg = p.image ? resolveImg(p.image) : "";

    const finalPrice = Number(selPrice !== null && !isNaN(Number(selPrice)) ? selPrice : p.price ?? 0);
    const uid = idx !== null ? `${p.id}::v${idx}` : `${p.id}::main`;

    try {
      addToCart({
        id: uid, parentId: p.id,
        name: idx !== null ? `${p.name} — ${selName || `Option ${idx + 1}`}` : p.name || "",
        price: finalPrice, image: selImg || resolveImg(p.image || ""),
        variantIndex: idx, variantName: selName, variantPrice: selPrice,
        selectedImage: selImg || resolveImg(p.image || ""),
        quantity: 1, raw: p,
      });
    } catch (err) { console.error(err); }

    if (e) triggerFly(e, selImg || resolveImg(p.image || ""));
    updateLocalStock(p.id, idx, 1);
    setTimeout(() => setBusyIds((c) => c.filter((x) => x !== p.id)), 400);
  }, [addToCart, resolveImg]);

  /* ── ✅ FIX: handleBack clears selected cleanly ── */
  const handleBack = useCallback(() => {
    setSelected(null);
    setMainImage("");
    setZoomed(false);
    // ensure router state is clean so no re-open on future renders
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const handleViewProduct = useCallback((p, rawImg) => {
    setVariantSelection((cur) => { const copy = { ...cur }; delete copy[p.id]; return copy; });
    setSelected(p);
    setMainImage(resolveImg(rawImg));
    setZoomed(false);
  }, [resolveImg]);

  const filtered = products.filter((p) => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()));

  const WaBtnSvg = (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  if (loading) return (
    <div style={{ backgroundColor: "#fffdf4", minHeight: "100vh" }}>
      <style>{STYLES}</style>
      <TopBar />
      <p style={{ padding: "3rem", textAlign: "center", color: "#888", fontStyle: "italic" }}>Loading products…</p>
    </div>
  );

  /* ════════ DETAIL VIEW ════════ */
  if (selected) {
    const cvs = Array.isArray(selected.colors) ? selected.colors : [];
    const imgs = [];
    if (selected.image?.trim()) imgs.push(selected.image);
    cvs.forEach((c) => { if (!c) return; imgs.push(typeof c === "string" ? c : c.imagePath || c.image || ""); });
    if (Array.isArray(selected.images)) selected.images.forEach((it) => it && imgs.push(it));
    const validImgs = Array.from(new Set(imgs.map((i) => i?.trim()))).filter(Boolean);
    const displayMain = mainImage || resolveImg(validImgs[0] || selected.image || "");

    const localVI = variantSelection[selected.id];
    const hasVI   = typeof localVI === "number" && localVI >= 0;
    const selVImg  = hasVI ? getVImg(cvs, localVI) : null;
    const selVName = hasVI ? getVName(cvs, localVI) : "";
    const selVQty  = hasVI ? variantQty(selected, localVI) : null;
    const selVPrice= hasVI ? variantPrice(selected, localVI) : null;
    const overallQty   = getQty(selected);
    const displayedPrice = Number(selVPrice !== null && !isNaN(selVPrice) ? selVPrice : selected.price ?? 0);
    const displayedName  = hasVI && selVName ? `${selected.name} — ${selVName}` : selected.name || "";
    const displayedImage = selVImg || displayMain;
    const effectiveQty   = selVQty !== null ? selVQty : overallQty;

    return (
      <div style={{ backgroundColor: "#fffdf4", minHeight: "100vh" }}>
        {flyingDots.map((dot) => <FlyingDot key={dot.id} dot={dot} />)}
        <FloatingCart ref={cartIconRef} count={cartCount} onClick={() => navigate("/checkout")} />
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="prd-wa-btn" title="Chat on WhatsApp">{WaBtnSvg}</a>
        <TopBar />

        <div style={{ padding: "1rem 1.2rem 5rem", maxWidth: 1100, margin: "0 auto" }}>
          {/* ✅ FIX: uses handleBack instead of inline setState */}
          <button
            onClick={handleBack}
            style={{ margin: "0.7rem 0", padding: "0.4rem 0.85rem", borderRadius: 7, border: "1.5px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "0.88rem", color: "#444", fontWeight: 500 }}
          >
            ← Back
          </button>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 300px", maxWidth: 600, width: "100%" }}>
              <div
                onClick={() => setZoomed((z) => !z)}
                style={{ width: "100%", borderRadius: 14, border: "1px solid #e0ddd4", overflow: zoomed ? "auto" : "hidden", cursor: zoomed ? "zoom-out" : "zoom-in", display: "flex", justifyContent: "center", alignItems: "center", background: "#f7f5f0", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
              >
                {displayedImage ? (
                  <img src={displayedImage} alt={displayedName} onError={imgErr} decoding="async" loading="eager"
                    style={{ width: zoomed ? "150%" : "100%", height: zoomed ? "auto" : "min(62vh, 600px)", objectFit: zoomed ? "contain" : "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: "0.85rem" }}>No Image</div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
                {validImgs.map((img, idx) => {
                  const r = resolveImg(img);
                  return (
                    <img key={idx} src={r} alt="" width="72" height="72" onError={imgErr} loading={idx < 4 ? "eager" : "lazy"}
                      style={{ cursor: "pointer", border: displayedImage === r ? "2px solid #111" : "1px solid #ddd", borderRadius: 8, objectFit: "cover", transition: "border-color 0.15s" }}
                      onClick={() => {
                        setMainImage(r); setZoomed(false);
                        const vi = cvs.findIndex((c) => {
                          const cImg = typeof c === "string" ? resolveImg(c) : resolveImg(c?.imagePath || c?.image || "");
                          return cImg === r;
                        });
                        setVariantSelection((cur) => { const copy = { ...cur }; if (vi >= 0) copy[selected.id] = vi; else delete copy[selected.id]; return copy; });
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div style={{ flex: "1 1 260px", maxWidth: 480, width: "100%" }}>
              <h2 style={{ fontSize: "clamp(1.15rem, 3vw, 1.7rem)", margin: "0 0 0.3rem", fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{displayedName}</h2>
              <p style={{ fontWeight: 800, fontSize: "clamp(1rem, 2.5vw, 1.3rem)", margin: "0 0 0.6rem", color: "#222" }}>
                PKR {Number(displayedPrice).toLocaleString()}
              </p>
              {(selected.description || selected.desc) && (
                <p style={{ color: "#555", lineHeight: 1.6, fontSize: "0.92rem", marginBottom: "1rem" }}>
                  {selected.description || selected.desc}
                </p>
              )}

              {cvs.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: "0.6rem" }}>Select Option</p>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    {cvs.map((c, idx) => {
                      const vImg = getVImg(cvs, idx);
                      const name = getVName(cvs, idx) || `Option ${idx + 1}`;
                      const vq = variantQty(selected, idx);
                      const vp = variantPrice(selected, idx);
                      const active = variantSelection[selected.id] === idx;
                      return (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "center", minWidth: 108 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setVariantSelection((cur) => ({ ...cur, [selected.id]: idx })); if (vImg) { setMainImage(vImg); setZoomed(false); } }}
                            style={{ display: "flex", gap: "0.45rem", alignItems: "center", padding: "0.42rem 0.55rem", borderRadius: 9, border: active ? "2px solid #111" : "1.5px solid #ddd", background: active ? "#f7f5f0" : "#fff", cursor: "pointer", minWidth: 108, transition: "border-color 0.15s, background 0.15s" }}
                          >
                            {vImg && <img src={vImg} alt={name} width="36" height="36" style={{ objectFit: "cover", borderRadius: 6 }} onError={imgErr} />}
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111" }}>{name}</div>
                              <div style={{ fontSize: "0.7rem", color: vq !== null ? (vq === 0 ? "#dc2626" : "#888") : "#888" }}>
                                {vq !== null ? (vq === 0 ? "Out of stock" : `${vq} avail.`) : ""}
                              </div>
                              {vp !== null && <div style={{ fontSize: "0.76rem", fontWeight: 700, marginTop: "0.1rem" }}>PKR {Number(vp).toLocaleString()}</div>}
                            </div>
                          </button>
                          <button
                            className="prd-var-addbtn"
                            disabled={selected.soldOut || busyIds.includes(selected.id) || (vq !== null && vq <= 0)}
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(selected, idx, e); }}
                            style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem", backgroundColor: (vq !== null && vq <= 0) || selected.soldOut ? "#ddd" : "#c6338c", color: (vq !== null && vq <= 0) || selected.soldOut ? "#aaa" : "#fff", border: "none", borderRadius: 6, cursor: (vq !== null && vq <= 0) || selected.soldOut ? "not-allowed" : "pointer", width: "100%", fontWeight: 600 }}
                          >
                            {(vq !== null && vq <= 0) || selected.soldOut ? "Unavailable" : "Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {effectiveQty > 0 && effectiveQty <= 7 && (
                <div style={{ color: "#b45309", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>⚠️</span> {lowStockTxt(selected, hasVI ? localVI : null)}
                </div>
              )}
              {effectiveQty <= 0 && (
                <div style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>❌ Out of stock</div>
              )}

              <button
                className="prd-addbtn"
                disabled={selected.soldOut || busyIds.includes(selected.id) || (selVQty !== null && selVQty <= 0)}
                onClick={(e) => handleAddToCart(selected, variantSelection[selected.id] ?? null, e)}
                style={{ padding: "0.7rem 1.8rem", fontSize: "1rem", backgroundColor: selected.soldOut ? "#ccc" : "#111", color: "#fff", border: "none", borderRadius: 10, cursor: selected.soldOut ? "not-allowed" : "pointer", fontWeight: 700, letterSpacing: "0.02em", marginTop: "0.5rem" }}
              >
                {selected.soldOut ? "Unavailable" : "Add to Cart"}
              </button>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "1.2rem" }}>
                {["💵 Cash on Delivery", "🚚 Worldwide Shipping", "🎁 Free Gift > Rs.3K", "✈️ Imported"].map((t) => (
                  <span key={t} style={{ fontSize: "0.7rem", border: "1px solid #e0ddd4", borderRadius: "100px", padding: "0.25rem 0.7rem", color: "#666", background: "#fff" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════ GRID VIEW ════════ */
  return (
    <div style={{ backgroundColor: "#fffdf4", minHeight: "100vh" }}>
      {flyingDots.map((dot) => <FlyingDot key={dot.id} dot={dot} />)}
      <FloatingCart ref={cartIconRef} count={cartCount} onClick={() => navigate("/checkout")} />
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="prd-wa-btn" title="Chat on WhatsApp">{WaBtnSvg}</a>
      <TopBar />

      <div style={{ padding: "0.8rem 1.2rem 5rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.8rem 0 1rem", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "clamp(1.1rem, 3vw, 1.35rem)", fontWeight: 700, margin: 0, color: "#111", letterSpacing: "-0.01em", flex: "none" }}>
            🛍️ All Products <span style={{ color: "#bbb", fontSize: "0.8rem", fontWeight: 400 }}>({filtered.length})</span>
          </h2>
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
            <span style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>🔍</span>
            <input
              type="text" placeholder="Search products..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "0.48rem 1rem 0.48rem 2.3rem", width: "100%", fontSize: "0.9rem", borderRadius: 9, border: "1.5px solid #ddd", outline: "none", background: "#fff", transition: "border-color 0.18s" }}
              onFocus={(e) => e.target.style.borderColor = "#c6338c"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: "3rem", fontStyle: "italic" }}>No products found for "{searchTerm}"</p>
        ) : (
          <div className="prd-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: 16 }}>
            {filtered.map((p, idx) => (
              <ProductCard
                key={p.id || idx}
                p={p}
                idx={idx}
                onView={handleViewProduct}
                onAdd={handleAddToCart}
                isBusy={busyIds.includes(p.id)}
                variantIdx={variantSelection[p.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;