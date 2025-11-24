import { useCallback } from 'react';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = useCallback((props: ToastProps) => {
    // Simple implementation - for production, use shadcn/ui toast or sonner
    if (props.variant === 'destructive') {
      alert(`Error: ${props.description || props.title}`);
    } else {
      alert(`${props.title}: ${props.description}`);
    }
  }, []);

  return { toast };
}
