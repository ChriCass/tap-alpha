import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-[400px] bg-white rounded-lg p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-indigo-950 mb-6">
          TAP Admin
        </h1>
        <Outlet />
      </div>
    </div>
  );
}
