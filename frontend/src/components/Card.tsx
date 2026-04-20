import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'console-panel console-scan rounded-[28px] p-6 sm:p-7 transition-all duration-300',
        hover && 'hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_20px_60px_rgba(0,0,0,0.34),0_0_28px_rgba(114,202,255,0.08)] transition-all duration-300',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
