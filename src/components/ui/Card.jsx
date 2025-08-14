// components/ui/Card.js
export default function Card({ children, variant = "default", ...props }) {
  const base = "p-4 rounded-xl shadow transition-colors";

  const variants = {
    default: `${base} bg-white`,
    primary: `${base} bg-blue-50`,
    secondary: `${base} bg-gray-50`,
    success: `${base} bg-green-50`,
    warning: `${base} bg-yellow-50`,
    danger: `${base} bg-red-50`,
  };

  return (
    <div className={variants[variant] || variants.default} {...props}>
      {children}
    </div>
  );
}
