export default function BNPLDetailRow({ label }) {
  return (
    <div className="grid grid-cols-2 items-center gap-4">
      {/* Label */}
      <p className="text-gray-600">
        {label}
      </p>

      {/* Value (placeholder UI) */}
      <div className="bg-gray-100 rounded-full px-4 py-2 text-center text-gray-800">
        —
      </div>
    </div>
  );
}
