import Navbar from "../Navbar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />
      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-5">{children}</main>
    </div>
  );
}
