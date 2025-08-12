export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-gray-800 text-white flex items-center px-4 shadow-md">
      <h1 className="text-lg font-semibold">Admin Panel</h1>
      <div className="ml-auto flex items-center gap-4">
        <button className="hover:text-gray-300">Settings</button>
        <button className="hover:text-gray-300">Logout</button>
      </div>
    </nav>
  );
}
