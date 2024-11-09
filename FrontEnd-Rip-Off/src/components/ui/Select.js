import React, { useState } from "react";

export const Select = ({ children }) => {
  return (
    <div className="relative">
      {children}
    </div>
  );
};

export const SelectTrigger = ({ children, className }) => {
  return (
    <div className={`cursor-pointer py-2 px-4 bg-gray-800 rounded text-white ${className}`}>
      {children}
    </div>
  );
};

export const SelectValue = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};

export const SelectContent = ({ children }) => {
  return (
    <ul className="absolute bg-gray-800 rounded mt-1 w-full z-10">
      {children}
    </ul>
  );
};

export const SelectItem = ({ value, children }) => {
  return (
    <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer" data-value={value}>
      {children}
    </li>
  );
};
