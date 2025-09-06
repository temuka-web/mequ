import React from "react";
import { useNavigate } from "react-router-dom";

const Policies = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#fffdf4", minHeight: "100vh", padding: "2rem", color: "#000" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>← Back</button>

      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>MEQU Store Policies</h1>

      <h2 style={{ fontWeight: "bold", marginTop: "1.5rem" }}>1. Shipping Policy</h2>
      <p><strong>Processing Time:</strong> Orders are processed within 1–3 business days.</p>
      <p><strong>Shipping Methods:</strong> We offer standard and express shipping.</p>
      <p><strong>Delivery Time:</strong> Standard delivery takes 3–7 business days; express takes 1–3 business days.</p>
      <p><strong>Tracking:</strong> A tracking number will be provided once your order is shipped.</p>

      <h2 style={{ fontWeight: "bold", marginTop: "1.5rem" }}>2. Return &amp; Refund Policy</h2>
      <p><strong>Eligibility:</strong> Returns are accepted within 3 days of delivery. Items must be unused, in original packaging, and in resalable condition.</p>
      <p><strong>Refund Method:</strong> Refunds will be issued to the original payment method within 5–7 business days after receiving and inspecting the returned item.</p>
      <p><strong>Non-Returnable Items:</strong> Custom, perishable, or clearance items are not eligible for returns.</p>
      <p><strong>Return Shipping:</strong> Customers are responsible for return shipping costs unless the item is defective or wrong.</p>

      <h2 style={{ fontWeight: "bold", marginTop: "1.5rem" }}>3. Payment Policy</h2>
      <p><strong>Accepted Payment Methods:</strong> Debit/Credit cards, NayaPay, Visa, Easypaisa, Bank Transfer.</p>
      <p><strong>Currency:</strong> All prices are listed in PKR.</p>

      <h2 style={{ fontWeight: "bold", marginTop: "1.5rem" }}>4. Privacy Policy</h2>
      <p>We respect your privacy and will never sell or share your personal information.</p>
      <p>Your data is used solely to process orders, ship items, and provide customer support.</p>
    </div>
  );
};

export default Policies;
