import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-dark hover:bg-brand-hover focus:ring-brand/40 shadow-brand',
  secondary: 'bg-white text-text-primary border border-border hover:bg-surface-secondary focus:ring-dark/20',
  ghost: 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary focus:ring-dark/10',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
  lg: 'h-10 px-4 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  ),
);
Button.displayName = 'Button';
