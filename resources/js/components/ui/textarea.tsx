import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = ({ className = '', ...props }: TextareaProps) => {
  return (
    <textarea 
      className={`w-full p-3 border border-input bg-background text-foreground rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
      {...props}
    />
  );
};