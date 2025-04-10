export function PrimaryButton({ children, ...props }) {
    return (
      <button
        {...props}
        className="w-full bg-primario text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {children}
      </button>
    );
  }
  