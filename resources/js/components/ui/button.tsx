import React from 'react';

export function Button(props: any) {
  const { children, className = '', variant = 'default', ...rest } = props;
  
  const baseClass = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClass = variant === 'outline' 
    ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
    : 'bg-blue-600 text-white hover:bg-blue-700';
  
  return React.createElement('button', {
    className: `${baseClass} ${variantClass} ${className}`,
    ...rest
  }, children);
}