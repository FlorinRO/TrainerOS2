import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'border border-cyan-300/40 bg-[linear-gradient(135deg,rgba(140,248,212,0.98),rgba(114,202,255,0.92))] text-slate-950 shadow-[0_12px_32px_rgba(114,202,255,0.22)] hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_46px_rgba(114,202,255,0.28)] font-semibold',
    secondary:
      'border border-white/10 bg-white/[0.045] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.08]',
    outline:
      'border border-cyan-300/30 bg-cyan-300/[0.04] text-cyan-100 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-300/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
