import React from "react";

export default function AddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-10 h-10
        flex items-center justify-center
        rounded-full
        !bg-white text-black
        text-2xl font-bold
        shadow-lg
        hover:bg-green-100
        active:bg-purple-500 active:text-white
        transition-colors
        focus:outline-none
      "
    >
      +
    </button>
  );
}