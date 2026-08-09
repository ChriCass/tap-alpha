import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SelectField } from "../../components/forms/select-field";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { api } from "../../services/api";
import type { Order } from "../../types";

const statusOptions: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "processing", label: "En proceso" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await api.getOrders(page, statusFilter);
    setOrders(res.data);
    setTotalPages(res.last_page);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (id: number, status: string) => {
    await api.updateOrderStatus(id, status);
    fetchOrders();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Órdenes</h1>

      <div className="mb-4 max-w-[240px]">
        <SelectField
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Fecha</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-200">
                  <td className="px-4 py-3 text-sm">#{o.id}</td>
                  <td className="px-4 py-3 text-sm">{o.customer_name}</td>
                  <td className="px-4 py-3 text-sm">S/ {o.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="px-2 py-1 rounded border border-gray-300 text-xs"
                    >
                      {statusOptions
                        .filter((s) => s.value !== "")
                        .map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(o.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="ghost" size="sm">
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm text-center text-gray-500">
                    No se encontraron órdenes
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
