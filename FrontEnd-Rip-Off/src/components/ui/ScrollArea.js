import React from "react";

export const ScrollArea = ({ className, children }) => {
  return (
    <div className={`overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};
