import React from 'react';

export const Avatar = ({ children }) => {
  return (
    <div className="relative w-10 h-10 rounded-full overflow-hidden">
      {children}
    </div>
  );
};

export const AvatarImage = ({ src, alt }) => {
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
};

export const AvatarFallback = ({ children }) => {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-700 text-white">
      {children}
    </div>
  );
};
