import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  TimerReset,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PERIODS = ["1ST", "2ND", "3RD", "4TH"];

export default function TimerControls({
  timer,
  onStart,
  onPause,
  onReset,
  period,
  onPeriodChange,
}) {
  const [tick, setTick] = useState(0);

  const isRunning = timer?.running;

  // Force re-render every second while running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, timer?.endTime]);

  const getRemaining = () => {
    if (!timer) return 0;
    if (timer.running && timer.endTime) {
      return Math.max(0, Math.floor((timer.endTime - Date.now()) / 1000));
    }
    return timer.remaining ?? timer.duration ?? 0;
  };

  const remaining = getRemaining();
  const isFinished = remaining <= 0;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ------------------------------ Period Controls
  const currentPeriodIndex =
    PERIODS.indexOf(period) >= 0 ? PERIODS.indexOf(period) : 0;

  const prevPeriod = () => {
    if (currentPeriodIndex > 0) {
      onPeriodChange(PERIODS[currentPeriodIndex - 1]);
    }
  };

  const nextPeriod = () => {
    if (currentPeriodIndex < PERIODS.length - 1) {
      onPeriodChange(PERIODS[currentPeriodIndex + 1]);
    }
  };

  const baseBtn =
    "px-3 py-3 rounded-full text-white transition-colors hover:opacity-90 cursor-pointer";

  return (
    <div className="">
      {/* Timer + Status */}
      <div className="flex justify-between items-center">
        {/* Timer */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2 ml-4">
            <span
              className={`w-3 h-3 rounded-full ${
                isFinished
                  ? "bg-red-500"
                  : isRunning
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            ></span>
            <span className="text-sm font-medium text-gray-700">
              {isFinished ? "Finished" : isRunning ? "Playing" : "Paused"}
            </span>
          </div>
          <div className="text-6xl font-bold tabular-nums mt-1 ml-3">
            {formatTime(remaining)}
          </div>
        </div>

        {/* Period Controls */}
        <div className="flex justify-center items-center gap-5 bg-gray-100 rounded-full p-2">
          <button
            onClick={prevPeriod}
            disabled={currentPeriodIndex === 0}
            className="px-2 py-2 rounded-full bg-gray-300 hover:bg-gray-400 disabled:opacity-50 cursor-pointer transition"
          >
            <ChevronLeft />
          </button>
          <div className="text-2xl font-bold text-gray-800">
            {PERIODS[currentPeriodIndex]}
          </div>
          <button
            onClick={nextPeriod}
            disabled={currentPeriodIndex === PERIODS.length - 1}
            className="px-2 py-2 rounded-full bg-gray-300 hover:bg-gray-400 disabled:opacity-50 cursor-pointer transition"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onStart}
            disabled={isRunning || isFinished}
            className={`${baseBtn} ${
              isRunning || isFinished
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500"
            }`}
          >
            <Play />
          </button>
          <button
            onClick={onPause}
            disabled={!isRunning || isFinished}
            className={`${baseBtn} ${
              !isRunning || isFinished
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-500"
            }`}
          >
            <Pause />
          </button>
          <button onClick={onReset} className={`${baseBtn} bg-red-600`}>
            <TimerReset />
          </button>
        </div>
      </div>
    </div>
  );
}
