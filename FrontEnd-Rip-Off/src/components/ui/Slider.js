import React from 'react';

export const Slider = ({ className, defaultValue, max, step }) => {
  const handleChange = (event) => {
    console.log(event.target.value);
  };

  return (
    <input
      type="range"
      defaultValue={defaultValue}
      max={max}
      step={step}
      onChange={handleChange}
      className={`w-full ${className}`}
    />
  );
};
