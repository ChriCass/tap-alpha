import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { api } from "../../services/api";
import type { Product } from "../../types";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await api.getProducts(page, search);
    setProducts(res.data);
    setTotalPages(res.last_page);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await api.deleteProduct(id);
    fetchProducts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <Button>+ Nuevo producto</Button>
      </div>

      <div className="mb-4 max-w-[320px]">
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card padding="none">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  Producto
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  Precio base
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                  Estado
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-200">
                  <td className="px-4 py-3 text-sm">{p.name}</td>
                  <td className="px-4 py-3 text-sm">S/ {p.base_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!text-red-600"
                      onClick={() => handleDelete(p.id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500 self-center">
            Pág {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Product["status"] }) {
  const variants: Record<string, string> = {
    active: "text-emerald-700 bg-emerald-50",
    draft: "text-amber-700 bg-amber-50",
    archived: "text-gray-600 bg-gray-100",
  };

  const labels: Record<string, string> = {
    active: "Activo",
    draft: "Borrador",
    archived: "Archivado",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}
    >
      {labels[status]}
    </span>
  );
}
