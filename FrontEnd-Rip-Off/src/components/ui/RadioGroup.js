import React from "react";

export const RadioGroup = ({ children }) => {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
};

export const RadioGroupItem = ({ id, value }) => {
  return (
    <input type="radio" id={id} name="gender" value={value} className="form-radio" />
  );
};
