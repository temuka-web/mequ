import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-wrapper">
      <div className="top-nav">
        <div className="menu">☰</div>
        <div className="links">
          <a href="/">Home</a>
          <a href="/catalogue">Catalogue</a>
          <a href="/faqs">FAQs</a>
          <a href="/shipping">Shipping Policy</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/returns">Return Policy</a>
          <a href="/contact">Contact</a>
        </div>
        <div className="cart-buttons">
          <a href="/cart">Cart</a>
          <a href="/checkout">Checkout</a>
        </div>
      </div>

      <div className="splash-main">
        <div className="importo-container">
          <h1 className="importo-text">Mequ</h1>
          <svg className="plane" width="24" height="24" viewBox="0 0 24 24">
            <path fill="gray" d="M2 16.5l20-8.5-20-8.5v7l15 1.5-15 1.5v7z" />
          </svg>
        </div>
        <p className="tagline">
          Sourced from overstocked companies,<br />
          selling each item at wholesale price.
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
