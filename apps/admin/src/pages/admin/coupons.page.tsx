import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { api } from "../../services/api";
import type { Coupon } from "../../types";

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await api.getCoupons();
    setCoupons(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Cupones</h1>
        <Button>+ Nuevo cupón</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card padding="none">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Usos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-gray-200">
                  <td className="px-4 py-3 text-sm">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded">{c.code}</code>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.type === "percentage" ? "Porcentaje" : "Monto fijo"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.type === "percentage" ? `${c.value}%` : `S/ ${c.value}`}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.is_active
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-gray-600 bg-gray-100"
                      }`}
                    >
                      {c.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button variant="ghost" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm" className="!text-red-600">Eliminar</Button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm text-center text-gray-500">
                    No hay cupones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
