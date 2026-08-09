import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { api } from "../../services/api";
import type { Analytics } from "../../types";

export function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAnalytics()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = data
    ? [
        { label: "Productos", value: data.products_count },
        { label: "Órdenes", value: data.orders_count },
        { label: "Clientes", value: data.customers_count },
        {
          label: "Ticket promedio",
          value: `S/ ${data.average_order_value.toFixed(2)}`,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </Card>
        ))}
      </div>

      {data && data.top_products.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold mb-4">Productos más vendidos</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-xs text-gray-500 font-semibold">Producto</th>
                <th className="text-right p-2 text-xs text-gray-500 font-semibold">Vendidos</th>
                <th className="text-right p-2 text-xs text-gray-500 font-semibold">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {data.top_products.map((p) => (
                <tr key={p.id} className="border-t border-gray-200">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-right">{p.sold}</td>
                  <td className="p-2 text-right">S/ {p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
