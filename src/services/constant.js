export const DEFAULT_DURATION = 450;

// Match periods, in order — drives both the period stepper and the
// "Round" control (round N corresponds to PERIODS[N - 1])
export const PERIODS = ["1ST", "2ND", "3RD", "4TH"];

// Preset game durations (in seconds) — easy to modify when rules change
export const DURATION_PRESETS = [
  { label: "1:30", seconds: 90 },
  { label: "3:00", seconds: 180 },
  { label: "7:30", seconds: 450 },
  { label: "8:30", seconds: 510 },
];

// Allowed roster sizes (active players per team) — the limit itself lives in
// Firebase at t4_bouldering/settings/max_active_players so every client agrees
export const TEAM_SIZE_OPTIONS = [5, 6];
export const DEFAULT_MAX_ACTIVE_PLAYERS = 5;
