export default function CancelButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        px-12 py-4 rounded-full font-medium
        border border-gray-300
        hover:bg-gray-100 transition
      "
    >
      Cancel
    </button>
  );
}
