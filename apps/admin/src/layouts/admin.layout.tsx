import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/sidebar";
import { Navbar } from "../components/layout/navbar";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
