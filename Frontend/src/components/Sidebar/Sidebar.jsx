import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: "Recommendation",
      path: "/Recommendations",
      icon: (
        <svg className="w-5 h-5 me-2" fill="#2B1175" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M9 7V2.221a2 2 0 0 0-.5.365L4.586 6.5a2 2 0 0 0-.365.5H9Zm2 0V2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9h5a2 2 0 0 0 2-2Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },

        {
      name: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg className="w-5 h-5 me-2" fill="#2B1175" viewBox="0 0 24 24">
          <path d="M13.5 2a8.5 8.5 0 0 1 8.5 8.5h-9V3a1 1 0 0 0-1-1Z" />
          <path d="M11 6a1 1 0 0 0-1-1A8.5 8.5 0 1 0 18 14h-7V6Z" />
        </svg>
      ),
    },

    {
      name: "Buy Now Pay Later Debt",
      path: "/bnpl",
      icon: (
        <svg className="w-5 h-5 me-2" fill="#2B1175" viewBox="0 0 18 18">
          <path d="M12 14a3 3 0 0 1 3-3h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a3 3 0 0 1-3-3Z" />
          <path d="M4.586 7A2 2 0 0 0 3 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2h-4a5 5 0 0 1 0-10h4" />
        </svg>
      ),
    },

    {
      name: "My Account",
      path: "/my-account",
      icon: (
        <svg className="w-5 h-5 me-2" fill="#2B1175" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 20a7.966 7.966 0 0 1-5.002-1.756v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.44 9.963-9.932 10h-.136C6.438 21.963 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    
  ];

  const logoutItem = {
    name: "Logout",
    path: "/",
    icon: (
      <svg className="w-5 h-5 me-2" fill="none" viewBox="0 0 24 24">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"
        />
      </svg>
    ),
  };

  return (
    <>
      {/* Hamburger (mobile) */}
      <button
  className="
    fixed
    top-3
    left-2
    z-50
    bg-white
    !text-white
    p-2
    rounded-md
    shadow
    text-sm
    leading-none
    lg:hidden
  "
  onClick={() => setIsOpen(true)}
>
  ☰
</button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-40
          h-full min-h-screen w-64
          bg-[#E9E1FF] rounded-2xl p-2
          flex flex-col justify-between
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* ===== TOP SECTION ===== */}
        <div>
          

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <DotLottieReact
              src="https://lottie.host/8d71106e-ae93-486d-bd8b-be5fe8f8edf5/QSxFcf84bV.lottie"
              loop
              autoplay
              style={{ width: 100, height: 100 }}
            />
          </div>

          {/* Menu */}
          <ul className="flex flex-col gap-3 text-sm md:text-base font-medium">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center w-full px-4 py-3 rounded-lg
                      transition-colors
                      ${
                        isActive
                          ? "bg-white"
                          : "bg-violet-200 hover:bg-violet-300"
                      }`}
                  >
                    {item.icon}
                    <span className="text-[#2B1166]">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ===== BOTTOM SECTION ===== */}
        <div>
          <Link
            to={logoutItem.path}
            className="flex items-center px-4 py-3 rounded-lg
                       text-red-700 bg-white hover:bg-red-200"
          >
            <span className="text-red-800">{logoutItem.icon}</span>
            <span className="font-medium text-red-800">Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
