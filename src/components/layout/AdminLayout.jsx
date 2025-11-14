import Sidebar from "../Sidebar";
import useAutoLogout from "@/hooks/useAutoLogout";

export default function AdminLayout({ children }) {
  useAutoLogout();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar (fixed on desktop, toggleable on mobile/tablet portrait) */}
      <Sidebar />

      {/* Main section */}
      <div className="flex flex-1 flex-col mt-16 sm:mt-16 md:mt-16 lg:ml-64 lg:mt-0">
        {/* Main content */}
        <main className="flex-1 p-5 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
