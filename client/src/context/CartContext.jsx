import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('snack_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderType] = useState('DELIVERY'); // 'DELIVERY' | 'TAKEAWAY'
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(30);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('snack_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  // Generate unique cart key based on item ID and customizations
  const createCartKey = (menuItemId, customizations = []) => {
    const custKey = customizations
      .map((c) => `${c.groupName}:${c.name}`)
      .sort()
      .join('|');
    return `${menuItemId}_${custKey}`;
  };

  const addToCart = (menuItem, quantity = 1, selectedCustomizations = []) => {
    const key = createCartKey(menuItem._id, selectedCustomizations);
    const customPrice = selectedCustomizations.reduce((acc, c) => acc + (Number(c.price) || 0), 0);
    const unitPrice = (Number(menuItem.price) || 0) + customPrice;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === key);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          itemTotal: unitPrice * newQty,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cartItemId: key,
          menuItemId: menuItem._id,
          name: menuItem.name,
          image: menuItem.image,
          isVeg: menuItem.isVeg,
          basePrice: menuItem.price,
          unitPrice,
          quantity,
          selectedCustomizations,
          itemTotal: unitPrice * quantity,
        },
      ];
    });

    setIsCartDrawerOpen(true);
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, item) => acc + item.itemTotal, 0);
  const activeDeliveryFee = orderType === 'DELIVERY' ? deliveryFee : 0;
  const estimatedTotal = subtotal + activeDeliveryFee;
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        orderType,
        setOrderType,
        deliveryFee,
        setDeliveryFee,
        activeDeliveryFee,
        subtotal,
        estimatedTotal,
        totalItemCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

