import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import "./Admin.css";

// Firebase imports
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { app, db } from "../firebase";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

// Image compression library
import imageCompression from "browser-image-compression";

// Barcode library
import JsBarcode from "jsbarcode";

/**
 * NOTE ABOUT LOCAL/PUBLIC IMAGES
 * ---------------------------------------------------------------------------
 * You said you store images locally (not mp4) in the project's /public folder.
 * This component now supports TWO ways to attach images to products:
 *
 * 1) Upload & compress (base64) — what you already had
 * 2) "Use local/public images" mode — lets you add paths like:
 *      /images/my-pic-1.jpg
 *      /images/products/shirt.png
 *    These paths are saved as-is, so the actual files must exist under /public.
 *
 * Toggle between modes via a checkbox above the file picker. In local mode:
 * - The file input still accepts images, but instead of converting to base64,
 *   we record /images/<filename> (or the subpath you type) so they render
 *   from public. You can also paste paths directly via a text area.
 *
 * We also hard-block videos (mp4 etc) anywhere the user tries to add media.
 * ---------------------------------------------------------------------------
 */

const IMAGE_ONLY_ACCEPT = "image/*";
const BLOCKED_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const DEFAULT_ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

/** Simple file util: returns lowercase extension including dot */
const getExt = (filename = "") => {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
};

/** Validate image by name/ext; block videos; allow known image types */
const isAllowedImageName = (name = "") => {
  const ext = getExt(name);
  if (!ext) return false;
  if (BLOCKED_EXTENSIONS.includes(ext)) return false;
  // Allow common image types
  if (DEFAULT_ALLOWED_IMAGE_EXTS.includes(ext)) return true;
  // default: try to allow if input type is image/*
  return true;
};

