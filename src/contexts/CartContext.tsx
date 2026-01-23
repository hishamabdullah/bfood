import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Product } from "@/hooks/useProducts";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  supplierProfile: any;
  items: CartItem[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getItemsBySupplier: () => Record<string, SupplierGroup>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "bfood_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage:", e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...currentItems, { id: product.id, product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getItemsBySupplier = () => {
    return items.reduce((acc, item) => {
      const supplierId = item.product.supplier_id;
      
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplierId,
          supplierName: item.product.supplier_profile?.business_name || "مورد غير معروف",
          supplierProfile: item.product.supplier_profile || null,
          items: [],
        };
      }
      acc[supplierId].items.push(item);
      return acc;
    }, {} as Record<string, { supplierId: string; supplierName: string; supplierProfile: any; items: CartItem[] }>);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
        getItemsBySupplier,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
