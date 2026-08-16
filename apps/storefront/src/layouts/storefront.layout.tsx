import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { api } from "../services/api";
import { useTheme } from "../hooks/use-theme";
import { themeComponents } from "../themes";
import type { StoreInfo } from "../types";

export function StorefrontLayout() {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const { Layout } = themeComponents(useTheme().key);

  useEffect(() => {
    api.getStoreInfo().then((res) => setStore(res.data));
  }, []);

  return (
    <Layout store={store}>
      <Outlet />
    </Layout>
  );
}
