import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getCart,
  getGlobalCarts,
  updateCartItemQty,
  removeFromCart,
} from "@/services/cart.functions";
import type { CartDTO } from "@/types/orders";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

interface CartContextType {
  cart: CartDTO | null; // Current store cart
  globalCarts: CartDTO[]; // All active carts
  isCartOpen: boolean;
  isCartUpdating: boolean;
  setIsCartOpen: (open: boolean) => void;
  refreshCart: () => Promise<void>;
  updateQty: (variantId: string, delta: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  initCart: (initialCart: CartDTO | null, initialGlobalCarts?: CartDTO[]) => void;
  setCartData: (cart: CartDTO | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [globalCarts, setGlobalCarts] = useState<CartDTO[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartUpdating, setIsCartUpdating] = useState(false);
  const router = useRouter();

  const isRefreshingRef = React.useRef(false);

  const initCart = (initialCart: CartDTO | null, initialGlobalCarts?: CartDTO[]) => {
    if (initialCart !== undefined) setCart(initialCart);
    if (initialGlobalCarts !== undefined) setGlobalCarts(initialGlobalCarts);
  };

  const refreshCart = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsCartUpdating(true);
    try {
      const [updatedCart, updatedGlobalCarts] = await Promise.all([
        getCart().catch(() => null),
        getGlobalCarts().catch(() => []),
      ]);
      setCart(updatedCart || null);
      setGlobalCarts(updatedGlobalCarts || []);
      await router.invalidate();
    } catch (e) {
      console.error("Failed to refresh cart", e);
    } finally {
      isRefreshingRef.current = false;
      setIsCartUpdating(false);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      if (!isRefreshingRef.current) refreshCart();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const updateQty = async (variantId: string, delta: number) => {
    setIsCartUpdating(true);
    try {
      await updateCartItemQty({ data: { variantId, delta } });
    } catch (e: unknown) {
      toast.error(
        (e instanceof Error ? e.message : String(e)) || "Erro inesperado ao atualizar carrinho",
      );
    } finally {
      await refreshCart();
    }
  };

  const removeItem = async (itemId: string) => {
    setIsCartUpdating(true);
    try {
      await removeFromCart({ data: { itemId } });
    } catch (e: unknown) {
      toast.error(
        (e instanceof Error ? e.message : String(e)) || "Erro inesperado ao remover item",
      );
    } finally {
      await refreshCart();
    }
  };

  const setCartData = (newCart: CartDTO | null) => {
    setCart(newCart);
    refreshCart();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        globalCarts,
        isCartOpen,
        isCartUpdating,
        setIsCartOpen,
        refreshCart,
        updateQty,
        removeItem,
        initCart,
        setCartData,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
