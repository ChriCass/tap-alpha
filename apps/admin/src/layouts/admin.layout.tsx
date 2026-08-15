import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/sidebar";
import { Header } from "../components/layout/header";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header menuOpen={sidebarOpen} onMenuClick={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-60 ml-0 pt-14 flex flex-col min-h-screen min-w-0">
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
