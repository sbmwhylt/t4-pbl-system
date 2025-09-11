import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  TimerReset,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { timerService } from "@/services";

const PERIODS = ["1ST", "2ND", "3RD", "4TH"];

export default function TimerControls({
  matchId,
  timer,
  onStart,
  onPause,
  onResume,
  onReset,
  period,
  onPeriodChange,
  panelSide = "left", // 'left' or 'right'
}) {
  const [tick, setTick] = useState(0);
  const [localTimer, setLocalTimer] = useState(timer);

  // Sync with external timer changes
  useEffect(() => {
    setLocalTimer(timer);
  }, [timer]);

  const isRunning = localTimer?.running;
  const isController = localTimer?.lastController === panelSide;

  // Force re-render every second while running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, localTimer?.endTime]);

  const getRemaining = () => {
    if (!localTimer) return 0;
    if (localTimer.running && localTimer.endTime) {
      return Math.max(0, Math.floor((localTimer.endTime - Date.now()) / 1000));
    }
    return localTimer.remaining ?? localTimer.duration ?? 0;
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

  // Timer control handlers
  const handleStart = async () => {
    if (onStart) {
      onStart(panelSide);
    } else {
      await timerService.startTimer(matchId, localTimer?.duration, panelSide);
    }
  };

  const handlePause = async () => {
    if (onPause) {
      onPause(panelSide);
    } else {
      await timerService.pauseTimer(matchId, panelSide);
    }
  };

  const handleResume = async () => {
    if (onResume) {
      onResume(panelSide);
    } else {
      await timerService.resumeTimer(matchId, panelSide);
    }
  };

  const handleReset = async () => {
    if (onReset) {
      onReset(panelSide);
    } else {
      await timerService.resetTimer(matchId, localTimer?.duration, panelSide);
    }
  };

  // Period Controls
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
    <div className="p-4 bg-gray-50 rounded-lg">
      {/* Controller Indicator */}
      <div className="text-sm text-center mb-2 font-medium">
        {isController ? (
          <span className="text-green-600">● Controlling</span>
        ) : (
          <span className="text-gray-500">● Viewing</span>
        )}
      </div>

      {/* Timer + Status */}
      <div className="flex justify-between items-center">
        {/* Timer */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2 ml-4"></div>
          <div className="text-5xl font-bold ">
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
          {isRunning ? (
            <button
              onClick={handlePause}
              disabled={isFinished}
              className={`${baseBtn} ${
                isFinished ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500"
              }`}
            >
              <Pause />
            </button>
          ) : (
            <button
              onClick={isFinished ? handleReset : handleResume}
              disabled={isFinished && !isController}
              className={`${baseBtn} ${
                isFinished ? "bg-gray-400 cursor-not-allowed" : "bg-green-500"
              }`}
            >
              <Play />
            </button>
          )}
          <button onClick={handleReset} className={`${baseBtn} bg-red-600`}>
            <TimerReset />
          </button>
        </div>
      </div>
    </div>
  );
}
