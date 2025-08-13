import { useEffect } from "react";
import { X } from "lucide-react";
export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Close on ESC key
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (X) */}
        <button onClick={onClose} aria-label="Close modal">
          <X size={16} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 cursor-pointer" />
        </button>

        {/* Title */}
        {title && (
          <h2 className="text-2xl font-medium text-center py-3">{title}</h2>
        )}

        {/* Body */}
        <div>{children}</div>

        {/* Footer */}
        {footer && <div>{footer}</div>}
      </div>
    </div>
  );
}
