import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, LogOut, Menu, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useUser } from "../context/UserContext";
import Spinner from "./ui/Spinner";

export default function Navbar() {
  const navigate = useNavigate();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Teams", path: "/admin/teams" },
    { label: "Players", path: "/admin/players" },
    { label: "Boulders", path: "/admin/boulders" },
    { label: "Matches", path: "/admin/matches" },
    { label: "Live Scoreboard", path: "/scoreboard/liveview", external: true },
    { label: "Plan B", path: "/planb/panel", external: true },
  ];

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-10">
        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <img src="/T4-logo.png" alt="T4 Logo" className="h-8" />
          <h1 className="text-lg font-medium">Admin Panel</h1>
        </div>

        {/* Desktop Nav (md and up) */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map(({ label, path, external }) =>
            external ? (
              <a
                key={path}
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-800"
              >
                {label}
              </a>
            ) : (
              <Link key={path} to={path} className="hover:text-purple-800">
                {label}
              </Link>
            )
          )}
        </div>

        {/* Profile + Actions (md and up) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full px-3 py-2 bg-purple-100">
            <img
              width="28"
              height="28"
              alt="Default pfp"
              src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg?20200418092106"
              className="rounded-full"
            />
            <p className="text-sm font-medium">
              {user ? user.fullname : "Current Admin"}
            </p>
          </div>
          <button className="hover:text-gray-600">
            <Settings size={20} />
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className={`hover:text-gray-600 flex items-center justify-center ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <Spinner size={5} color="gray-500" />
            ) : (
              <LogOut size={20} />
            )}
          </button>
        </div>

        {/* Hamburger (mobile only) */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-black"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setMenuOpen(false)}
        ></div>

        {/* Drawer Panel */}
        <div className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg flex flex-col">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={() => setMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex flex-col gap-4 px-4 py-6">
            {navItems.map(({ label, path, external }) =>
              external ? (
                <a
                  key={path}
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-purple-800"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-purple-800"
                >
                  {label}
                </Link>
              )
            )}
          </div>

          {/* Profile + Actions */}
          <div className="mt-auto border-t px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-full px-3 py-2 bg-purple-100">
              <img
                width="28"
                height="28"
                alt="Default pfp"
                src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg?20200418092106"
                className="rounded-full"
              />
              <p className="text-sm font-medium">
                {user ? user.fullname : "Current Admin"}
              </p>
            </div>
            <div className="flex gap-4">
              <button className="hover:text-gray-600">
                <Settings size={20} />
              </button>
              <button
                onClick={handleLogout}
                disabled={loading}
                className={`hover:text-gray-600 flex items-center justify-center ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <Spinner size={5} color="gray-500" />
                ) : (
                  <LogOut size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
