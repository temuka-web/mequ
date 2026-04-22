// src/pages/AddProduct.jsx
import React, { useState } from "react";
import { supabase } from "../supabase";

const AddProduct = ({ addProduct }) => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    totalQuantity: "",
    image: "",
    colors: [],
  });

  const [newColor, setNewColor] = useState({ name: "", hex: "#000000", imagePath: "", qty: "" });
  const [loading, setLoading] = useState(false);

  const formatPath = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/images/")) return path;
    return `/images/${path.replace(/^\/+/, "")}`;
  };

  const handleAddColor = () => {
    if (!newColor.name) return alert("⚠️ Enter color name (e.g. Red)");
    if (!newColor.imagePath) return alert("⚠️ Enter image name like 1000009481.jpg");
    if (!newColor.qty) return alert("⚠️ Enter color quantity");

    const fixedPath = formatPath(newColor.imagePath);
    setProduct({
      ...product,
      colors: [...product.colors, { ...newColor, imagePath: fixedPath, qty: parseInt(newColor.qty) }],
    });

    setNewColor({ name: "", hex: "#000000", imagePath: "", qty: "" });
  };

  const handleDeleteColor = (index) => {
    const updated = [...product.colors];
    updated.splice(index, 1);
    setProduct({ ...product, colors: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product.name || !product.price || !product.totalQuantity) {
      return alert("⚠️ Please fill all required fields.");
    }

    const fixedMainImage = formatPath(product.image);

    if (!fixedMainImage && product.colors.length === 0) {
      return alert("⚠️ Add either a main image or at least one color image.");
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: product.name,
          price: parseFloat(product.price),
          description: product.description,
          image: fixedMainImage,
          totalQuantity: parseInt(product.totalQuantity),
          colors: product.colors, // now includes qty
          soldOut: false,
        },
      ])
      .select();

    setLoading(false);

    if (error) {
      console.error("❌ SUPABASE INSERT ERROR:", error);
      alert("Failed to add product! Check console.");
      return;
    }

    alert("✅ Product added successfully!");
    if (addProduct) addProduct(data[0]);
    setProduct({ name: "", price: "", description: "", totalQuantity: "", image: "", colors: [] });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Product</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="text" placeholder="Product Name" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />

        <input type="number" placeholder="Price" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} />

        <textarea placeholder="Description" value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />

        <input type="number" placeholder="Total Quantity" value={product.totalQuantity} onChange={(e) => setProduct({ ...product, totalQuantity: e.target.value })} />

        <input type="text" placeholder="Main Image Name (e.g. 1000009481.jpg)" value={product.image} onChange={(e) => setProduct({ ...product, image: e.target.value })} />

        {product.image && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={formatPath(product.image)} alt="main preview" width="100" style={{ border: "1px solid #000" }} />
            <button type="button" onClick={() => setProduct({ ...product, image: "" })}>❌ Delete Main Image</button>
          </div>
        )}

        <div style={{ border: "1px solid #ccc", padding: "10px" }}>
          <h4>Add Color Option</h4>
          <input type="text" placeholder="Color Name (e.g. Red)" value={newColor.name} onChange={(e) => setNewColor({ ...newColor, name: e.target.value })} />
          <input type="color" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} />
          <input type="text" placeholder="Image Name (e.g. 1000009481.jpg)" value={newColor.imagePath} onChange={(e) => setNewColor({ ...newColor, imagePath: e.target.value })} />
          <input type="number" placeholder="Color Qty" value={newColor.qty} onChange={(e) => setNewColor({ ...newColor, qty: e.target.value })} />
          <button type="button" onClick={handleAddColor}>Add Color</button>
        </div>

        {product.colors.length > 0 && (
          <div>
            <h4>Colors Added:</h4>
            {product.colors.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "25px", height: "25px", background: c.hex, border: "1px solid #000" }} />
                <img src={c.imagePath} alt="color preview" width="60" />
                <span>{c.name} ({c.hex}) - Qty: {c.qty}</span>
                <button type="button" onClick={() => handleDeleteColor(i)}>❌ Delete</button>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
