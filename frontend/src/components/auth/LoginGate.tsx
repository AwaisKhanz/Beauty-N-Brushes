'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Lock } from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

interface LoginGateProps {
  /** Custom title for the dialog */
  title?: string;
  /** Custom description/message */
  message?: string;
  /** Action the user was trying to perform */
  action?: string;
  /** Children to render - if user is authenticated, shows children; otherwise shows login prompt */
  children: React.ReactNode;
  /** Optional: Custom trigger button (if not using children) */
  triggerButton?: React.ReactNode;
  /** Optional: Callback after successful login */
  onLoginSuccess?: () => void;
}

/**
 * LoginGate Component
 *
 * Wraps actions that require authentication. Shows a beautiful login dialog
 * when unauthenticated users try to perform the action.
 *
 * Usage:
 * ```tsx
 * <LoginGate action="book this service">
 *   <Button onClick={handleBook}>Book Now</Button>
 * </LoginGate>
 * ```
 */
export function LoginGate({
  title = 'Sign In Required',
  message,
  action = 'continue',
  children,
  triggerButton,
  onLoginSuccess,
}: LoginGateProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // If authenticated, render children directly
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Default message if not provided
  const defaultMessage = `Please sign in to ${action}. It only takes a moment to create your free account!`;

  const handleSignIn = () => {
    // Store the current URL to redirect back after login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    router.push(ROUTES.LOGIN);
  };

  const handleSignUp = () => {
    // Store the current URL to redirect back after signup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    router.push(ROUTES.REGISTER);
  };

  // If custom trigger button provided, use it
  const trigger = triggerButton || <div onClick={() => setOpen(true)}>{children}</div>;

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-3">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>

            {/* Title */}
            <DialogTitle className="text-2xl font-heading">{title}</DialogTitle>

            {/* Description */}
            <DialogDescription className="text-base text-muted-foreground">
              {message || defaultMessage}
            </DialogDescription>
          </DialogHeader>

          {/* Actions */}
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={handleSignIn} variant="dark" size="lg" className="">
              <LogIn className="h-5 w-5" />
              Sign In
            </Button>

            <Button onClick={handleSignUp} variant="outline" size="lg" className=" !m-0">
              <UserPlus className="h-5 w-5" />
              Create Free Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * useLoginGate Hook
 *
 * Alternative approach using a hook instead of component wrapper
 *
 * Usage:
 * ```tsx
 * const { requireAuth } = useLoginGate();
 *
 * <Button onClick={() => requireAuth(() => handleBook(), 'book this service')}>
 *   Book Now
 * </Button>
 * ```
 */
export function useLoginGate() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    action: string;
    callback: (() => void) | null;
  }>({
    open: false,
    action: 'continue',
    callback: null,
  });

  const requireAuth = (callback: () => void, action: string = 'continue') => {
    if (isAuthenticated) {
      callback();
    } else {
      setDialogState({ open: true, action, callback });
    }
  };

  const handleSignIn = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    router.push(ROUTES.LOGIN);
  };

  const handleSignUp = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    router.push(ROUTES.REGISTER);
  };

  const LoginDialog = (
    <Dialog
      open={dialogState.open}
      onOpenChange={(open) => setDialogState({ ...dialogState, open })}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-heading">Sign In Required</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Please sign in to {dialogState.action}. Join thousands of beauty enthusiasts!
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleSignIn} variant="dark" size="lg" className=" ">
            <LogIn className="h-5 w-5" />
            Sign In
          </Button>
          <Button onClick={handleSignUp} variant="outline" size="lg" className="">
            <UserPlus className="h-5 w-5" />
            Create Free Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { requireAuth, LoginDialog, isAuthenticated };
}