/** Normalize a local public path (ensure it starts with a leading slash) */
const normalizePublicPath = (raw) => {
  if (!raw) return "";
  let s = raw.trim();
  if (!s) return "";
  // Allow absolute http(s) but prefer local /public path-style
  if (/^https?:\/\//i.test(s)) return s;
  if (!s.startsWith("/")) s = "/" + s;
  return s;
};

/** Stronger numeric parser for price */
const parseRs = (val) => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const n = Number(String(val).replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
};

/** Make a random stable-ish key when o.id is absent */
const makeKey = (o) => o?.id || `${Math.random().toString(36).slice(2)}-${Date.now()}`;

/** A tiny helper for clamping text length safely */
const clampText = (s, max = 2000) => (String(s || "").length > max ? String(s).slice(0, max) + "…" : s);

/** Currency formatter (simple, since you’re showing “Rs”) */
const fmtRs = (n) => `Rs ${parseRs(n)}`;

/** Typography helpers used inside inline styles */
const baseCard = {
  padding: "0.5rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
};

const softButton = {
  padding: "0.3rem 0.6rem",
  cursor: "pointer",
  borderRadius: "4px",
  border: "none",
};

const dangerButton = {
  ...softButton,
  background: "red",
  color: "white",
};

const primaryButton = {
  ...softButton,
  background: "#008CBA",
  color: "white",
};

const successButton = {
  ...softButton,
  background: "#4CAF50",
  color: "white",
};

const grayButton = {
  ...softButton,
  background: "#ccc",
  color: "#111",
};

const sectionHeader = {
  cursor: "pointer",
  userSelect: "none",
};

const Admin = ({
  products = [],
  addProduct,
  deleteProduct,
  toggleSoldOut,
  orders = [],
  markPaid,
  updateProductUrgency,
  updateProductImages,
  removeOrder,
  // Optional: persist soldOut to Firestore when toggling (if you want)
  persistSoldOut = false,
}) => {
  // -----------------------------
  // FORM + UI STATE
  // -----------------------------
  const [form, setForm] = useState({
    name: "",
    price: "",
    desc: "",
    images: [],
  });

  const [useLocalPublicImages, setUseLocalPublicImages] = useState(true);
  const [manualLocalPaths, setManualLocalPaths] = useState(""); // newline-separated /images/foo.jpg entries

  const [openSection, setOpenSection] = useState(null);
  const [openOrders, setOpenOrders] = useState({});
  const [openProducts, setOpenProducts] = useState({});
  const [urgencyInputs, setUrgencyInputs] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editImages, setEditImages] = useState([]);

  // Local copy of orders so we can remove from UI immediately
  const [localOrders, setLocalOrders] = useState(orders || []);

  // Keep localOrders in sync when parent prop changes
  useEffect(() => {
    setLocalOrders(orders || []);
  }, [orders]);

  // -----------------------------
  // INVOICE STATE
  // -----------------------------
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const barcodeRef = useRef(null);

  // -----------------------------
  // AUTH STATE
  // -----------------------------
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const auth = getAuth();

  // -----------------------------
  // HANDLERS — FORM/PRODUCTS
  // -----------------------------
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Convert image files to compressed base64 strings
  const handleImageChange = async (e, forEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      // hard-block mp4 or video-like files
      const fileName = file?.name || "";
      const ext = getExt(fileName);
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        alert("❌ Videos are not allowed. Only images please (JPG, PNG, WEBP, etc).");
        continue;
      }

      if (!isAllowedImageName(fileName)) {
        alert(`❌ Not a supported image: ${fileName}`);
        continue;
      }

      try {
        if (useLocalPublicImages) {
          // LOCAL/PUBLIC MODE:
          // We *do not* compress or read the file. We store a path that matches /public.
          // By default, we assume /images/<filename>. You can edit manually too.
          const publicPath = normalizePublicPath("/images/" + fileName);
          if (forEdit) {
            setEditImages((prev) => [...prev, publicPath]);
          } else {
            setForm((prev) => ({ ...prev, images: [...prev.images, publicPath] }));
          }
        } else {
          // BASE64 MODE (original behavior, but strictly images)
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          });
          const base64 = await convertToBase64(compressedFile);
          const sizeInKB = Math.round((base64.length * 3) / 4 / 1024);
          if (sizeInKB > 500) {
            alert("❌ Compressed image still too large. Please upload smaller images.");
            continue;
          }
          if (forEdit) {
            setEditImages((prev) => [...prev, base64]);
          } else {
            setForm((prev) => ({ ...prev, images: [...prev.images, base64] }));
          }
        }
      } catch (err) {
        console.error("❌ Error handling image:", err);
        alert("❌ Failed to process image.");
      }
    }
  };

  // Manual local paths add — lets you paste newline separated lines like:
  // /images/a.jpg
  // /images/b.png
  const addManualLocalPaths = (forEdit = false) => {
    const lines = String(manualLocalPaths || "")
      .split("\n")
      .map((s) => normalizePublicPath(s))
      .filter(Boolean);
    if (!lines.length) {
      alert("Please paste one or more /public paths first.");
      return;
    }
    if (forEdit) {
      setEditImages((prev) => [...prev, ...lines]);
    } else {
      setForm((prev) => ({ ...prev, images: [...prev.images, ...lines] }));
    }
    setManualLocalPaths("");
  };

  // Helper: Convert file to base64 string
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Remove image from form or edit images
  const removeImage = (index, forEdit = false) => {
    if (forEdit) {
      setEditImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    }
  };

  // Add new product to Firestore and local state
  const handleAddProduct = async () => {
    if (!form.name || !form.price) {
      alert("Please fill product name and price!");
      return;
    }

    // filter out any accidental mp4 or empty strings
    const safeImages = (form.images || []).filter((src) => {
      if (!src) return false;
      if (BLOCKED_EXTENSIONS.some((ext) => src.toLowerCase().endsWith(ext))) return false;
      return true;
    });

    const newProduct = {
      ...form,
      images: safeImages,
      soldOut: false,
      urgency: "",
      price: parseRs(form.price),
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "products"), newProduct);
      addProduct?.({ ...newProduct, id: docRef.id });
      setForm({ name: "", price: "", desc: "", images: [] });
      alert("✅ Product added!");
    } catch (err) {
      console.error("Error saving product:", err);
      alert("❌ Failed to add product.");
    }
  };

  // -----------------------------
  // AUTH
  // -----------------------------
  const login = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (res.user.email !== "moqukhattak3974@gmail.com") {
        alert("❌ You are not authorized!");
        await signOut(auth);
        return;
      }
      setUser(res.user);
      alert("✅ Logged in as Admin!");
    } catch (err) {
      alert("❌ Login failed: " + err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // -----------------------------
  // ORDERS
  // -----------------------------
  const handleConfirm = (orderId) => {
    markPaid?.(orderId);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    // Optimistically remove from UI
    const previous = localOrders;
    const filtered = (localOrders || []).filter((o) => o.id !== orderId);
    setLocalOrders(filtered);
    // Also close toggles for that order
    setOpenOrders((prev) => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });

    try {
      await deleteDoc(doc(db, "orders", orderId));
      removeOrder?.(orderId);
      alert("✅ Order deleted!");
    } catch (err) {
      console.error("Error deleting order:", err);
      // restore previous list
      setLocalOrders(previous);
      alert("❌ Failed to delete order.");
    }
  };

  // -----------------------------
  // UI TOGGLES / PRODUCT EDIT
  // -----------------------------
  const toggleSection = (section) => setOpenSection((prev) => (prev === section ? null : section));
  const handleUrgencyChange = (index, value) => setUrgencyInputs((prev) => ({ ...prev, [index]: value }));
  const saveUrgency = (index) => updateProductUrgency?.(index, urgencyInputs[index] || "");

  const saveEditedImages = (index) => {
    // Remove any mp4/blank
    const safe = (editImages || []).filter(
      (src) => !!src && !BLOCKED_EXTENSIONS.some((ext) => String(src).toLowerCase().endsWith(ext))
    );
    if (safe.length === 0) {
      alert("No valid images uploaded or added!");
      return;
    }
    updateProductImages?.(index, safe);
    setEditImages([]);
    setEditingIndex(null);
  };

  // Optional: persist soldOut to Firestore if asked
  const handleToggleSoldOut = async (p, index) => {
    try {
      toggleSoldOut?.(index);
      if (persistSoldOut && p?.id) {
        const ref = doc(db, "products", p.id);
        await updateDoc(ref, { soldOut: !p.soldOut });
      }
    } catch (e) {
      console.error("Failed to persist soldOut:", e);
    }
  };

  // -----------------------------
  // INVOICE / BARCODE
  // -----------------------------
  const generateInvoice = (order) => {
    const status =
      order.method?.toLowerCase() === "cod"
        ? "Unpaid"
        : order.method?.toLowerCase() === "online"
        ? "Paid"
        : "Unpaid";

    setInvoiceData({
      order,
      status,
    });
    setShowInvoice(true);
  };

  useEffect(() => {
    if (showInvoice && invoiceData && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, invoiceData.order.id || "000000", {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 50,
          displayValue: true,
        });
      } catch (e) {
        console.error("Barcode generation error", e);
      }
    }
  }, [showInvoice, invoiceData]);

  const printInvoice = () => {
    const el = document.getElementById("invoice-content");
    if (!el) return;
    const printContent = el.innerHTML;
    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.write("<html><head><title>Invoice</title>");
    printWindow.document.write(
      `<style>
        body { font-family: Arial, sans-serif; padding: 1rem; }
        h2, h3 { margin-bottom: 0.5rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
        .section { margin-bottom: 1rem; }
        .muted { color: #555; }
      </style>`
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(printContent);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // -----------------------------
  // LOGIN SCREEN
  // -----------------------------
  if (!user) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>🔑 Admin Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "300px", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "300px", padding: "0.5rem", marginBottom: "1rem" }}
        />
        <br />
        <button onClick={login} style={{ padding: "0.5rem 1rem" }}>
          Login
        </button>
      </div>
    );
  }

  // -----------------------------
  // MAIN ADMIN PANEL
  // -----------------------------
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>⚙️ Admin Panel</h2>
      <p>
        ✅ Logged in as <b>{user.email}</b>
      </p>
      <button onClick={logout} style={{ marginBottom: "2rem", padding: "0.5rem 1rem" }}>
        Logout
      </button>

      {/* Orders Section */}
      <div className="admin-section" style={{ marginBottom: "2rem" }}>
        <h3 style={sectionHeader} onClick={() => toggleSection("orders")}>
          Orders {openSection === "orders" ? "▲" : "▼"}
        </h3>
        <div className={`content ${openSection === "orders" ? "active" : ""}`} style={{ marginTop: "1rem" }}>
          {(!localOrders || localOrders.length) === 0 ? (
            <p>No orders yet.</p>
          ) : (
            [...(localOrders || [])]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((o) => (
                <div key={makeKey(o)} style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      cursor: "pointer",
                      background: "#eee",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      fontWeight: "bold",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenOrders((prev) => ({ ...prev, [o.id]: !prev[o.id] }));
                    }}
                  >
                    Order #{o.id || "000000"} - {o.name || "Unknown"}
                  </div>
                  {openOrders[o.id] && (
                    <div
                      style={{
                        padding: "0.5rem",
                        border: "1px solid #ccc",
                        marginTop: "0.5rem",
                        borderRadius: "4px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <p>
                        <b>Phone:</b> {o.phone || "N/A"}
                      </p>
                      <p>
                        <b>Address:</b> {o.fullAddress || "N/A"}
                      </p>
                      <p>
                        <b>Transaction ID:</b> {o.transactionId || "N/A"}
                      </p>
                      <p>
                        <b>Payment Method:</b> {o.method || "N/A"}
                      </p>
                      <p>
                        <b>Total:</b> {fmtRs(o.amount || 0)}
                      </p>
                      <p>
                        <b>Date:</b> {o.date || "Unknown"}
                      </p>
                      <p>
                        <b>Status:</b> {o.status || "pending"}
                      </p>
                      <div>
                        <h5>Items:</h5>
                        <ul>
                          {(o.items || []).map((item, idx) => (
                            <li key={idx}>
                              {item.name || "Unknown"} x {item.quantity || 1} - {fmtRs(item.price || 0)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p>
                        <b>QR / Barcode:</b> {o.id ? `Order-${o.id}` : "000000"}
                      </p>
                      <button
                        disabled={o.status === "confirmed"}
                        onClick={() => handleConfirm(o.id)}
                        style={{
                          ...softButton,
                          backgroundColor: o.status === "confirmed" ? "#4CAF50" : "#008CBA",
                          color: "white",
                          cursor: o.status === "confirmed" ? "default" : "pointer",
                        }}
                      >
                        {o.status === "confirmed" ? "✅ Confirmed" : "Confirm Order"}
                      </button>
                      <button
                        style={{ ...dangerButton, marginLeft: "1rem" }}
                        onClick={() => handleDeleteOrder(o.id)}
                      >
                        🗑 Delete Order
                      </button>
                      <button style={{ ...successButton, marginLeft: "1rem" }} onClick={() => generateInvoice(o)}>
                        🧾 Generate Invoice
                      </button>
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowInvoice(false)}
        >
          <div
            id="invoice-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              width: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
              fontSize: "14px",
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Invoice</h2>

            <div className="section" style={{ marginBottom: "1rem" }}>
              <h3>Receiver Info</h3>
              <p>
                <b>Name:</b> {invoiceData.order.name || "N/A"}
              </p>
              <p>
                <b>Phone:</b> {invoiceData.order.phone || "N/A"}
              </p>
              <p>
                <b>Address:</b> {invoiceData.order.fullAddress || "N/A"}
              </p>
            </div>

            <div className="section" style={{ marginBottom: "1rem" }}>
              <h3>Sender Info</h3>
              <p>
                <b>Name:</b> MEQU
              </p>
              <p>
                <b>Phone:</b> 03193128443
              </p>
              <p>
                <b>Address:</b> Peshawar, Hayatabad Phase 1, Sector E3, House 201, Street 9
              </p>
            </div>

            <div className="section" style={{ marginBottom: "1rem" }}>
              <h3>Order Details</h3>
              <p>
                <b>Order Number:</b> {invoiceData.order.id || "000000"}
              </p>
              <p>
                <b>Status:</b> {invoiceData.status}
              </p>
              <p>
                <b>Payment Method:</b> {invoiceData.order.method || "N/A"}
              </p>
              <p>
                <b>Date:</b> {invoiceData.order.date || "N/A"}
              </p>
              <p>
                <b>Total Amount:</b> {fmtRs(invoiceData.order.amount || 0)}
              </p>
              {/* show Amount to Pay as 0 if already paid */}
              <p>
                <b>Amount to Pay:</b>{" "}
                {(() => {
                  const orderStatus = String(invoiceData.order?.status || "").toLowerCase();
                  const isPaid =
                    invoiceData.status === "Paid" ||
                    orderStatus === "paid" ||
                    invoiceData.order?.method?.toLowerCase() === "online";
                  return fmtRs(isPaid ? 0 : invoiceData.order.amount || 0);
                })()}
              </p>
            </div>

            <div className="section" style={{ marginBottom: "1rem" }}>
              <h3>Items</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Name</th>
                    <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Qty</th>
                    <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceData.order.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{item.name}</td>
                      <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{item.quantity}</td>
                      <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{fmtRs(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <svg ref={barcodeRef} />
            </div>

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button onClick={printInvoice} style={{ ...successButton, marginRight: "1rem" }}>
                Print Invoice
              </button>
              <button onClick={() => setShowInvoice(false)} style={{ ...dangerButton }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="admin-section" style={{ marginBottom: "2rem" }}>
        <h3 style={sectionHeader} onClick={() => toggleSection("products")}>
          Products {openSection === "products" ? "▲" : "▼"}
        </h3>
        <div className={`content ${openSection === "products" ? "active" : ""}`} style={{ marginTop: "1rem" }}>
          {products.length === 0 ? (
            <p>No products available.</p>
          ) : (
            products.map((p, index) => (
              <div
                key={p.id || index}
                style={{
                  ...baseCard,
                  marginBottom: "1rem",
                  backgroundColor: p.soldOut ? "#fdd" : "#f9f9f9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0 }}>
                    {p.name} {p.soldOut && "(Sold Out)"}
                  </h4>
                  <button
                    onClick={() => handleToggleSoldOut(p, index)}
                    style={{ ...softButton, padding: "0.2rem 0.5rem" }}
                    title="Toggle Sold Out"
                  >
                    Toggle Sold Out
                  </button>
                </div>

                <p style={{ margin: "0.3rem 0" }}>
                  <b>Price:</b> {fmtRs(p.price)}
                </p>

                {/* Description intentionally not shown in products list per request */}

                {p.images && p.images.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {p.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={p.name}
                        style={{ maxWidth: "100px", maxHeight: "100px", borderRadius: "4px", objectFit: "cover" }}
                      />
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Urgency"
                    value={urgencyInputs[index] ?? p.urgency ?? ""}
                    onChange={(e) => handleUrgencyChange(index, e.target.value)}
                    style={{ marginRight: "0.5rem", padding: "0.3rem" }}
                  />
                  <button onClick={() => saveUrgency(index)} style={{ ...softButton }}>
                    Save Urgency
                  </button>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  {editingIndex === index ? (
                    <>
                      {/* Image edit toolbar */}
                      <div style={{ marginBottom: "0.5rem" }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={useLocalPublicImages}
                            onChange={(e) => setUseLocalPublicImages(e.target.checked)}
                          />
                          <span>Use local/public images (e.g. /images/pic.jpg)</span>
                        </label>
                      </div>

                      <input
                        type="file"
                        multiple
                        accept={IMAGE_ONLY_ACCEPT}
                        onChange={(e) => handleImageChange(e, true)}
                        style={{ marginBottom: "0.5rem" }}
                      />

                      {useLocalPublicImages && (
                        <div style={{ margin: "0.5rem 0" }}>
                          <textarea
                            rows={3}
                            value={manualLocalPaths}
                            onChange={(e) => setManualLocalPaths(e.target.value)}
                            placeholder={"Paste /images/... paths (one per line)"}
                            style={{ width: "100%", padding: "0.5rem", resize: "vertical" }}
                          />
                          <button onClick={() => addManualLocalPaths(true)} style={{ ...softButton, marginTop: "0.3rem" }}>
                            Add Local Paths
                          </button>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {editImages.length > 0
                          ? editImages.map((img, i) => (
                              <div key={i} style={{ position: "relative" }}>
                                <img
                                  src={img}
                                  alt="edit"
                                  style={{ maxWidth: "80px", maxHeight: "80px", borderRadius: "4px", objectFit: "cover" }}
                                />
                                <button
                                  onClick={() => removeImage(i, true)}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    background: "rgba(255,0,0,0.8)",
                                    border: "none",
                                    borderRadius: "50%",
                                    color: "white",
                                    width: "20px",
                                    height: "20px",
                                    cursor: "pointer",
                                  }}
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          : p.images?.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="existing"
                                style={{ maxWidth: "80px", maxHeight: "80px", borderRadius: "4px", objectFit: "cover" }}
                              />
                            ))}
                      </div>

                      <button onClick={() => saveEditedImages(index)} style={{ ...primaryButton, marginTop: "0.5rem" }}>
                        Save Images
                      </button>
                      <button
                        onClick={() => {
                          setEditingIndex(null);
                          setEditImages([]);
                          setManualLocalPaths("");
                        }}
                        style={{ ...grayButton, marginLeft: "0.5rem" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingIndex(index);
                        setEditImages(p.images || []);
                      }}
                      style={{ ...softButton, marginTop: "0.5rem" }}
                    >
                      Edit Images
                    </button>
                  )}
                </div>

                <button onClick={() => deleteProduct?.(index)} style={{ ...dangerButton, marginTop: "0.5rem" }}>
                  Delete Product
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add New Product */}
      <div className="admin-section" style={{ marginBottom: "2rem" }}>
        <h3 style={sectionHeader} onClick={() => toggleSection("add")}>
          Add Product {openSection === "add" ? "▲" : "▼"}
        </h3>

        {openSection === "add" && (
          <div style={{ marginTop: "1rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Product Name"
                style={{ width: "100%", padding: "0.5rem" }}
              />
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Price"
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>

            <textarea
              name="desc"
              value={form.desc}
              onChange={handleChange}
              placeholder="Description"
              style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", resize: "vertical" }}
              rows={3}
            />

            {/* Toggle image mode */}
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={useLocalPublicImages}
                  onChange={(e) => setUseLocalPublicImages(e.target.checked)}
                />
                <span>Use local/public images (e.g. /images/file.jpg)</span>
              </label>
            </div>

            {/* File input */}
            <input
              type="file"
              multiple
              accept={IMAGE_ONLY_ACCEPT}
              onChange={handleImageChange}
              style={{ marginBottom: "0.5rem" }}
            />

            {/* Manual local path input (visible in local mode) */}
            {useLocalPublicImages && (
              <div style={{ margin: "0.5rem 0" }}>
                <textarea
                  rows={3}
                  value={manualLocalPaths}
                  onChange={(e) => setManualLocalPaths(e.target.value)}
                  placeholder={"Paste /images/... paths (one per line)"}
                  style={{ width: "100%", padding: "0.5rem", resize: "vertical" }}
                />
                <button onClick={() => addManualLocalPaths(false)} style={{ ...softButton, marginTop: "0.3rem" }}>
                  Add Local Paths
                </button>
              </div>
            )}

            {/* Preview of to-be-added images */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "0.5rem 0" }}>
              {form.images.map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={img}
                    alt="upload"
                    style={{ maxWidth: "80px", maxHeight: "80px", borderRadius: "4px", objectFit: "cover" }}
                  />
                  <button
                    onClick={() => removeImage(i)}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: "rgba(255,0,0,0.8)",
                      border: "none",
                      borderRadius: "50%",
                      color: "white",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button onClick={handleAddProduct} style={primaryButton}>
              Add Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
