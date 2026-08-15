import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/use-auth";
import { Icon, Popover, PopoverItem, PopoverLabel, PopoverSection } from "../polaris";
import { GlobalSearch } from "./global-search";

interface HeaderProps {
  menuOpen: boolean;
  onMenuClick: () => void;
}

export function Header({ menuOpen, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (isShortcut) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const initials = (user?.name ?? user?.email ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 bg-[#1a1a1a] px-3 sm:px-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors lg:hidden"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? (
            <Icon name="close" className="size-5" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-2 lg:w-57">
          <span className="flex size-7 items-center justify-center rounded-md bg-white text-xs font-bold text-gray-900">
            T
          </span>
          <span className="hidden text-[15px] font-semibold text-white sm:inline">TAP</span>
        </div>

        <div className="flex flex-1 justify-center px-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex w-full max-w-xl items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-left text-gray-400 transition-colors hover:bg-white/15"
          >
            <Icon name="search" className="size-4 shrink-0" />
            <span className="flex-1 truncate text-sm">Buscar</span>
            <span className="hidden shrink-0 items-center gap-1 rounded border border-white/15 px-1.5 py-0.5 text-[11px] font-medium text-gray-400 sm:flex">
              CTRL K
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Popover
            align="right"
            width="min-w-[200px]"
            activator={({ onClick }) => (
              <button
                type="button"
                onClick={onClick}
                className="flex size-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                {initials}
              </button>
            )}
          >
            {(close) => (
              <>
                <PopoverLabel>{user?.name ?? user?.email}</PopoverLabel>
                {user?.name && <p className="px-2 pb-1.5 text-xs text-ink-sub truncate">{user.email}</p>}
                <PopoverSection>
                  <PopoverItem
                    icon={<Icon name="settings" className="size-4" />}
                    onClick={() => {
                      close();
                      navigate("/admin/settings");
                    }}
                  >
                    Configuración
                  </PopoverItem>
                  <PopoverItem destructive onClick={() => { close(); logout(); }}>
                    Cerrar sesión
                  </PopoverItem>
                </PopoverSection>
              </>
            )}
          </Popover>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
