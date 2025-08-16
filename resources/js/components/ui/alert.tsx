import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Alert: React.FC<AlertProps> = ({ 
  className = '', 
  variant = 'default',
  children,
  ...props 
}) => {
  const baseClass = 'relative w-full rounded-lg border p-4';
  const variantClass = {
    default: 'bg-background border-border text-foreground',
    destructive: 'bg-destructive/10 border-destructive text-destructive-foreground'
  }[variant];
  
  return (
    <div className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  className = '', 
  children,
  ...props 
}) => {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
};