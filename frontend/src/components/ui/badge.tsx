import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 active:scale-95',
        accent:
          'border-transparent bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95',
        tertiary:
          'border-transparent bg-tertiary text-tertiary-foreground hover:bg-tertiary/90 active:scale-95',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/90',
        outline:
          'border-2 border-primary text-primary bg-transparent hover:bg-primary/10 active:bg-primary/20',
        ghost: 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
