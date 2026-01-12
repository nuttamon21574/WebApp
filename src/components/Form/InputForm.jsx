export default function InputForm({
  id,
  label,
  type = "text",
  placeholder,
  required = false,
}) {
  return (
    <div className="mb-3">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        required={required}
        className="
          w-full rounded-lg border border-gray-300
          px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-purple-400
          focus:border-purple-400
        "
      />
    </div>
  );
}
