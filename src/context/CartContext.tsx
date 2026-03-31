// src/context/CartContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CoffeeProduct } from '../data/products'; // Product yerine CoffeeProduct import edildi

export interface CartItem extends CoffeeProduct { // Product yerine CoffeeProduct kullanıldı
  quantity: number;
  isSubscription?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, quantity?: number, isSubscription?: boolean) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // 1. ADIM: Başlangıçta verileri localStorage'dan oku
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // gaia_cart yerine edition_cart kullanıldı
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('edition_cart') : null;
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 2. ADIM: Sepet her değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    localStorage.setItem('edition_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: any, quantity: number = 1, isSubscription: boolean = false) => {
    setCartItems(prevItems => {
      if (isSubscription) {
        // Abonelik eklenince sepeti temizleyip sadece aboneliği koyuyoruz
        return [{ ...product, quantity: 1, isSubscription: true }];
      }
      
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity, isSubscription: false }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('edition_cart'); // Açıkça temizleme
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const totalPrice = cartItems.reduce((total, item) => {
    const priceStr = String(item.price);
    const price = parseFloat(priceStr.replace('₺', '').replace('.', '').replace(',', '.'));
    return total + (isNaN(price) ? 0 : price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, cartCount, totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};