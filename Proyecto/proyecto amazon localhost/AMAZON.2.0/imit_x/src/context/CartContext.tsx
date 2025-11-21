import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as cartService from '../services/cart.service';

interface CartItem {
  id: number;
  quantity: number;
  product_id: string;
  title: string;
  price: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, productInfo: { title: string; price: number; image?: string }) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  removeMultiple: (ids: number[]) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      const data = await cartService.getCart();
      setItems(data || []);
    } catch (err) {
      console.error('Error refreshing cart', err);
      setItems([]);
    }
  };

  const addItem = async (productId: string, quantity: number, productInfo: { title: string; price: number; image?: string }) => {
    try {
      await cartService.addToCart(productId, quantity, productInfo);
      await refreshCart(); // Actualizar el carrito después de agregar
    } catch (err) {
      console.error('Error adding to cart', err);
      throw err;
    }
  };

  const removeItem = async (id: number) => {
    // Actualización optimista
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    
    try {
      await cartService.removeCartItem(id);
      await refreshCart(); // Confirmar con el servidor
    } catch (err) {
      console.error('Error removing item', err);
      await refreshCart(); // Revertir en caso de error
      throw err;
    }
  };

  const removeMultiple = async (ids: number[]) => {
    // Actualización optimista
    setItems(prevItems => prevItems.filter(item => !ids.includes(item.id)));
    
    try {
      await Promise.all(ids.map(id => cartService.removeCartItem(id)));
      await refreshCart(); // Confirmar con el servidor
    } catch (err) {
      console.error('Error removing items', err);
      await refreshCart(); // Revertir en caso de error
      throw err;
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ items, itemCount, loading, refreshCart, addItem, removeItem, removeMultiple }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
