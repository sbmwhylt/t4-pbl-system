// Arranged in color-wheel order (warm → cool → neutrals) for a smooth visual flow
const TEAM_GRADIENTS = [
  // Row 1: Warm tones → greens
  {
    id: "red",
    name: "Red",
    gradient: "bg-gradient-to-tr from-red-500 via-red-700 to-red-900",
    ring: "ring-red-500",
    badge: "bg-red-500",
  },
  {
    id: "orange",
    name: "Orange",
    gradient: "bg-gradient-to-tr from-orange-400 via-orange-600 to-orange-800",
    ring: "ring-orange-500",
    badge: "bg-orange-500",
  },
  {
    id: "amber",
    name: "Amber",
    gradient: "bg-gradient-to-tr from-amber-400 via-amber-600 to-amber-800",
    ring: "ring-amber-500",
    badge: "bg-amber-500",
  },
  {
    id: "yellow",
    name: "Yellow",
    gradient: "bg-gradient-to-tr from-yellow-400 via-yellow-600 to-yellow-700",
    ring: "ring-yellow-500",
    badge: "bg-yellow-500",
  },
  {
    id: "lime",
    name: "Lime",
    gradient: "bg-gradient-to-tr from-lime-400 via-lime-600 to-lime-800",
    ring: "ring-lime-500",
    badge: "bg-lime-500",
  },
  {
    id: "green",
    name: "Green",
    gradient: "bg-gradient-to-tr from-green-500 via-green-700 to-green-900",
    ring: "ring-green-500",
    badge: "bg-green-500",
  },
  {
    id: "emerald",
    name: "Emerald",
    gradient: "bg-gradient-to-tr from-emerald-400 via-emerald-600 to-emerald-800",
    ring: "ring-emerald-500",
    badge: "bg-emerald-500",
  },
  {
    id: "teal",
    name: "Teal",
    gradient: "bg-gradient-to-tr from-teal-400 via-teal-600 to-teal-800",
    ring: "ring-teal-500",
    badge: "bg-teal-500",
  },

  // Row 2: Cool tones → purples/pinks
  {
    id: "cyan",
    name: "Cyan",
    gradient: "bg-gradient-to-tr from-cyan-400 via-cyan-600 to-cyan-800",
    ring: "ring-cyan-500",
    badge: "bg-cyan-500",
  },
  {
    id: "sky",
    name: "Sky",
    gradient: "bg-gradient-to-tr from-sky-400 via-sky-600 to-sky-800",
    ring: "ring-sky-500",
    badge: "bg-sky-500",
  },
  {
    id: "blue",
    name: "Blue",
    gradient: "bg-gradient-to-tr from-blue-500 via-blue-700 to-blue-900",
    ring: "ring-blue-500",
    badge: "bg-blue-500",
  },
  {
    id: "indigo",
    name: "Indigo",
    gradient: "bg-gradient-to-tr from-indigo-500 via-indigo-700 to-indigo-900",
    ring: "ring-indigo-500",
    badge: "bg-indigo-500",
  },
  {
    id: "violet",
    name: "Violet",
    gradient: "bg-gradient-to-tr from-violet-500 via-violet-700 to-violet-900",
    ring: "ring-violet-500",
    badge: "bg-violet-500",
  },
  {
    id: "purple",
    name: "Purple",
    gradient: "bg-gradient-to-tr from-purple-500 via-purple-700 to-purple-900",
    ring: "ring-purple-500",
    badge: "bg-purple-500",
  },
  {
    id: "pink",
    name: "Pink",
    gradient: "bg-gradient-to-tr from-pink-500 via-pink-700 to-pink-900",
    ring: "ring-pink-500",
    badge: "bg-pink-500",
  },
  {
    id: "rose",
    name: "Rose",
    gradient: "bg-gradient-to-tr from-rose-400 via-rose-600 to-rose-800",
    ring: "ring-rose-500",
    badge: "bg-rose-500",
  },

  // Row 3: Neutrals
  {
    id: "black",
    name: "Black",
    gradient: "bg-gradient-to-tr from-gray-700 via-gray-600 to-gray-800",
    ring: "ring-gray-700",
    badge: "bg-gray-800",
  },
  {
    id: "silver",
    name: "Silver",
    gradient: "bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-500",
    ring: "ring-gray-400",
    badge: "bg-gray-400",
  },
];

export const getGradientById = (id) =>
  TEAM_GRADIENTS.find((g) => g.id === id) || TEAM_GRADIENTS[0];

export default TEAM_GRADIENTS;
