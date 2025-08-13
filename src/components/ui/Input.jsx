export default function Input({ label, name, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition-colors"
        {...props}
      />
    </div>
  );
}
