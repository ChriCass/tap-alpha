import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "../polaris";

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: "/admin", label: "Inicio", icon: "home" },
  { to: "/admin/orders", label: "Órdenes", icon: "bag" },
  { to: "/admin/products", label: "Productos", icon: "inventory" },
  { to: "/admin/collections", label: "Colecciones", icon: "folder" },
  { to: "/admin/customers", label: "Clientes", icon: "person" },
  { to: "/admin/coupons", label: "Cupones", icon: "tag" },
  { to: "/admin/analytics", label: "Analytics", icon: "chart" },
  { to: "/admin/themes", label: "Temas", icon: "paint" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 top-14 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`w-60 h-[calc(100vh-3.5rem)] bg-white border-r border-gray-200 flex flex-col fixed left-0 top-14 z-40 transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col px-2 py-2 gap-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon name={item.icon} className="size-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-gray-100" />

          <NavLink
            to="/admin/settings"
            onClick={() => onClose()}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon name="settings" className="size-4.5 shrink-0" />
            Configuración
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
