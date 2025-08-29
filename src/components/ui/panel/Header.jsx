import { Radio, ScreenShare } from "lucide-react";

export default function Header({ matchId }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-medium">Scoring Panel</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.open("/pages/live", "_blank")}
          className="border border-gray-300 text-sm text-red-500 px-4 py-2 rounded-full hover:bg-gray-100 transition cursor-pointer flex items-center gap-1.5"
        >
          <Radio size={18} /> Live Match
        </button>
        <button
          onClick={() => window.open(`/pages/score`, "_blank")}
          className="border border-gray-300 text-sm text-purple-500 px-4 py-2 rounded-full hover:bg-gray-100 transition cursor-pointer flex items-center gap-1.5"
        >
          {" "}
          <ScreenShare size={18} /> Score Page
        </button>
      </div>
    </div>
  );
}
