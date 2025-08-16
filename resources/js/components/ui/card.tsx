import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className = '', children, ...props }: CardProps) => {
  return (
    <div className={`bg-card text-card-foreground border border-border rounded-lg shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }: CardHeaderProps) => {
  return (
    <div className={`p-6 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className = '', children, ...props }: CardTitleProps) => {
  return (
    <h3 className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ className = '', children, ...props }: CardDescriptionProps) => {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ className = '', children, ...props }: CardContentProps) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};