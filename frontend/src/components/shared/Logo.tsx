import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  sm: {
    logoClasses: 'w-5 h-5 md:w-6 md:h-6',
    text: 'text-base md:text-lg',
    gap: 'gap-1.5 md:gap-2',
  },
  md: {
    logoClasses: 'w-6 h-6 md:w-8 md:h-8',
    text: 'text-lg md:text-xl',
    gap: 'gap-2 md:gap-2.5',
  },
  lg: {
    logoClasses: 'w-8 h-8 md:w-10 md:h-10',
    text: 'text-xl md:text-2xl',
    gap: 'gap-2 md:gap-3',
  },
  xl: {
    logoClasses: 'w-10 h-10 md:w-12 md:h-12',
    text: 'text-2xl md:text-3xl',
    gap: 'gap-2.5 md:gap-3',
  },
};

export function Logo({ size = 'md', showText = true, className, textClassName }: LogoProps) {
  const { logoClasses, text: textSize, gap: gapSize } = sizeMap[size];

  return (
    <span className={cn('flex items-center', showText && gapSize, className)}>
      <span className={cn('relative inline-block transition-all duration-200', logoClasses)}>
        <Image
          src="/images/BnB-Logo.png"
          alt="Beauty N Brushes"
          fill
          sizes="(max-width: 768px) 24px, 40px"
          className="object-contain"
          priority
        />
      </span>
      {showText && (
        <span
          className={cn(
            'font-bold text-primary whitespace-nowrap transition-all duration-200',
            textSize,
            textClassName
          )}
        >
          Beauty N Brushes
        </span>
      )}
    </span>
  );
}
