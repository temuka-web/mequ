import React, { useState } from "react";
import "./Payment.css"; // make sure to import the CSS file

const Payment = ({ cart, addOrder }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postal: "",
    country: "",
    notes: "",
    method: "COD",
  });

  const [submitted, setSubmitted] = useState(false);

  const deliveryCharges = 250;
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * (item.quantity || 1),
    0
  );
  const total = subtotal + deliveryCharges;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMethodChange = (method) => {
    setForm({ ...form, method });
  };

  const handleSubmit = () => {
    const requiredFields = ["name", "phone", "street", "city", "country"];
    for (let field of requiredFields) {
      if (!form[field]) {
        alert("Please fill all required fields!");
        return;
      }
    }

    const fullAddress = `${form.street}, ${form.city}${
      form.postal ? ", " + form.postal : ""
    }, ${form.country}`;

    const itemsWithQuantity = cart.map((item) => ({
      ...item,
      quantity: item.quantity || 1,
    }));

    const order = {
      ...form,
      fullAddress,
      items: itemsWithQuantity,
      amount: total,
      status: "pending",
      id: Date.now(),
      date: new Date().toLocaleString(),
    };

    addOrder(order);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="payment-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {/* Animated Success Tick */}
        <div className="success-checkmark">
          <div className="check-icon">
            <span className="icon-line line-tip"></span>
            <span className="icon-line line-long"></span>
            <div className="icon-circle"></div>
            <div className="icon-fix"></div>
          </div>
        </div>

        <h2 style={{ marginTop: "2rem" }}>
          ✅ Congratulations! Your order has been submitted!
        </h2>
        <p>Your order will be confirmed by admin shortly.</p>
        <p>
          <strong>📞 Keep your phone number active</strong> so we can reach you
          if needed.
        </p>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <h2 className="payment-title">💳 Payment Page</h2>
      <p>Subtotal: Rs {subtotal}</p>
      <p>Delivery Charges: Rs {deliveryCharges}</p>
      <h3>Total Amount: Rs {total}</h3>

      {/* Payment Method Buttons */}
      <div style={{ margin: "1.5rem 0" }}>
        <label style={{ fontWeight: "bold" }}>Payment Method:</label>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={() => handleMethodChange("COD")}
            style={{
              padding: "0.5rem 1rem",
              background: form.method === "COD" ? "#333" : "#ddd",
              color: form.method === "COD" ? "#fff" : "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            💵 Cash on Delivery (COD)
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange("Online")}
            style={{
              padding: "0.5rem 1rem",
              background: form.method === "Online" ? "#333" : "#ddd",
              color: form.method === "Online" ? "#fff" : "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            💳 Online Payment
          </button>
        </div>
      </div>

      {/* COD Note */}
      {form.method === "COD" && (
        <p style={{ color: "#555", marginBottom: "1rem" }}>
          📦 Orders will be delivered within <strong>5 to 7 business days</strong>.
        </p>
      )}

      {/* Online Payment Note */}
      {form.method === "Online" && (
        <div
          style={{
            marginTop: "1rem",
            background: "#f4f4f4",
            padding: "1rem",
            borderRadius: "6px",
          }}
        >
          <p>
            💻 For Online Payment, please{" "}
            <a
              href="https://wa.me/923193128443"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "blue", fontWeight: "bold" }}
            >
              Contact us on WhatsApp
            </a>{" "}
            or message us on social media for payment instructions.
          </p>
        </div>
      )}

      {/* Customer Info Form */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
          marginTop: "1rem",
        }}
      >
        <input type="text" name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} />
        <input type="email" name="email" placeholder="Email (optional)" value={form.email} onChange={handleChange} />
        <input type="tel" name="phone" placeholder="Phone Number *" value={form.phone} onChange={handleChange} />
        <input type="text" name="street" placeholder="Street Address *" value={form.street} onChange={handleChange} />
        <input type="text" name="city" placeholder="City *" value={form.city} onChange={handleChange} />
        <input type="text" name="postal" placeholder="Postal Code (optional)" value={form.postal} onChange={handleChange} />
        <input type="text" name="country" placeholder="Country *" value={form.country} onChange={handleChange} />
        <textarea name="notes" placeholder="Additional Notes (optional)" value={form.notes} onChange={handleChange} />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="pay-now-button"
      >
        🛒 Submit Order
      </button>
    </div>
  );
};

export default Payment;
