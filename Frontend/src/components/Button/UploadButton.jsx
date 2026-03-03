export default function UploadButton({
  label = "Upload",
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        px-12 py-4 rounded-full font-medium
        transition-all duration-200
        ${disabled
          ? "bg-[#E5E7EB]! text-gray-600 cursor-not-allowed"
          : "bg-[#7C3AED]! text-white hover:bg-[#6D28D9]"}
      `}
    >
      {label}
    </button>
  );
}
