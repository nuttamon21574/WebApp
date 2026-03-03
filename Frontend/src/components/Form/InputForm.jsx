export default function InputForm({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}) {
  return (
    <div className="flex flex-col">
      {/* Label */}
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      {error && (
        <p className="text-red-500 text-xs mt-1">
          {error}
        </p>
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
          ${error
            ? "border-red-500 focus:ring-red-300"
            : "border-gray-300 focus:ring-purple-300"}
        `}
      />
    </div>
  )
}
