import { useAuth } from "../../hooks/use-auth";
import { Button } from "../ui/button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <h2 className="text-[0.9375rem] font-semibold text-gray-800">Admin Panel</h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[0.8125rem] text-gray-500">
          {user?.name ?? user?.email}
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
