// src/context/CartContext.jsx
import React, { createContext, useContext, useState } from "react";

/**
 * CartProvider
 * - Treats main product and each variant (color) as separate unique items.
 * - Uses a uniqueKey (parentId::variant::index or parentId::main) to identify items.
 * - Exposes addToCart, updateCart, removeFromCart, clearCart and total.
 */

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Build a stable unique key for an item
  const buildUniqueKey = (item) => {
    const pid = item.parentId ?? item.id;
    if (typeof item.variantIndex === "number") return `${pid}::v${item.variantIndex}`;
    if (item.variantName) return `${pid}::vname::${item.variantName}`;
    return `${pid}::main`;
  };

  const addToCart = (product) => {
    setCartItems((prev) => {
      const uniqueKey = buildUniqueKey(product);
      const idx = prev.findIndex((p) => p.uniqueKey === uniqueKey);

      if (idx !== -1) {
        // increment quantity
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 0) + 1 };
        return copy;
      }

      // store uniqueKey & parentId for checkout logic
      const item = {
        ...product,
        uniqueKey,
        parentId: product.parentId ?? product.id,
        quantity: product.quantity ?? 1,
      };
      return [...prev, item];
    });
  };

  const updateCart = (newCart) => {
    // normalize: ensure every item has uniqueKey & parentId
    const normalized = newCart.map((it) => {
      const uniqueKey = it.uniqueKey ?? buildUniqueKey(it);
      return { ...it, uniqueKey, parentId: it.parentId ?? it.id };
    });
    setCartItems(normalized);
  };

  const removeFromCart = (uniqueKey) => {
    setCartItems((prev) => prev.filter((it) => it.uniqueKey !== uniqueKey));
  };

  const clearCart = () => setCartItems([]);

  const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateCart, removeFromCart, clearCart, total, setCartItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
