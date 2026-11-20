import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Shopping = {
  cart: string[];
  saved: string[];
  ready: boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  toggleSaved: (id: string) => void;
};
const ShoppingContext = createContext<Shopping | null>(null);
function readIds(key: string) {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(data)
      ? [...new Set(data.filter((x): x is string => typeof x === "string"))]
      : [];
  } catch {
    return [];
  }
}
export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setCart(readIds("splitflix-cart"));
    setSaved(readIds("splitflix-saved"));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("splitflix-cart", JSON.stringify(cart));
        localStorage.setItem("splitflix-saved", JSON.stringify(saved));
      } catch {
        /* Storage may be unavailable in private browsing. */
      }
    }
  }, [cart, saved, ready]);
  return (
    <ShoppingContext.Provider
      value={{
        cart,
        saved,
        ready,
        add: (id) => setCart((old) => (old.includes(id) ? old : [...old, id])),
        remove: (id) => setCart((old) => old.filter((x) => x !== id)),
        clear: () => setCart([]),
        toggleSaved: (id) =>
          setSaved((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id])),
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
}
export function useShopping() {
  const value = useContext(ShoppingContext);
  if (!value) throw new Error("Shopping provider is missing");
  return value;
}
