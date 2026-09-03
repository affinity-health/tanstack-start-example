import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { demoCatalog, demoPatients, type DemoCatalogProduct } from "../../lib/demo-data";

export type CartLine = { patientId: string; productId: string; quantity: number };
export type SubmittedOrder = {
  id: string;
  patientId: string;
  productIds: string[];
  status: "Submitted";
  submittedAt: string;
};

type CommerceState = {
  activity: string;
  addToCart(productId: string, patientId: string): void;
  cart: CartLine[];
  cartCount: number;
  categories: string[];
  category: string;
  clearPatientCart(patientId: string): void;
  closeProduct(): void;
  openProduct(productId: string): void;
  openProductId: string | null;
  orders: SubmittedOrder[];
  products: DemoCatalogProduct[];
  query: string;
  removeFromCart(productId: string, patientId: string): void;
  selectedCartPatientId: string;
  setActivity(message: string): void;
  setCategory(category: string): void;
  setQuery(query: string): void;
  setSelectedCartPatientId(patientId: string): void;
  submitPatientCart(patientId: string): SubmittedOrder | null;
  updateQuantity(productId: string, patientId: string, quantity: number): void;
};

const ClinicCommerceContext = createContext<CommerceState | null>(null);

export function ClinicCommerceProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [selectedCartPatientId, setSelectedCartPatientId] = useState(demoPatients[0]!.id);
  const [activity, setActivity] = useState("Human controls ready");
  const categories = useMemo(
    () => ["All", ...new Set(demoCatalog.map((item) => item.category))],
    [],
  );
  const products = useMemo(() => {
    const value = query.trim().toLowerCase();
    return demoCatalog.filter(
      (product) =>
        (category === "All" || product.category === category) &&
        (!value ||
          [product.name, product.description, product.strength, product.dosageForm]
            .join(" ")
            .toLowerCase()
            .includes(value)),
    );
  }, [category, query]);

  const addToCart = (productId: string, patientId: string) => {
    setSelectedCartPatientId(patientId);
    setCart((current) => {
      const existing = current.find(
        (line) => line.productId === productId && line.patientId === patientId,
      );
      return existing
        ? current.map((line) =>
            line === existing ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...current, { patientId, productId, quantity: 1 }];
    });
  };
  const removeFromCart = (productId: string, patientId: string) =>
    setCart((current) =>
      current.filter((line) => line.productId !== productId || line.patientId !== patientId),
    );
  const updateQuantity = (productId: string, patientId: string, quantity: number) =>
    setCart((current) =>
      current.map((line) =>
        line.productId === productId && line.patientId === patientId
          ? { ...line, quantity: Math.max(1, quantity) }
          : line,
      ),
    );
  const clearPatientCart = (patientId: string) =>
    setCart((current) => current.filter((line) => line.patientId !== patientId));
  const submitPatientCart = (patientId: string) => {
    const lines = cart.filter((line) => line.patientId === patientId);
    if (!lines.length) return null;
    const order: SubmittedOrder = {
      id: `nsc_${Date.now().toString(36)}`,
      patientId,
      productIds: lines.flatMap((line) =>
        Array.from({ length: line.quantity }, () => line.productId),
      ),
      status: "Submitted",
      submittedAt: "Just now",
    };
    setOrders((current) => [order, ...current]);
    clearPatientCart(patientId);
    setActivity(
      `Clinician submitted ${lines.length} cart item${lines.length === 1 ? "" : "s"} to Affinity Test.`,
    );
    return order;
  };

  return (
    <ClinicCommerceContext.Provider
      value={{
        activity,
        addToCart,
        cart,
        cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
        categories,
        category,
        clearPatientCart,
        closeProduct: () => setOpenProductId(null),
        openProduct: setOpenProductId,
        openProductId,
        orders,
        products,
        query,
        removeFromCart,
        selectedCartPatientId,
        setActivity,
        setCategory,
        setQuery,
        setSelectedCartPatientId,
        submitPatientCart,
        updateQuantity,
      }}
    >
      {children}
    </ClinicCommerceContext.Provider>
  );
}

export function useClinicCommerce() {
  const value = useContext(ClinicCommerceContext);
  if (!value) throw new Error("useClinicCommerce must be used inside ClinicCommerceProvider");
  return value;
}
