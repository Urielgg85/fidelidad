export function Card({ children }) {
    return (
      <div className="bg-white text-black p-6 rounded-lg shadow max-w-md w-full">
        {children}
      </div>
    );
  }