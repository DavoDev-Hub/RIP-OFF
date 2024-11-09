import React from "react";

export const Label = ({ className, children, ...props }) => {
  return (
    <label className={`text-gray-200 ${className}`} {...props}>
      {children}
    </label>
  );
};
