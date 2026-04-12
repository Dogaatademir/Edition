// src/context/CartContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CoffeeProduct } from '../data/products'; 
import { createShopifyCart, type ShopifyCartResponse } from '../lib/shopify';

export interface CartItem extends CoffeeProduct { 
  quantity: number;
  isSubscription?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  shopifyCart: ShopifyCartResponse | null;
  isLoadingCart: boolean;
  addToCart: (product: any, quantity?: number, isSubscription?: boolean) => void;
  removeFromCart: (productId: string | number) => void; 
  updateQuantity: (productId: string | number, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // LocalStorage'daki ürün bazlı yapı korunuyor (Ürün ID'leri ve Miktarları için)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('edition_cart') : null;
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Shopify'dan dönecek olan fiyat, indirim ve satır bazlı gerçek sepet verisi
  const [shopifyCart, setShopifyCart] = useState<ShopifyCartResponse | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  // Local state her değiştiğinde LocalStorage'ı güncelle
  useEffect(() => {
    localStorage.setItem('edition_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Sepet (cartItems) her değiştiğinde, gerçek tutarları ve indirimleri Shopify'dan çek
  useEffect(() => {
    let isMounted = true;
    const fetchShopifyCart = async () => {
      if (cartItems.length === 0) {
        if (isMounted) setShopifyCart(null);
        return;
      }
      setIsLoadingCart(true);
      try {
        const result = await createShopifyCart(cartItems);
        if (isMounted) setShopifyCart(result);
      } catch (err) {
        console.error("Shopify cart fetch error:", err);
      } finally {
        if (isMounted) setIsLoadingCart(false);
      }
    };

    fetchShopifyCart();
    return () => { isMounted = false; };
  }, [cartItems]);

  const addToCart = (product: any, quantity: number = 1, isSubscription: boolean = false) => {
    setCartItems(prevItems => {
      if (isSubscription) {
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

  const removeFromCart = (productId: string | number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string | number, delta: number) => {
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
    localStorage.removeItem('edition_cart');
    setShopifyCart(null);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      shopifyCart, 
      isLoadingCart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      isCartOpen, 
      setIsCartOpen, 
      cartCount 
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