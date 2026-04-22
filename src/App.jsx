import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Policies from "./pages/Policies";
import Checkout from "./pages/Checkout";
import Products from "./pages/Products";
import Payment from "./pages/Payment";
import Contact from "./pages/Contact";
import WhatsAppButton from "./components/WhatsAppButton";

import AdminDashboard from "./pages/AdminDashboard";
import AddProduct from "./pages/AddProduct";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import InvoiceGenerator from "./pages/InvoiceGenerator";

import DMOrderForm from "./pages/DMOrderForm";
import DMOrders from "./pages/DMOrders";

import Logistics from "./pages/Logistics";
import TrackOrder from "./pages/TrackOrder";
import ScannerPage from "./pages/ScannerPage";

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

  useEffect(() => { localStorage.setItem("cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("products", JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem("orders", JSON.stringify(orders)); }, [orders]);

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
    setProducts((prev) => [...prev, { ...newProduct, soldOut: false, images: compressedImages }]);
  };

  const deleteProduct = (index) => setProducts((prev) => prev.filter((_, i) => i !== index));

  const toggleSoldOut = (index) =>
    setProducts((prev) => prev.map((p, i) => i === index ? { ...p, soldOut: !p.soldOut } : p));

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) => p.id === product.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCart = (newCart) => setCart(newCart);

  const addOrder = (order) => {
    setOrders((prev) => [...prev, order]);
    setCart([]);
  };

  const markPaid = (orderId) =>
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "paid" } : o));

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              cartItems={cart}
              onAddToCart={addToCart}
              setSelectedProduct={setSelectedProduct}
            />
          }
        />
        <Route path="/policies" element={<Policies />} />
        <Route path="/checkout" element={<Checkout cart={cart} updateCart={updateCart} />} />
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
        <Route path="/payment" element={<Payment cart={cart} addOrder={addOrder} />} />

        {/* Public */}
        <Route path="/dm-order" element={<DMOrderForm />} />
        <Route path="/track" element={<TrackOrder />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/add-product" element={<AddProduct addProduct={addProduct} />} />
        <Route path="/admin/products" element={<ProductsPage products={products} deleteProduct={deleteProduct} toggleSoldOut={toggleSoldOut} />} />
        <Route path="/admin/orders" element={<OrdersPage orders={orders} markPaid={markPaid} />} />
        <Route path="/orders" element={<OrdersPage orders={orders} markPaid={markPaid} />} />
        <Route path="/admin/invoices" element={<InvoiceGenerator />} />
        <Route path="/admin/dm-orders" element={<DMOrders />} />
        <Route path="/admin/logistics" element={<Logistics />} />
        <Route path="/admin/scanner" element={<ScannerPage />} />
      </Routes>

      <WhatsAppButton />
    </Router>
  );
}

export default App;