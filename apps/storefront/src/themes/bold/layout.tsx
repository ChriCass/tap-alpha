import { Link } from "react-router-dom";
import type { ThemeLayoutProps } from "../types";

export function BoldLayout({ store, children }: ThemeLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link
            to="/"
            className="text-xl font-black uppercase tracking-[0.2em] text-white"
          >
            {store?.name ?? "Tienda"}
          </Link>
          <span
            className="hidden h-2.5 w-2.5 rounded-full sm:block"
            style={{ background: "var(--theme-accent)" }}
          />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-12 text-sm text-neutral-400">
          <p className="text-base font-bold uppercase tracking-widest text-white">
            {store?.name}
          </p>
          {store?.email && <p>{store.email}</p>}
          {store?.phone && <p>{store.phone}</p>}
        </div>
      </footer>
    </div>
  );
}
