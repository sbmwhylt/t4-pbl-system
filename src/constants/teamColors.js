// Arranged in color-wheel order (warm → cool → neutrals) for a smooth visual flow
const TEAM_COLORS = [
  // Row 1: Warm tones → greens
  {
    id: "red",
    name: "Red",
    gradient: "bg-red-800",
    ring: "ring-red-800",
    badge: "bg-red-800",
  },
  {
    id: "orange",
    name: "Orange",
    gradient: "bg-orange-700",
    ring: "ring-orange-700",
    badge: "bg-orange-700",
  },
  {
    id: "amber",
    name: "Amber",
    gradient: "bg-amber-700",
    ring: "ring-amber-700",
    badge: "bg-amber-700",
  },
  {
    id: "yellow",
    name: "Yellow",
    gradient: "bg-yellow-600",
    ring: "ring-yellow-600",
    badge: "bg-yellow-600",
  },
  {
    id: "lime",
    name: "Lime",
    gradient: "bg-lime-700",
    ring: "ring-lime-700",
    badge: "bg-lime-700",
  },
  {
    id: "green",
    name: "Green",
    gradient: "bg-green-800",
    ring: "ring-green-800",
    badge: "bg-green-800",
  },
  {
    id: "emerald",
    name: "Emerald",
    gradient: "bg-emerald-700",
    ring: "ring-emerald-700",
    badge: "bg-emerald-700",
  },
  {
    id: "teal",
    name: "Teal",
    gradient: "bg-teal-700",
    ring: "ring-teal-700",
    badge: "bg-teal-700",
  },

  // Row 2: Cool tones → purples/pinks
  {
    id: "cyan",
    name: "Cyan",
    gradient: "bg-cyan-700",
    ring: "ring-cyan-700",
    badge: "bg-cyan-700",
  },
  {
    id: "sky",
    name: "Sky",
    gradient: "bg-sky-700",
    ring: "ring-sky-700",
    badge: "bg-sky-700",
  },
  {
    id: "blue",
    name: "Blue",
    gradient: "bg-blue-800",
    ring: "ring-blue-800",
    badge: "bg-blue-800",
  },
  {
    id: "indigo",
    name: "Indigo",
    gradient: "bg-indigo-800",
    ring: "ring-indigo-800",
    badge: "bg-indigo-800",
  },
  {
    id: "violet",
    name: "Violet",
    gradient: "bg-violet-800",
    ring: "ring-violet-800",
    badge: "bg-violet-800",
  },
  {
    id: "purple",
    name: "Purple",
    gradient: "bg-purple-800",
    ring: "ring-purple-800",
    badge: "bg-purple-800",
  },
  {
    id: "pink",
    name: "Pink",
    gradient: "bg-pink-800",
    ring: "ring-pink-800",
    badge: "bg-pink-800",
  },
  {
    id: "rose",
    name: "Rose",
    gradient: "bg-rose-700",
    ring: "ring-rose-700",
    badge: "bg-rose-700",
  },

  // Row 3: Neutrals
  {
    id: "black",
    name: "Black",
    gradient: "bg-gray-900",
    ring: "ring-gray-900",
    badge: "bg-gray-900",
  },
  {
    id: "silver",
    name: "Silver",
    gradient: "bg-gray-500",
    ring: "ring-gray-500",
    badge: "bg-gray-500",
  },
];

export const getGradientById = (id) =>
  TEAM_COLORS.find((g) => g.id === id) || TEAM_COLORS[0];

export default TEAM_COLORS;
