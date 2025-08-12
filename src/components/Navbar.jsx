import { Link } from "react-router-dom";
import { Settings, LogOut, CircleUser } from "lucide-react";

export default function Navbar() {
  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Teams", path: "/admin/teams" },
    { label: "Players", path: "/admin/players" },
    { label: "Boulders", path: "/admin/boulders" },
    { label: "Matches", path: "/admin/matches" },
  ];

  return (
    <nav className="w-full h-16 bg-white text-black flex items-center justify-between px-4 shadow-md">
      <div className="flex gap-2 items-center justify-center">
        <img src="/T4-logo.png" alt="T4 Logo" className="h-8" />
        <h1 className="text-lg font-medium">Admin Panel</h1>
      </div>
      <div className="flex items-center justify-center gap-4">
        {navItems.map(({ label, path }) => (
          <Link key={path} to={path} className="hover:text-purple-800 ">
            {label}
          </Link>
        ))}
        <a
          href="/scoreboard/liveview"
          className="hover:text-purple-800"
          target="_blank"
        >
          Live Scoreboard{" "}
        </a>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center gap-2 rounded-full px-3 py-2 bg-purple-100 cursor-pointer">
          <img
            width="28"
            height="28"
            alt="Default pfp"
            src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg?20200418092106"
            className="rounded-full"
          />
          <p className="text-sm font-medium">Current Admin</p>
        </div>
        <button className="hover:text-gray-300">
          <Settings className="cursor-pointer" size={20}></Settings>
        </button>
        <button className="hover:text-gray-300">
          <LogOut className="cursor-pointer" size={20}></LogOut>
        </button>
      </div>
    </nav>
  );
}
