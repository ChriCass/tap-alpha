import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/products", label: "Productos", icon: "📦" },
  { to: "/admin/collections", label: "Colecciones", icon: "📁" },
  { to: "/admin/orders", label: "Órdenes", icon: "🛒" },
  { to: "/admin/customers", label: "Clientes", icon: "👥" },
  { to: "/admin/coupons", label: "Cupones", icon: "🏷" },
  { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  { to: "/admin/settings", label: "Configuración", icon: "⚙" },
];

export function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-indigo-950 text-indigo-200 flex flex-col fixed left-0 top-0">
      <div className="px-6 py-5 text-xl font-bold text-white border-b border-indigo-900">
        TAP
      </div>
      <nav className="flex flex-col p-3 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors hover:bg-indigo-900 hover:text-white ${
                isActive ? "bg-indigo-600 text-white" : ""
              }`
            }
          >
            <span className="text-lg w-6 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
