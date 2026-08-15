import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { api } from "../services/api";
import type { StoreInfo } from "../types";

export function StorefrontLayout() {
  const [store, setStore] = useState<StoreInfo | null>(null);

  useEffect(() => {
    api.getStoreInfo().then((res) => setStore(res.data));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header storeName={store?.name ?? "Tienda"} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer store={store} />
    </div>
  );
}
