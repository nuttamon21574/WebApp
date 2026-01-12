import { useState } from "react";

export default function BNPLProviderSelect({ value, onChange }) {
  const options = ["SPayLater", "LazPayLater"];
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-56">
      {/* Selected */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full !bg-[#CDBDFF] text-black px-4 py-2 rounded-xl
                   flex items-center justify-between font-medium"
      >
        {value}
        <span className={`transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute mt-2 w-full bg-[#CDBDFF] rounded-xl overflow-hidden shadow-lg z-10">
          {options.map((opt) => {
            const isActive = value === opt;

            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);  // ✅ ส่งค่าไป parent (BNPL.jsx)
                  setOpen(false);
                }}
                className={`px-4 py-2 text-center cursor-pointer transition
                  ${isActive ? "bg-white font-semibold" : "hover:bg-white"}`}
              >
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
