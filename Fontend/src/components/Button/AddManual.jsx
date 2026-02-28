import React from "react";

export default function AddManual({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: '#6B21A8', color: 'white' }}
      className="px-6 py-3 rounded-xl hover:bg-[#5B1D91] transition-colors"
    >
      Add
    </button>
  );
}