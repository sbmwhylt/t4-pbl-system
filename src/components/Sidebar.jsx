// Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useUser } from "../context/UserContext";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  UserRound,
  Mountain,
  CalendarDays,
  Tv,
  Layers,
  Settings,
  LogOut,
} from "lucide-react";
import Spinner from "./ui/Spinner";

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state for logout

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Teams", path: "/admin/teams", icon: Users },
    { label: "Players", path: "/admin/players", icon: UserRound },
    { label: "Boulders", path: "/admin/boulders", icon: Mountain },
    { label: "Matches", path: "/admin/matches", icon: CalendarDays },
    {
      label: "Live Scoreboard",
      path: "/scoreboard/liveview",
      external: true,
      icon: Tv,
    },
    {
      label: "Match Panel",
      path: "/planb/panel",
      external: true,
      icon: Layers,
    },
  ];

  // Logout handler
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
    <>
      {/* Mobile Toggle */}
      {/* Mobile/Tablet Toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-gray-600 fixed top-4 left-4 z-50 bg-white rounded-md border border-gray-200"
      >
        <Menu size={24} />
      </button>

      {/* Overlay (mobile only) */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50 transform transition-transform duration-300 lg:translate-x-0 flex flex-col justify-between ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between h-16 px-4 ">
            <div className="flex gap-2 items-center justify-center ml-2">
              <img src="/T4-logo.png" alt="T4 Logo" className="h-8" />
              <h1 className="text-lg font-medium">Admin Panel</h1>
            </div>
            <button className="md:hidden" onClick={() => setOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-2 px-4 py-6">
            {navItems.map(({ label, path, external, icon: Icon }) =>
              external ? (
                <a
                  key={path}
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-purple-100"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </a>
              ) : (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-purple-100 ${
                    pathname === path ? "bg-purple-200 font-semibold" : ""
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              )
            )}
          </nav>
        </div>
        {/* Header */}

        <div className="flex gap-4 justify-between items-center bg-purple-300 m-3 rounded-full">
          <div className="flex items-center justify-center gap-2.5 rounded-full p-2 bg-black-300 cursor-pointer hover:text-purple-500 transition-colors">
            <img
              width="34"
              alt="Default pfp"
              src="https://avatar.iran.liara.run/public/boy?username=Ash"
              className="rounded-full"
            />
            <div className="flex flex-col leading-tight">
              <p className="text-sm font-medium text-gray-900">
                {user ? user.fullname : "Current Admin"}
              </p>
              <p className="text-xs text-gray-600">{user ? user.role : ""}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading} // Optional: disable button while loading
            className={`hover:bg-gray-800 hover:text-gray-100 bg-gray-100 p-2 flex items-center justify-center rounded-full cursor-pointer transition-colors mr-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <Spinner size={5} color="gray-500" />
            ) : (
              <LogOut size={16} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
