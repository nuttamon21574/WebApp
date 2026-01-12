
import React from "react";
import { useNavigate } from "react-router-dom";

export default function ToLogin() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    // Handle form submission logic here
    // On successful submission, navigate to the desired route
    navigate("/");
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
    > Sign In
      <svg class="w-6 h-6 text-white-800 dark:text-dark" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 13 5.7-5.326a.909.909 0 0 0 0-1.348L1 1"/>
</svg>

    </button>
  );
}
