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
  ExternalLink,
  BarChart3,
} from "lucide-react";
import Spinner from "./ui/Spinner";


export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  const navSections = [
    {
      label: "Management",
      items: [
        { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Teams", path: "/admin/teams", icon: Users },
        { label: "Players", path: "/admin/players", icon: UserRound },
        { label: "Boulders", path: "/admin/boulders", icon: Mountain },
        { label: "Matches", path: "/admin/matches", icon: CalendarDays },
        { label: "Player Rankings", path: "/admin/player-rankings", icon: BarChart3 },
        { label: "Team Rankings", path: "/admin/team-rankings", icon: BarChart3 },
        { label: "Users", path: "/admin/users", icon: User2 },
      ],
    },
    {
      label: "Scoring",
      items: [
        {
          label: "Scorer Panel",
          path: "/admin/scorer-panel",
          icon: Gamepad2,
          external: true,
          adminOnly: true,
        },
      ].filter((item) => !item.adminOnly || isAdmin),
    },
    {
      label: "Displays",
      items: [
        {
          label: "On-Site Scoreboard",
          path: "/onsite-scoreboard",
          icon: Cast,
          external: true,
        },
        {
          label: "Broadcast Scoreboard",
          path: "/broadcast-scoreboard",
          icon: Tv,
          external: true,
        },
      ],
    },
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

  const NavItem = ({ label, path, external, icon: Icon, onClick }) => {
    const isActive = pathname === path;
    const baseClasses =
      "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left";
    const activeClasses =
      "bg-purple-50 text-purple-700";
    const inactiveClasses =
      "text-gray-500 hover:bg-gray-100 hover:text-gray-700";

    const content = (
      <>
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-600 rounded-r-full" />
        )}
        <Icon
          size={18}
          className={`shrink-0 transition-colors duration-200 ${
            isActive ? "text-purple-600" : "text-gray-400 group-hover:text-gray-600"
          }`}
        />
        <span className="flex-1 truncate">{label}</span>
        {external && (
          <ExternalLink
            size={13}
            className="text-gray-300 group-hover:text-gray-400 shrink-0"
          />
        )}
      </>
    );

    if (onClick) {
      return (
        <button
          onClick={onClick}
          className={`${baseClasses} ${inactiveClasses}`}
        >
          {content}
        </button>
      );
    }

    if (external) {
      return (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} ${inactiveClasses}`}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        to={path}
        onClick={() => setOpen(false)}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <img src="/T4-logo.png" alt="T4 Logo" className="h-7" />
        <span className="text-sm font-semibold text-gray-800">Admin Panel</span>
      </div>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col border-r border-gray-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <img src="/T4-logo.png" alt="T4 Logo" className="h-8" />
            <h1 className="text-base font-semibold text-gray-900 tracking-tight">
              Admin Panel
            </h1>
          </div>
          <button
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.path || item.label} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-100 shrink-0">
              <User2 size={16} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user ? user.fullname : "Current Admin"}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user ? user.role : ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className={`p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 shrink-0 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Sign out"
            >
              {loading ? (
                <Spinner size={4} color="gray-400" />
              ) : (
                <LogOut size={16} />
              )}
            </button>
          </div>
        </div>
      </aside>

    </>
  );
}
