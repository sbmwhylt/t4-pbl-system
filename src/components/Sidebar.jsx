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
  Gamepad2,
  LogOut,
  User2,
  Cast,
} from "lucide-react";
import Spinner from "./ui/Spinner";
import Modal from "@/components/ui/Modal";

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Teams", path: "/admin/teams", icon: Users },
    { label: "Players", path: "/admin/players", icon: UserRound },
    { label: "Boulders", path: "/admin/boulders", icon: Mountain },
    { label: "Games", path: "/admin/games", icon: CalendarDays },
    {
      label: "Users",
      path: "/admin/users",
      icon: User2,
    },

    {
      label: "Multi-Team Scorer",
      path: "/admin/multi-team-scorer",
      icon: Gamepad2,
      external: true,
    },

    {
      label: "Scorer Panel",
      icon: Gamepad2,
      onClick: () => setIsModalOpen(true),
    },

    {
      label: "Broadcast Scoreboard",
      path: "/broadcast-scoreboard",
      icon: Tv,
      external: true,
    },

    {
      label: "Onsite Scoreboard",
      path: "/onsite-scoreboard",
      icon: Cast,
      external: true,
    },

    {
      label: "Multi-Team Display",
      path: "/multi-match",
      icon: Cast,
      external: true,
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
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity ${
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
            {navItems.map(({ label, path, external, icon: Icon, onClick }) =>
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
              ) : onClick ? (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-purple-100 w-full text-left"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ) : (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-purple-100 ${
                    pathname === path ? "bg-purple-200" : ""
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ),
            )}
          </nav>
        </div>
        {/* Header */}

        <div className="flex gap-4 justify-between items-center bg-purple-300 m-3 rounded-full">
          <div className="flex items-center justify-center gap-2.5 rounded-full p-2 bg-black-300 cursor-pointer hover:text-purple-500 transition-colors">
            <User2
              size={16}
              color={"black"}
              className="p-4 bg-white rounded-full text-purple-400"
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Choose Team"
      >
        <div className="flex gap-4 mt-4">
          {["left", "right"].map((side) => (
            <button
              key={side}
              onClick={() => {
                console.log(side); // for testing
                setIsModalOpen(false);
                // Open scoring page in new tab
                window.open(`/scorer/singlematch/${side}`, "_blank");
              }}
              className={`flex-1 h-32  bg-gray-100 hover:bg-gray-200 font-medium rounded-lg flex flex-col items-center justify-center text-2xl cursor-pointer transition-all ${
                side === "left" ? "text-red-500" : "text-blue-500"
              }`}
            >
              {side === "left" ? "Team 1" : "Team 2"}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
