
import React from "react";
import { useNavigate } from "react-router-dom";

export default function ToSignup() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate("/Register");
  };

  return (
    <button
      type="submit"
      onClick={handleSubmit}
      className="
        flex items-center gap-2
        text-lg font-medium text-white
        bg-transparent
        hover:text-violet-200
        focus:outline-none! focus:ring-0!
        shadow-none!
      "
    >
      <svg
        className="w-6 h-6"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 8 14"
      >
        <path
          d="M7 1 1.3 6.326a.91.91 0 0 0 0 1.348L7 13"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>

      Sign Up
    </button>
  );
}
