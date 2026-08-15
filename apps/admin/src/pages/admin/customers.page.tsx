import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { api } from "../../services/api";
import type { Customer } from "../../types";

export function CustomersPage() {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await api.getCustomers(page, search);
    setCustomers(res.data);
    setTotalPages(res.last_page);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Clientes</h1>

      <div className="mb-4 max-w-[320px]">
        <Input
          placeholder="Buscar por email..."
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Órdenes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Total gastado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Última orden</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-200">
                  <td className="px-4 py-3 text-sm">{c.name}</td>
                  <td className="px-4 py-3 text-sm">{c.email}</td>
                  <td className="px-4 py-3 text-sm">{c.total_orders}</td>
                  <td className="px-4 py-3 text-sm">S/ {c.total_spent.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.last_order_at
                      ? new Date(c.last_order_at).toLocaleDateString("es-PE")
                      : "—"}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm text-center text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-gray-500 self-center">
            Pág {page} de {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
