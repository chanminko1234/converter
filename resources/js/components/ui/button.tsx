import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const baseClass = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClass = variant === 'outline' 
    ? 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
    : variant === 'ghost'
    ? 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground'
    : 'bg-primary text-primary-foreground hover:bg-primary/90';
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}