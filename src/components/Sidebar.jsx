import { useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        open ? "w-64" : "w-16"
      } h-screen fixed top-16 left-0`}
    >
      <div className="flex justify-end p-2">
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
          {open ? "<" : ">"}
        </button>
      </div>

      <ul className="space-y-2 mt-4">
        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Dashboard</li>
        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Users</li>
        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Settings</li>
      </ul>
    </aside>
  );
}
