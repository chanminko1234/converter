import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const Alert = ({ 
  className = '', 
  variant = 'default',
  children,
  ...props 
}: AlertProps) => {
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

export const AlertDescription = ({ 
  className = '', 
  children,
  ...props 
}: AlertDescriptionProps) => {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
};