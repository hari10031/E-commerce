import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "./mock-data";

type CartItem = {
  product: Product;
  qty: number;
  color: string;
};

type Address = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
};

type ShopState = {
  cart: CartItem[];
  wishlist: string[];
  address: Address | null;
  shipping: "standard" | "express";
  payment: "upi" | "card" | "cod";
  addToCart: (product: Product, color: string, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  setAddress: (value: Address) => void;
  setShipping: (value: "standard" | "express") => void;
  setPayment: (value: "upi" | "card" | "cod") => void;
  clearCheckout: () => void;
};

const ShopContext = createContext<ShopState | null>(null);

const usePersistedState = <T,>(key: string, fallback: T) => {
  const [state, setState] = useState<T>(fallback);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        setState(JSON.parse(raw) as T);
      } catch {
        setState(fallback);
      }
    }
  }, [key, fallback]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
};

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = usePersistedState<CartItem[]>("km-cart", []);
  const [wishlist, setWishlist] = usePersistedState<string[]>("km-wishlist", []);
  const [address, setAddress] = usePersistedState<Address | null>("km-address", null);
  const [shipping, setShipping] = usePersistedState<"standard" | "express">(
    "km-shipping",
    "standard",
  );
  const [payment, setPayment] = usePersistedState<"upi" | "card" | "cod">("km-payment", "upi");

  const value = useMemo<ShopState>(
    () => ({
      cart,
      wishlist,
      address,
      shipping,
      payment,
      addToCart: (product, color, qty = 1) => {
        setCart((prev) => {
          const existing = prev.find((item) => item.product.id === product.id && item.color === color);
          if (existing) {
            return prev.map((item) =>
              item.product.id === product.id && item.color === color
                ? { ...item, qty: Math.min(item.qty + qty, 10) }
                : item,
            );
          }
          return [...prev, { product, qty, color }];
        });
      },
      updateQty: (productId, qty) =>
        setCart((prev) => prev.map((item) => (item.product.id === productId ? { ...item, qty } : item))),
      removeFromCart: (productId) =>
        setCart((prev) => prev.filter((item) => item.product.id !== productId)),
      toggleWishlist: (productId) =>
        setWishlist((prev) =>
          prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
        ),
      setAddress,
      setShipping,
      setPayment,
      clearCheckout: () => {
        setCart([]);
        setAddress(null);
      },
    }),
    [address, cart, payment, setAddress, setCart, setPayment, setShipping, shipping, wishlist, setWishlist],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside ShopProvider");
  return context;
};
