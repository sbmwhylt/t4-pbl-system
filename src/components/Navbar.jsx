import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase"; // adjust path
import { ref, get } from "firebase/database";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userRef = ref(db, `users/${currentUser.uid}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          setUser(snapshot.val());
        }
      });
    }
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Teams", path: "/admin/teams" },
    { label: "Players", path: "/admin/players" },
    { label: "Boulders", path: "/admin/boulders" },
    { label: "Matches", path: "/admin/matches" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="w-full h-16 bg-white text-black flex items-center justify-between px-4 z-99 shadow-md">
      {/* Logo + Title */}
      <div className="flex gap-2 items-center justify-center">
        <img src="/T4-logo.png" alt="T4 Logo" className="h-8" />
        <h1 className="text-lg font-medium">Admin Panel</h1>
      </div>

      {/* Nav Links */}
      <div className="flex items-center justify-center gap-4">
        {navItems.map(({ label, path }) => (
          <Link key={path} to={path} className="hover:text-purple-800">
            {label}
          </Link>
        ))}
        <a
          href="/scoreboard/liveview"
          className="hover:text-purple-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          Live Scoreboard
        </a>
      </div>

      {/* Profile + Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center gap-2 rounded-full px-3 py-2 bg-purple-100 cursor-pointer">
          <img
            width="28"
            height="28"
            alt="Default pfp"
            src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg?20200418092106"
            className="rounded-full"
          />
          <p className="text-sm font-medium">{user ? user.fullname : "Current Admin"}</p>
        </div>
        <button className="hover:text-gray-300">
          <Settings className="cursor-pointer" size={20} />
        </button>
        <button onClick={handleLogout} className="hover:text-gray-300">
          <LogOut className="cursor-pointer" size={20} />
        </button>
      </div>
    </nav>
  );
}
