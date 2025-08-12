import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 bg-gray-100 p-6 ml-64 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
