import React from 'react';

export default function Cardclass({ children, className = "" }) {
  return (
    <div
      className={`
        bg-white backdrop-blur-lg
        p-6 sm:p-8
        rounded-2xl shadow-lg
        overflow-y-auto
        ${className}
      `}
    >
      {children}
    </div>
  );
}
