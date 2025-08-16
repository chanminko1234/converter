import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge = ({ className = '', variant = 'default', children, ...props }: BadgeProps) => {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClass = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    outline: 'border border-input bg-background text-foreground'
  }[variant];
  
  return (
    <span className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};