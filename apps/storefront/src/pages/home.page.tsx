import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { useTheme } from "../hooks/use-theme";
import { themeComponents } from "../themes";
import type { StoreProduct } from "../types";

export function HomePage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { Home } = themeComponents(useTheme().key);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await api.getProducts(search, page);
    setProducts(res.data);
    setTotalPages(res.last_page);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <Home
      products={products}
      loading={loading}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}
