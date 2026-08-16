import { Link } from "react-router-dom";
import type { ThemeLayoutProps } from "../types";

export function MinimalLayout({ store, children }: ThemeLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-gray-900">
            {store?.name ?? "Tienda"}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500">
          <p className="font-medium text-gray-700">{store?.name}</p>
          {store?.email && <p>{store.email}</p>}
          {store?.phone && <p>{store.phone}</p>}
        </div>
      </footer>
    </div>
  );
}
