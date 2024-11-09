import React from "react";

export const Input = ({ className, ...props }) => {
  return (
    <input
      className={`px-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ED1C24] ${className}`}
      {...props}
    />
  );
};
