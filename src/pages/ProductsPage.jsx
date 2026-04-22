// src/pages/ProductsPage.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

const inp = {
  width: "100%", marginBottom: "6px", padding: "0.5rem 0.75rem",
  borderRadius: "6px", border: "1.5px solid #ddd", fontSize: "0.88rem",
  outline: "none", fontFamily: "inherit",
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState("");
  const [editingColorIdx, setEditingColorIdx] = useState(null);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("❌ Fetch error:", error);
    else setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
    const subscription = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  const handleDelete = async (product) => {
    const id = product?.id;
    if (!id) return alert("⚠️ No ID found!");
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("❌ Failed to delete: " + error.message);
    else alert("✅ Deleted!");
  };

  const toggleSoldOut = async (product) => {
    const id = product?.id;
    if (!id) return;
    const { error } = await supabase
      .from("products")
      .update({ soldOut: !product.soldOut })
      .eq("id", id);
    if (error) alert("❌ Failed: " + error.message);
  };

  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setEditingColorIdx(null);
    setEditData({
      name: product.name || "",
      price: product.price || "",
      totalQuantity: product.totalQuantity || "",
      image: product.image || "",
      description: product.description || "",
      category: product.category || "",
      subcategory: product.subcategory || product.subCategory || product.sub_category || "",
      colors: Array.isArray(product.colors) ? JSON.parse(JSON.stringify(product.colors)) : [],
    });
  };

  const handleSave = async (id) => {
    // Detect which subcategory column name actually exists on this product row
    const originalProduct = products.find(p => p.id === id);
    const subCatKey =
      originalProduct?.hasOwnProperty("subcategory") ? "subcategory" :
      originalProduct?.hasOwnProperty("subCategory") ? "subCategory" :
      originalProduct?.hasOwnProperty("sub_category") ? "sub_category" :
      "subcategory"; // fallback

    const payload = {
      name: editData.name,
      price: editData.price ? parseFloat(editData.price) : null,
      totalQuantity: editData.totalQuantity ? parseInt(editData.totalQuantity) : null,
      image: editData.image,
      description: editData.description,
      category: editData.category,
      [subCatKey]: editData.subcategory,
      colors: editData.colors,
    };

    console.log("💾 Saving payload:", payload, "for id:", id, "subCatKey:", subCatKey);

    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("❌ Update failed:", error);
      console.log("Full error object:", JSON.stringify(error, null, 2));

      // Retry without the subcategory field — maybe the column doesn't exist at all
      const { [subCatKey]: _dropped, ...payloadWithoutSubcat } = payload;
      console.warn("⚠️ Retrying without subcategory field...");
      const { error: error2 } = await supabase
        .from("products")
        .update(payloadWithoutSubcat)
        .eq("id", id);

      if (error2) {
        alert(
          "❌ Update failed!\n" +
          "Message: " + error.message +
          "\nCode: " + error.code +
          "\nHint: " + (error.hint || "none") +
          "\nDetails: " + (error.details || "none")
        );
      } else {
        alert("✅ Updated! (subcategory field was skipped — column not found in DB)");
        setEditingProduct(null);
        setEditingColorIdx(null);
        fetchProducts();
      }
    } else {
      alert("✅ Updated!");
      setEditingProduct(null);
      setEditingColorIdx(null);
      fetchProducts();
    }
  };

  const updateColor = (idx, field, value) => {
    const updated = [...editData.colors];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditData(d => ({ ...d, colors: updated }));
  };

  const removeColor = (idx) => {
    const updated = editData.colors.filter((_, i) => i !== idx);
    setEditData(d => ({ ...d, colors: updated }));
  };

  const addColor = () => {
    setEditData(d => ({ ...d, colors: [...d.colors, { name: "", imagePath: "", qty: "", price: "" }] }));
  };

  const filtered = products.filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.subcategory || p.subCategory || p.sub_category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1rem" }}>🛒 Products in Store ({filtered.length})</h2>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1.2rem", maxWidth: 400 }}>
        <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#aaa" }}>🔍</span>
        <input
          type="text"
          placeholder="Search by name, category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, paddingLeft: "2.2rem", marginBottom: 0 }}
          onFocus={e => e.target.style.borderColor = "#1976d2"}
          onBlur={e => e.target.style.borderColor = "#ddd"}
        />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#888" }}>No products found.</p>
      ) : (
        filtered.map((p) => {
          const subcat = p.subcategory || p.subCategory || p.sub_category || "";
          return (
            <div key={p.id} style={{ border: "1px solid #ccc", margin: "1rem 0", padding: "1rem", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>

                {/* Image */}
                <img
                  src={p.image || p.colors?.[0]?.imagePath || ""}
                  alt={p.name}
                  width="80" height="80"
                  style={{ objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd", flexShrink: 0 }}
                  onError={e => { e.target.onerror = null; e.target.style.display = "none"; }}
                />

                {/* Edit Mode */}
                {editingProduct === p.id ? (
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>NAME</label>
                        <input style={inp} type="text" value={editData.name} placeholder="Product name" onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>PRICE (PKR)</label>
                        <input style={inp} type="number" value={editData.price} placeholder="Price" onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>QUANTITY</label>
                        <input style={inp} type="number" value={editData.totalQuantity} placeholder="Qty" onChange={e => setEditData(d => ({ ...d, totalQuantity: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>IMAGE URL</label>
                        <input style={inp} type="text" value={editData.image} placeholder="Image URL" onChange={e => setEditData(d => ({ ...d, image: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>CATEGORY</label>
                        <input style={inp} type="text" value={editData.category} placeholder="Category" onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>SUBCATEGORY</label>
                        <input style={inp} type="text" value={editData.subcategory} placeholder="Subcategory" onChange={e => setEditData(d => ({ ...d, subcategory: e.target.value }))} />
                      </div>
                    </div>
                    <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>DESCRIPTION</label>
                    <textarea style={{ ...inp, resize: "vertical" }} rows={2} value={editData.description} placeholder="Description" onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />

                    {/* Variants / Colors */}
                    {editData.colors.length > 0 && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <label style={{ fontSize: "0.72rem", color: "#888", fontWeight: 600 }}>VARIANTS / OPTIONS</label>
                        {editData.colors.map((c, i) => (
                          <div key={i} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 6, padding: "0.6rem", marginBottom: "0.5rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px auto", gap: "0.4rem", alignItems: "center" }}>
                              <input style={{ ...inp, marginBottom: 0 }} type="text" value={c.name || ""} placeholder="Name" onChange={e => updateColor(i, "name", e.target.value)} />
                              <input style={{ ...inp, marginBottom: 0 }} type="text" value={c.imagePath || c.image || ""} placeholder="Image path" onChange={e => updateColor(i, "imagePath", e.target.value)} />
                              <input style={{ ...inp, marginBottom: 0 }} type="number" value={c.qty || c.quantity || ""} placeholder="Qty" onChange={e => updateColor(i, "qty", e.target.value)} />
                              <input style={{ ...inp, marginBottom: 0 }} type="number" value={c.price || ""} placeholder="Price" onChange={e => updateColor(i, "price", e.target.value)} />
                              <button onClick={() => removeColor(i)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 4, padding: "0.3rem 0.5rem", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                            </div>
                          </div>
                        ))}
                        <button onClick={addColor} style={{ padding: "0.3rem 0.8rem", background: "#1976d2", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>+ Add Variant</button>
                      </div>
                    )}

                    {editData.colors.length === 0 && (
                      <button onClick={addColor} style={{ marginTop: "0.5rem", padding: "0.3rem 0.8rem", background: "#1976d2", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>+ Add Variant</button>
                    )}
                  </div>
                ) : (
                  /* View Mode */
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 0.2rem" }}>
                      {p.name} {p.soldOut && <span style={{ color: "red", fontSize: "0.8rem" }}>(Sold Out)</span>}
                    </h3>
                    <p style={{ margin: "0 0 0.1rem", fontWeight: 600 }}>PKR {Number(p.price || 0).toLocaleString()}</p>
                    {p.totalQuantity != null && <p style={{ margin: "0 0 0.1rem", fontSize: "0.85rem", color: "#555" }}>Qty: {p.totalQuantity}</p>}
                    {p.category && <p style={{ margin: "0 0 0.1rem", fontSize: "0.82rem", color: "#777" }}>📁 {p.category}{subcat ? ` › ${subcat}` : ""}</p>}
                    {p.description && <p style={{ margin: "0 0 0.1rem", fontSize: "0.82rem", color: "#888" }}>{p.description.slice(0, 100)}{p.description.length > 100 ? "…" : ""}</p>}
                    {Array.isArray(p.colors) && p.colors.length > 0 && (
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#555" }}>🎨 {p.colors.length} variant{p.colors.length > 1 ? "s" : ""}</p>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flexShrink: 0 }}>
                  {editingProduct === p.id ? (
                    <>
                      <button onClick={() => handleSave(p.id)} style={{ background: "green", color: "white", border: "none", borderRadius: 5, padding: "0.4rem 0.8rem", cursor: "pointer", fontWeight: 600 }}>💾 Save</button>
                      <button onClick={() => setEditingProduct(null)} style={{ background: "gray", color: "white", border: "none", borderRadius: 5, padding: "0.4rem 0.8rem", cursor: "pointer" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => toggleSoldOut(p)} style={{ background: p.soldOut ? "green" : "#b45309", color: "white", border: "none", borderRadius: 5, padding: "0.4rem 0.7rem", cursor: "pointer", fontSize: "0.8rem" }}>
                        {p.soldOut ? "✅ Available" : "❌ Sold Out"}
                      </button>
                      <button onClick={() => handleEdit(p)} style={{ backgroundColor: "#1976d2", color: "white", border: "none", borderRadius: 5, padding: "0.4rem 0.7rem", cursor: "pointer", fontSize: "0.8rem" }}>✏️ Edit</button>
                      <button onClick={() => handleDelete(p)} style={{ backgroundColor: "red", color: "white", border: "none", borderRadius: 5, padding: "0.4rem 0.7rem", cursor: "pointer", fontSize: "0.8rem" }}>🗑️ Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ProductsPage;