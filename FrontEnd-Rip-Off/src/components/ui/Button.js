import React from "react";

export const Button = ({ className, children, ...props }) => {
  return (
    <button
      className={`py-2 px-4 rounded-full transition duration-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
