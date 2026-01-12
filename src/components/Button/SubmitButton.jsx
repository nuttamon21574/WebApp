import React from "react";
export default function SubmitButton({ disabled }) {
  
  return (
    <button
      type="submit"
      disabled={disabled}
      className="
        px-6 py-2 w-full mt-4
        bg-purple-400! text-black
        rounded-xl
        hover:bg-gray-300
        transition duration-300
        hover:shadow-lg
        focus:outline-none focus:ring-0
      "
    >
      Submit
    </button>
  );
}
