'use client';

import { FileCheckIcon, InfoIcon, Loader2Icon, OctagonIcon, TriangleIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: 'group-[.toast]:border-primary group-[.toast]:text-primary',
          error: 'group-[.toast]:border-destructive group-[.toast]:text-destructive',
          warning: 'group-[.toast]:border-accent group-[.toast]:text-accent-foreground',
          info: 'group-[.toast]:border-secondary group-[.toast]:text-secondary-foreground',
        },
      }}
      icons={{
        success: <FileCheckIcon className="size-4 text-primary" />,
        info: <InfoIcon className="size-4 text-secondary" />,
        warning: <TriangleIcon className="size-4 text-accent" />,
        error: <OctagonIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin text-primary" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
