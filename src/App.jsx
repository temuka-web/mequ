import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Policies from "./pages/Policies";
import Checkout from "./pages/Checkout";
import Products from "./pages/Products";
import Admin from "./pages/Admin";
import Payment from "./pages/Payment";
import Contact from "./pages/Contact";
import WhatsAppButton from "./components/WhatsAppButton";
import imageCompression from "browser-image-compression";

function App() {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("products");
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Error saving cart to localStorage:", e);
    }
  }, [cart]);

  // Persist products
  useEffect(() => {
    try {
      localStorage.setItem("products", JSON.stringify(products));
    } catch (e) {
      console.error("Error saving products to localStorage:", e);
    }
  }, [products]);

  // Persist orders
  useEffect(() => {
    try {
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (e) {
      console.error("Error saving orders to localStorage:", e);
    }
  }, [orders]);

  // Compress image
  const compressAndConvert = async (file) => {
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true };
    try {
      const compressed = await imageCompression(file, options);
      return await imageCompression.getDataUrlFromFile(compressed);
    } catch (error) {
      console.error("Image compression error:", error);
      return null;
    }
  };

  const addProduct = async (newProduct) => {
    const compressedImages = [];
    for (const img of newProduct.images || []) {
      if (typeof img === "string") {
        compressedImages.push(img);
      } else {
        const compressed = await compressAndConvert(img);
        if (compressed) compressedImages.push(compressed);
      }
    }

    setProducts((prev) => [
      ...prev,
      { ...newProduct, soldOut: false, images: compressedImages }
    ]);
  };

  const deleteProduct = (index) => setProducts((prev) => prev.filter((_, i) => i !== index));
  const toggleSoldOut = (index) =>
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, soldOut: !p.soldOut } : p))
    );

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCart = (newCart) => setCart(newCart);

  const submitOrder = (name, email) => {
    if (!cart.length) return alert("Cart is empty");
    const newOrder = {
      id: Date.now(),
      items: cart,
      total: cart.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0),
      customerName: name,
      customerEmail: email,
      status: "pending",
      date: new Date().toLocaleString(),
    };
    setOrders((prev) => [...prev, newOrder]);
    setCart([]);
    alert("Order submitted! Wait for confirmation.");
  };

  const addOrder = (order) => {
    setOrders((prev) => [...prev, order]);
    setCart([]);
  };

  const markPaid = (orderId) =>
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "paid" } : o))
    );

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Landing products={products} addToCart={addToCart} setSelectedProduct={setSelectedProduct} />}
        />
        <Route path="/policies" element={<Policies />} />
        <Route
          path="/checkout"
          element={<Checkout cart={cart} updateCart={updateCart} />}
        />
        <Route
          path="/products"
          element={
            <Products
              products={products}
              addToCart={addToCart}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
            />
          }
        />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/admin"
          element={
            <Admin
              products={products}
              addProduct={addProduct}
              deleteProduct={deleteProduct}
              toggleSoldOut={toggleSoldOut}
              orders={orders}
              markPaid={markPaid}
            />
          }
        />
        <Route path="/payment" element={<Payment cart={cart} addOrder={addOrder} />} />
      </Routes>

      <WhatsAppButton />
    </Router>
  );
}

export default App;
