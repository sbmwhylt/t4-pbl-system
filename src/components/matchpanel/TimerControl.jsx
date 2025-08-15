import React from "react";
import Button from "../ui/Button";
import { Play, Pause, Square } from "lucide-react";
import Card from "../ui/Card";

export default function TimerControl({
  timeRemaining,
  isTimerRunning,
  period,
  onStart,
  onPause,
  onReset,
  onPeriodChange,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Card>
      <h2 className="font-semibold mb-2">Timer</h2>

      {/* Clock + Period */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-4xl font-mono px-4 py-2 ">
          {formatTime(timeRemaining)}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="1ST">1ST</option>
            <option value="2ND">2ND</option>
          </select>
          <Button className="bg-gray-200 hover:bg-gray-300" onClick={onReset}>
            <Square size={18} />
          </Button>
        </div>
      </div>

      {/* Start/Pause */}
      <div className="flex gap-2">
        <Button
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isTimerRunning
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
          onClick={onStart}
          disabled={isTimerRunning}
        >
          <Play size={18} /> Start
        </Button>
        <Button
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            !isTimerRunning
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-700 text-white"
          }`}
          onClick={onPause}
          disabled={!isTimerRunning}
        >
          <Pause size={18} /> Pause
        </Button>
      </div>
    </Card>
  );
}
