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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`w-60 h-screen bg-indigo-950 text-indigo-200 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 text-xl font-bold text-white border-b border-indigo-900 flex items-center justify-between">
          TAP
          <button
            onClick={onClose}
            className="lg:hidden p-1 -mr-1 rounded-md text-indigo-300 hover:text-white hover:bg-indigo-900 transition-colors"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col p-3 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={() => onClose()}
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
    </>
  );
}
