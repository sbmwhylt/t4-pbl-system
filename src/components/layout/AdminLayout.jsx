import Sidebar from "../Sidebar";
import useAutoLogout from "@/hooks/useAutoLogout";

export default function AdminLayout({ children }) {
  useAutoLogout();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-h-screen lg:ml-64">
        {/* Mobile top bar spacer */}
        <div className="h-14 lg:hidden shrink-0" />

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
