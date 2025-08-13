export default function Button({ children, variant = "primary", ...props }) {
  const base =
    "px-4 py-2 rounded font-regular focus:outline-none transition-colors cursor-pointer";

  const variants = {
    primary: `${base} bg-blue-600 text-white hover:bg-blue-800`,
    secondary: `${base} bg-gray-300 text-black hover:bg-gray-500`,
    danger: `${base} bg-red-600 text-white hover:bg-red-700`,
  };

  return (
    <button className={variants[variant] || variants.primary} {...props}>
      {children}
    </button>
  );
}
