// src/components/ui/InputField.jsx
export function InputField({ value, onChange, placeholder, type = 'text', ...props }) {
    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded mb-2"
        {...props}
      />
    );
  }