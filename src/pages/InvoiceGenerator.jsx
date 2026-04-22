import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import Barcode from "react-barcode";
import "./InvoiceGenerator.css";

function InvoiceGenerator() {
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem("invoices");
    return saved ? JSON.parse(saved) : [];
  });

  const containerRef = useRef(null);

  useEffect(() => {
    // Check for regular order
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

    // Check for DM order
    const storedDMOrder = localStorage.getItem("selectedDMOrder");
    if (storedDMOrder) {
      const dmOrder = JSON.parse(storedDMOrder);
      localStorage.removeItem("selectedDMOrder");

      const newInvoice = {
        id: uuidv4(),
        receiver: {
          name: dmOrder.name,
          address: dmOrder.address,
          city: "",
          postalCode: "",
          phone: dmOrder.phone,
        },
        orderNumber: dmOrder.order_id.replace("DM-", "").slice(0, 6).toUpperCase(),
        amount: "",
      };

      setInvoices((prev) => {
        const updated = [...prev, newInvoice];
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
        inv.id === id
          ? { ...inv, receiver: { ...inv.receiver, [field]: value } }
          : inv
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
  };

  const addInvoice = () => {
    window.location.href = "/orders?selectMode=true";
  };

  const addFromDMOrders = () => {
    window.location.href = "/admin/dm-orders?selectMode=true";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-page" ref={containerRef}>

      {invoices.map((invoice) => (
        <div key={invoice.id} className="invoice-block">

          <p className="prepaid-header">
            📦 PREPAID BULK USER
          </p>

          <div className="invoice-header">

            {/* TO SECTION */}
            <div className="receiver-info">
              <h2 className="section-title">To (Receiver):</h2>

              <div className="field-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={invoice.receiver.name}
                  onChange={(e) =>
                    handleReceiverChange(invoice.id, "name", e.target.value)
                  }
                />
              </div>

              <div className="field-group">
                <label>Address:</label>
                <textarea
                  rows="3"
                  value={invoice.receiver.address}
                  onChange={(e) =>
                    handleReceiverChange(invoice.id, "address", e.target.value)
                  }
                />
              </div>

              <div className="field-group">
                <label>City:</label>
                <input
                  type="text"
                  value={invoice.receiver.city}
                  onChange={(e) =>
                    handleReceiverChange(invoice.id, "city", e.target.value)
                  }
                />
              </div>

              {invoice.receiver.postalCode && (
                <div className="field-group">
                  <label>Postal Code:</label>
                  <input
                    type="text"
                    value={invoice.receiver.postalCode}
                    onChange={(e) =>
                      handleReceiverChange(invoice.id, "postalCode", e.target.value)
                    }
                  />
                </div>
              )}

              <div className="field-group">
                <label>Phone:</label>
                <input
                  type="text"
                  value={invoice.receiver.phone}
                  onChange={(e) =>
                    handleReceiverChange(invoice.id, "phone", e.target.value)
                  }
                />
              </div>
            </div>

            {/* FROM SECTION */}
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
                <p>
                  <strong>Order #:</strong> {invoice.orderNumber}
                </p>
              </div>
              <div className="barcode">
                <Barcode value={invoice.orderNumber} height={40} width={1.2} />
              </div>
            </div>

            <div className="amount-group">
              <label>Amount:</label>
              <input
                type="number"
                value={invoice.amount}
                onChange={(e) => handleAmountChange(invoice.id, e.target.value)}
              />
            </div>

            <button
              onClick={() => handleDeleteInvoice(invoice.id)}
              className="delete-btn"
            >
              🗑 Delete
            </button>
          </div>

          <div className="urdu-warning">
            🔔 براہ مہربانی کسٹمر سے فون پر رابطہ کریں تاکہ وہ اپنا پارسل وصول کر سکے۔
          </div>

        </div>
      ))}

      <div className="actions">
        <button onClick={addInvoice}>📦 Add From Order</button>
        <button onClick={addFromDMOrders}>📮 Add From DM Orders</button>
        <button onClick={addManualInvoice}>➕ Add Blank</button>
        <button onClick={handlePrint} className="print-btn">
          🖨 Print
        </button>
      </div>

    </div>
  );
}

export default InvoiceGenerator;