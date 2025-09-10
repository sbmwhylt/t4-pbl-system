import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar (fixed on desktop, toggleable on mobile/tablet portrait) */}
      <Sidebar />

      {/* Main section */}
      <div className="flex flex-1 flex-col sm:mt-16 md:mt-14 lg:ml-64 lg:mt-0">
        {/* Main content */}
        <main className="flex-1 p-5 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
