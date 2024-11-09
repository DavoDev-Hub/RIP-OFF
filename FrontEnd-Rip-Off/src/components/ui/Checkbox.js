import React from "react";

export const Checkbox = ({ className, ...props }) => {
  return (
    <input type="checkbox" className={`form-checkbox ${className}`} {...props} />
  );
};
