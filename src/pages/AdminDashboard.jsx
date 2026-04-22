// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

const ADMIN_EMAIL = "moqukhattak3974@gmail.com";

const C = {
  deep:   "#6b21a8",
  mid:    "#9333ea",
  pink:   "#db2777",
  mist:   "#faf5ff",
  gold:   "#be185d",
  border: "#e9d5ff",
  text:   "#3b0764",
  soft:   "#a78bca",
};

const AdminDashboard = () => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [stats, setStats]       = useState({ products: 0, orders: 0, dmOrders: 0, pending: 0, revenue: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser(data.session.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    const fetchStats = async () => {
      const [{ count: pCount }, { data: orders }, { count: dmCount }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, status"),
        supabase.from("dm_orders").select("*", { count: "exact", head: true }),
      ]);
      const pending = (orders || []).filter(o => o.status === "pending").length;
      const revenue = (orders || []).reduce((s, o) => s + Number(o.total || 0), 0);
      setStats({
        products: pCount  || 0,
        orders:   (orders || []).length,
        dmOrders: dmCount || 0,
        pending,
        revenue,
      });
    };
    fetchStats();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login failed: " + error.message);
    else { setEmail(""); setPassword(""); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.mist }}>
      <p style={{ color: C.soft }}>Loading…</p>
    </div>
  );

  if (!user) return (
    <div style={{ background: `linear-gradient(135deg, ${C.mist} 0%, #fce7f3 100%)`, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "14px", padding: "2.5rem 2rem", width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(147,51,234,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "2.5rem" }}>✨</span>
          <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.6rem", color: C.deep, marginTop: "0.5rem", marginBottom: "0.25rem" }}>Mequ Admin</h2>
          <p style={{ color: C.soft, fontSize: "0.85rem" }}>Sign in to manage your store</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ padding: "0.65rem 0.9rem", borderRadius: "8px", border: `1.5px solid ${C.border}`, fontSize: "0.92rem", outline: "none", width: "100%", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.mid} onBlur={e => e.target.style.borderColor = C.border} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ padding: "0.65rem 0.9rem", borderRadius: "8px", border: `1.5px solid ${C.border}`, fontSize: "0.92rem", outline: "none", width: "100%", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.mid} onBlur={e => e.target.style.borderColor = C.border} />
          <button type="submit" style={{ padding: "0.75rem", background: `linear-gradient(135deg, ${C.deep}, ${C.pink})`, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );

  if (user.email !== ADMIN_EMAIL) return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <p style={{ color: "#dc2626", fontSize: "1.1rem", marginBottom: "1rem" }}>❌ Access Denied</p>
      <button onClick={handleLogout} style={{ padding: "0.5rem 1.2rem", background: C.deep, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Logout</button>
    </div>
  );

  return (
    <div style={{ background: `linear-gradient(160deg, ${C.mist} 0%, #fce7f3 100%)`, minHeight: "100vh" }}>
      <div style={{ background: `linear-gradient(90deg, ${C.deep} 0%, ${C.pink} 100%)`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 56, boxShadow: "0 2px 12px rgba(107,33,168,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.4rem" }}>✨</span>
          <span style={{ fontFamily: "var(--font-display, Georgia, serif)", color: "#fff", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.02em" }}>Mequ — Admin</span>
        </div>
        <button onClick={handleLogout} style={{ padding: "0.35rem 0.9rem", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem" }}>Logout</button>
      </div>

      <div style={{ padding: "2rem 1.5rem 5rem", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.6rem", color: C.deep, marginBottom: "0.3rem" }}>Dashboard</h1>
        <p style={{ color: C.soft, fontSize: "0.85rem", marginBottom: "1.8rem" }}>Welcome back! Here's your store overview.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Products",      value: stats.products,                 icon: "✨", color: C.mid     },
            { label: "Website Orders",value: stats.orders,                   icon: "📦", color: C.gold    },
            { label: "DM Orders",     value: stats.dmOrders,                 icon: "💬", color: "#7c3aed" },
            { label: "Pending",       value: stats.pending,                  icon: "⏳", color: "#b45309" },
            { label: "Revenue (PKR)", value: stats.revenue.toLocaleString(), icon: "💰", color: C.deep    },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "1.1rem 1.2rem", boxShadow: "0 2px 12px rgba(147,51,234,0.07)", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>{s.icon}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: C.text, fontFamily: "var(--font-display, Georgia, serif)" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: C.soft, marginTop: "0.1rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Manage Section */}
        <h2 style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.soft, marginBottom: "0.8rem" }}>Manage</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { to: "/admin/add-product", icon: "➕", label: "Add Product",      sub: "Add a new product to store",   color: C.mid     },
            { to: "/admin/products",    icon: "✨", label: "Products",          sub: "View, edit & delete products", color: C.deep    },
            { to: "/admin/orders",      icon: "📦", label: "Website Orders",    sub: "View & manage website orders", color: C.gold    },
            { to: "/admin/dm-orders",   icon: "💬", label: "DM Orders",         sub: "Manage orders from DMs",       color: "#7c3aed" },
            { to: "/admin/invoices",    icon: "🧾", label: "Invoice Generator", sub: "Generate shipping invoices",   color: C.pink    },
          ].map(c => (
            <Link key={c.to} to={c.to}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.4rem", padding: "1.4rem 1.6rem", background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: "0 2px 12px rgba(147,51,234,0.07)", textDecoration: "none", color: "inherit", borderLeft: `4px solid ${c.color}`, transition: "transform 0.18s, box-shadow 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(147,51,234,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(147,51,234,0.07)"; }}>
              <span style={{ fontSize: "1.8rem" }}>{c.icon}</span>
              <span style={{ fontWeight: 700, color: C.text, fontSize: "0.95rem" }}>{c.label}</span>
              <span style={{ fontSize: "0.76rem", color: C.soft, lineHeight: 1.4 }}>{c.sub}</span>
            </Link>
          ))}
        </div>

        {/* Logistics Section */}
        <h2 style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.soft, marginBottom: "0.8rem" }}>Logistics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { to: "/admin/logistics", icon: "🚚", label: "Logistics", sub: "Tracking pools, packing & shipments", color: "#0369a1" },
            { to: "/admin/scanner",   icon: "📦", label: "Scanner",   sub: "Scan orders & assign tracking IDs",  color: "#0369a1" },
          ].map(c => (
            <Link key={c.to} to={c.to}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.4rem", padding: "1.4rem 1.6rem", background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: "0 2px 12px rgba(147,51,234,0.07)", textDecoration: "none", color: "inherit", borderLeft: `4px solid ${c.color}`, transition: "transform 0.18s, box-shadow 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(147,51,234,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(147,51,234,0.07)"; }}>
              <span style={{ fontSize: "1.8rem" }}>{c.icon}</span>
              <span style={{ fontWeight: 700, color: C.text, fontSize: "0.95rem" }}>{c.label}</span>
              <span style={{ fontSize: "0.76rem", color: C.soft, lineHeight: 1.4 }}>{c.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;