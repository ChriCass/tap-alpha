import { Card } from "../../components/ui/card";

export function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Analytics</h1>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-8">
        {[
          { label: "Ventas del mes", value: "S/ 12,450.00" },
          { label: "Órdenes", value: "87" },
          { label: "Tasa de conversión", value: "3.2%" },
          { label: "Productos vendidos", value: "142" },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-base font-semibold mb-2">Ingresos por mes</h2>
        <div className="h-[200px] flex items-end gap-2">
          {[40, 65, 45, 80, 55, 70, 90, 50, 60, 75, 85, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-indigo-600 rounded-t-sm opacity-80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </Card>
    </div>
  );
}
