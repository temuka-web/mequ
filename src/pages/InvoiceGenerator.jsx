import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import Barcode from "react-barcode";
import "./InvoiceGenerator.css";

function InvoiceGenerator() {
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem("invoices");
    return saved ? JSON.parse(saved) : [];
  });

  // printedIds persists in sessionStorage so it survives navigation but resets on refresh
  const [printedIds, setPrintedIds] = useState(() => {
    const saved = sessionStorage.getItem("printedInvoiceIds");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const storedOrder = localStorage.getItem("selectedOrder");
    if (storedOrder) {
      const order = JSON.parse(storedOrder);
      localStorage.removeItem("selectedOrder");
      const newInvoice = {
        id: uuidv4(),
        receiver: {
          name: order.customer_name,
          address: order.street_address,
          city: order.city,
          postalCode: order.postal_code,
          phone: order.customer_phone,
        },
        orderNumber: order.id.toString().slice(0, 6).toUpperCase(),
        amount: order.total,
      };
      setInvoices((prev) => {
        const updated = [...prev, newInvoice];
        localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      });
    }

    const storedDMOrder = localStorage.getItem("selectedDMOrder");
    if (storedDMOrder) {
      const dmOrder = JSON.parse(storedDMOrder);
      localStorage.removeItem("selectedDMOrder");
      const newInvoice = {
        id: uuidv4(),
        receiver: { name: dmOrder.name, address: dmOrder.address, city: "", postalCode: "", phone: dmOrder.phone },
        orderNumber: dmOrder.order_id.replace("DM-", "").slice(0, 6).toUpperCase(),
        amount: "",
      };
      setInvoices((prev) => {
        const updated = [...prev, newInvoice];
        localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      });
    }

    const storedBulkDM = localStorage.getItem("selectedDMOrders");
    if (storedBulkDM) {
      const dmOrders = JSON.parse(storedBulkDM);
      localStorage.removeItem("selectedDMOrders");
      const newInvoices = dmOrders.map((dmOrder) => ({
        id: uuidv4(),
        receiver: { name: dmOrder.name, address: dmOrder.address, city: "", postalCode: "", phone: dmOrder.phone },
        orderNumber: dmOrder.order_id.replace("DM-", "").slice(0, 6).toUpperCase(),
        amount: "",
      }));
      setInvoices((prev) => {
        const updated = [...prev, ...newInvoices];
        localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      });
    }

    const storedBulkOrders = localStorage.getItem("selectedOrders");
    if (storedBulkOrders) {
      const orders = JSON.parse(storedBulkOrders);
      localStorage.removeItem("selectedOrders");
      const newInvoices = orders.map((order) => ({
        id: uuidv4(),
        receiver: {
          name: order.customer_name,
          address: order.street_address,
          city: order.city,
          postalCode: order.postal_code,
          phone: order.customer_phone,
        },
        orderNumber: order.id.toString().slice(0, 6).toUpperCase(),
        amount: order.total,
      }));
      setInvoices((prev) => {
        const updated = [...prev, ...newInvoices];
        localStorage.setItem("invoices", JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  const addManualInvoice = () => {
    const blankInvoice = {
      id: uuidv4(),
      receiver: { name: "", address: "", city: "", postalCode: "", phone: "" },
      orderNumber: Math.random().toString(36).substr(2, 6).toUpperCase(),
      amount: "",
    };
    setInvoices((prev) => {
      const updated = [...prev, blankInvoice];
      localStorage.setItem("invoices", JSON.stringify(updated));
      return updated;
    });
  };

  const handleReceiverChange = (id, field, value) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) =>
        inv.id === id ? { ...inv, receiver: { ...inv.receiver, [field]: value } } : inv
      );
      localStorage.setItem("invoices", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAmountChange = (id, value) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) =>
        inv.id === id ? { ...inv, amount: value } : inv
      );
      localStorage.setItem("invoices", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteInvoice = (id) => {
    setInvoices((prev) => {
      const updated = prev.filter((inv) => inv.id !== id);
      localStorage.setItem("invoices", JSON.stringify(updated));
      return updated;
    });
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    // Also remove from printedIds if somehow deleted
    setPrintedIds((prev) => {
      const updated = prev.filter((pid) => pid !== id);
      sessionStorage.setItem("printedInvoiceIds", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((sid) => sid !== id);
      if (prev.length >= 3) {
        alert("You can only select up to 3 invoices at a time.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least 1 invoice to print.");
      return;
    }
    document.body.classList.add("printing-selected");
    selectedIds.forEach((id) => {
      const el = document.querySelector(`[data-invoice-id="${id}"]`);
      if (el) el.classList.add("selected-for-print");
    });
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-selected");
      selectedIds.forEach((id) => {
        const el = document.querySelector(`[data-invoice-id="${id}"]`);
        if (el) el.classList.remove("selected-for-print");
      });
      // Mark these as printed — they disappear from view until refresh
      const newlyPrinted = [...selectedIds];
      setPrintedIds((prev) => {
        const updated = [...prev, ...newlyPrinted];
        sessionStorage.setItem("printedInvoiceIds", JSON.stringify(updated));
        return updated;
      });
      setSelectedIds([]);
    }, 500);
  };

  const handlePrintAll = () => {
    window.print();
    // Mark ALL visible invoices as printed after print
    setTimeout(() => {
      setPrintedIds((prev) => {
        const updated = [...prev, ...visibleInvoices.map((inv) => inv.id)];
        sessionStorage.setItem("printedInvoiceIds", JSON.stringify(updated));
        return updated;
      });
      setSelectedIds([]);
    }, 500);
  };

  // Only show invoices that haven't been printed yet this session
  const visibleInvoices = invoices.filter((inv) => !printedIds.includes(inv.id));

  // Group into chunks of 3 for print pages
  const pages = [];
  for (let i = 0; i < visibleInvoices.length; i += 3) {
    pages.push(visibleInvoices.slice(i, i + 3));
  }

  const renderInvoice = (invoice) => {
    const isSelected = selectedIds.includes(invoice.id);
    return (
      <div
        key={invoice.id}
        data-invoice-id={invoice.id}
        className="invoice-block"
        style={{
          outline: isSelected ? "3px solid #7c3aed" : "3px solid transparent",
          position: "relative",
        }}
      >
        <div
          className="no-print"
          onClick={() => toggleSelect(invoice.id)}
          style={{
            position: "absolute", top: "12px", right: "12px", zIndex: 10,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            background: isSelected ? "#7c3aed" : "#fff",
            border: `2px solid ${isSelected ? "#7c3aed" : "#9ca3af"}`,
            borderRadius: "8px", padding: "5px 10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          <span style={{ fontSize: "1rem" }}>{isSelected ? "✅" : "☐"}</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: isSelected ? "#fff" : "#374151" }}>
            {isSelected ? "Selected" : "Select"}
          </span>
        </div>

        <p className="prepaid-header">📦 PREPAID BULK USER</p>

        <div className="invoice-header">
          <div className="receiver-info">
            <h2 className="section-title">To (Receiver):</h2>
            <div className="field-group">
              <label>Name:</label>
              <input type="text" value={invoice.receiver.name}
                onChange={(e) => handleReceiverChange(invoice.id, "name", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Address:</label>
              <textarea rows="3" value={invoice.receiver.address}
                onChange={(e) => handleReceiverChange(invoice.id, "address", e.target.value)} />
            </div>
            <div className="field-group city-field">
              <label>City:</label>
              <input type="text" value={invoice.receiver.city}
                onChange={(e) => handleReceiverChange(invoice.id, "city", e.target.value)} />
            </div>
            {invoice.receiver.postalCode && (
              <div className="field-group">
                <label>Postal Code:</label>
                <input type="text" value={invoice.receiver.postalCode}
                  onChange={(e) => handleReceiverChange(invoice.id, "postalCode", e.target.value)} />
              </div>
            )}
            <div className="field-group">
              <label>Phone:</label>
              <input type="text" value={invoice.receiver.phone}
                onChange={(e) => handleReceiverChange(invoice.id, "phone", e.target.value)} />
            </div>
          </div>

          <div className="sender-info">
            <h2 className="section-title">From (Sender):</h2>
            <p><strong>MEQU</strong></p>
            <p>03193128443</p>
            <p>Peshawar</p>
            <p>Hayatabad Phase 1, Street 9, Sector E3, House 201</p>
          </div>
        </div>

        <div className="order-info">
          <div className="order-row">
            <div>
              <h2>Order Information</h2>
              <p><strong>Order #:</strong> {invoice.orderNumber}</p>
            </div>
            <div className="barcode">
              <Barcode value={invoice.orderNumber} height={40} width={1.2} />
            </div>
          </div>
          <div className="amount-group">
            <label>Amount:</label>
            <input type="number" value={invoice.amount}
              onChange={(e) => handleAmountChange(invoice.id, e.target.value)} />
          </div>
          <button onClick={() => handleDeleteInvoice(invoice.id)} className="delete-btn no-print">
            🗑 Delete
          </button>
        </div>

        <div className="urdu-warning">
          🔔 براہ مہربانی کسٹمر سے فون پر رابطہ کریں تاکہ وہ اپنا پارسل وصول کر سکے۔
        </div>
      </div>
    );
  };

  return (
    <div className="invoice-page" ref={containerRef}>

      {/* Selection bar — screen only */}
      {visibleInvoices.length > 0 && (
        <div className="no-print" style={{
          width: "100%", maxWidth: "800px",
          background: selectedIds.length > 0 ? "#ede9fe" : "#f3f4f6",
          border: `2px solid ${selectedIds.length > 0 ? "#7c3aed" : "#e5e7eb"}`,
          borderRadius: "10px", padding: "12px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "10px", boxSizing: "border-box",
        }}>
          <div style={{ fontSize: "0.95rem", color: "#374151", fontWeight: 600 }}>
            {selectedIds.length === 0
              ? "☑️ Select invoices below (max 3) then print selected"
              : `✅ ${selectedIds.length}/3 selected`}
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {selectedIds.length > 0 && (
              <button onClick={() => setSelectedIds([])}
                style={{ padding: "7px 14px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                ✕ Deselect All
              </button>
            )}
            <button onClick={handlePrintSelected} disabled={selectedIds.length === 0}
              style={{
                padding: "7px 18px",
                background: selectedIds.length > 0 ? "linear-gradient(135deg, #7c3aed, #db2777)" : "#d1d5db",
                color: "#fff", border: "none", borderRadius: "6px",
                cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
                fontWeight: 700, fontSize: "0.95rem",
              }}>
              🖨️ Print Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* All printed message */}
      {visibleInvoices.length === 0 && invoices.length > 0 && (
        <div className="no-print" style={{
          width: "100%", maxWidth: "800px", textAlign: "center", padding: "40px",
          background: "#f0fdf4", borderRadius: "12px", border: "2px dashed #86efac", boxSizing: "border-box",
        }}>
          <p style={{ fontSize: "1.1rem", color: "#166534", fontWeight: 600, margin: 0 }}>
            ✅ All invoices printed! Refresh the page to see them again.
          </p>
        </div>
      )}

      {/* SCREEN VIEW: flat list */}
      <div className="screen-only">
        {visibleInvoices.map(renderInvoice)}
      </div>

      {/* PRINT VIEW: grouped into pages of 3 */}
      <div className="print-only">
        {pages.map((pageInvoices, pageIndex) => (
          <div key={pageIndex} className="print-page">
            {pageInvoices.map(renderInvoice)}
          </div>
        ))}
      </div>

      <div className="actions no-print">
        <button onClick={() => window.location.href = "/orders?selectMode=true"}>📦 Add From Order</button>
        <button onClick={() => window.location.href = "/admin/dm-orders?selectMode=true"}>📮 Add From DM Orders</button>
        <button onClick={addManualInvoice}>➕ Add Blank</button>
        <button onClick={handlePrintAll} className="print-btn">🖨 Print All</button>
      </div>

    </div>
  );
}

export default InvoiceGenerator;