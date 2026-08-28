import { useState } from "react";
import {
  Play,
  Pause,
  TimerReset,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
} from "lucide-react";
import { timerService } from "@/services/timer/timerService";
import {
  useSyncedCountdown,
  useClockReady,
} from "@/hooks/useSyncedCountdown";
import { DEFAULT_DURATION, DURATION_PRESETS, PERIODS } from "@/services/constant";

export default function TimerControls({
  matchId,
  timer,
  onStart,
  onPause,
  onResume,
  onReset,
  onDurationChange,
  period,
  onPeriodChange,
  panelSide = "left",
  hideMeta = false,
  hidePeriod = false,
}) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [customSeconds, setCustomSeconds] = useState("");

  // Shared, server-synced countdown — identical on every screen
  const remaining = useSyncedCountdown(timer, matchId);
  const clockReady = useClockReady();

  const currentDuration = timer?.duration ?? DEFAULT_DURATION;
  const isFinished = remaining <= 0;
  const isRunning = timer?.running;
  const isController = timer?.lastController === panelSide;
  const canEditDuration = !isRunning;

  // Timer control handlers
  const handleStart = async () => {
    if (onStart) onStart(panelSide);
    else await timerService.startTimer(matchId, timer?.duration, panelSide);
  };

  const handlePause = async () => {
    if (onPause) onPause(panelSide);
    else await timerService.pauseTimer(matchId, panelSide);
  };

  const handleResume = async () => {
    if (onResume) onResume(panelSide);
    else await timerService.resumeTimer(matchId, panelSide);
  };

  const handleReset = async () => {
    if (onReset) onReset(panelSide);
    else await timerService.resetTimer(matchId, timer?.duration, panelSide);
  };

  // Duration change handler
  const handleDurationChange = async (newDuration) => {
    if (onDurationChange) {
      onDurationChange(newDuration, panelSide);
    } else {
      await timerService.setDuration(matchId, newDuration, panelSide);
    }
    setShowDurationPicker(false);
    setCustomMinutes("");
    setCustomSeconds("");
  };

  const handleCustomDurationSubmit = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const total = mins * 60 + secs;
    if (total > 0) {
      handleDurationChange(total);
    }
  };

  // Period controls
  const currentPeriodIndex =
    PERIODS.indexOf(period) >= 0 ? PERIODS.indexOf(period) : 0;

  const prevPeriod = () => {
    if (currentPeriodIndex > 0) onPeriodChange(PERIODS[currentPeriodIndex - 1]);
  };
  const nextPeriod = () => {
    if (currentPeriodIndex < PERIODS.length - 1)
      onPeriodChange(PERIODS[currentPeriodIndex + 1]);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Dynamic border color based on timer state
  const borderColor = isFinished
    ? "border-red-300"
    : isRunning
      ? "border-green-300"
      : "border-gray-200";

  const timerColor = isFinished
    ? "text-red-500"
    : isRunning
      ? "text-green-600"
      : "text-gray-900";

  return (
    <div
      className={`rounded-xl border-2 bg-white ${borderColor} transition-colors overflow-hidden`}
    >
      {/* Controller Indicator */}
      {!hideMeta && (
        <div
          className={`text-xs text-center py-1.5 font-medium ${
            isController
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isController ? "Controlling" : "Viewing"}
        </div>
      )}

      <div className="px-5 py-4">
        {/* Main row: LEFT (period + duration) | CENTER (timer) | RIGHT (buttons) */}
        <div className="flex items-center">
          {/* LEFT — Period + Duration selector */}
          <div className="flex flex-col items-start gap-3 w-1/4">
            {/* Period Controls */}
            {!hidePeriod && (
              <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-1.5 py-1">
                <button
                  onClick={prevPeriod}
                  disabled={currentPeriodIndex === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-gray-800 w-8 text-center">
                  {PERIODS[currentPeriodIndex]}
                </span>
                <button
                  onClick={nextPeriod}
                  disabled={currentPeriodIndex === PERIODS.length - 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Duration toggle */}
            <button
              onClick={() =>
                canEditDuration && setShowDurationPicker((v) => !v)
              }
              disabled={!canEditDuration}
              className={`flex items-center gap-1.5 text-lg font-medium rounded-lg px-2.5 py-1.5 transition-all ${
                canEditDuration
                  ? showDurationPicker
                    ? "bg-blue-100 text-blue-700"
                    : "bg-blue-100 text-blue-700 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Clock size={16} /> Duration: {" "}
              {formatTime(currentDuration)}
            </button>
          </div>

          {/* CENTER — Timer Display */}
          <div className="flex-1 flex justify-center">
            <div
              className={`text-6xl font-bold tabular-nums tracking-tight ${timerColor}`}
            >
              {formatTime(remaining)}
            </div>
          </div>

          {/* RIGHT — Control Buttons */}
          <div className="flex items-center justify-end gap-3 w-1/4">
            {isRunning ? (
              <button
                onClick={handlePause}
                disabled={isFinished}
                className={`w-14 h-14 flex items-center justify-center rounded-xl text-white transition-all cursor-pointer ${
                  isFinished
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600 active:scale-95"
                }`}
              >
                <Pause size={26} />
              </button>
            ) : (
              <button
                onClick={isFinished ? handleReset : handleResume}
                disabled={(isFinished && !isController) || (!isFinished && !clockReady)}
                title={
                  !isFinished && !clockReady
                    ? "Syncing with server clock…"
                    : undefined
                }
                className={`w-14 h-14 flex items-center justify-center rounded-xl text-white transition-all cursor-pointer ${
                  isFinished || !clockReady
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 active:scale-95"
                }`}
              >
                <Play size={26} />
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-14 h-14 flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all cursor-pointer"
            >
              <TimerReset size={26} />
            </button>
          </div>
        </div>

        {/* Duration Picker (expanded) */}
        {showDurationPicker && canEditDuration && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
              Game Duration
            </p>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DURATION_PRESETS.map((preset) => {
                const isActive = currentDuration === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    onClick={() => handleDurationChange(preset.seconds)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                    }`}
                  >
                    {preset.label}
                    {isActive && (
                      <Check
                        size={12}
                        className="inline-block ml-1.5 -mt-0.5"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Duration Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Custom</span>
              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-2 py-1">
                <input
                  type="number"
                  min="0"
                  max="99"
                  placeholder="min"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCustomDurationSubmit()
                  }
                  className="w-12 bg-transparent text-center text-sm font-medium focus:outline-none placeholder:text-gray-300"
                />
                <span className="text-gray-400 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="sec"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCustomDurationSubmit()
                  }
                  className="w-12 bg-transparent text-center text-sm font-medium focus:outline-none placeholder:text-gray-300"
                />
              </div>
              <button
                onClick={handleCustomDurationSubmit}
                disabled={!customMinutes && !customSeconds}
                className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
