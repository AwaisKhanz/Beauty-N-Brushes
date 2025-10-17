'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NAV_LINKS, ROUTES, getDashboardRoute } from '@/constants';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.HOME);
    setIsOpen(false);
  };

  const dashboardRoute = user?.role ? getDashboardRoute(user.role) : ROUTES.HOME;
  const navLinks = NAV_LINKS.PUBLIC;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center gap-2">
              <Logo size="lg" showText />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href={dashboardRoute} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href={ROUTES.LOGIN}>Sign In</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href={ROUTES.REGISTER}>Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <Logo size="md" showText />
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Button
                      key={link.href}
                      variant="ghost"
                      className="justify-start"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                  <div className="border-t pt-4 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <Button
                          variant="default"
                          className="w-full gap-2"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href={dashboardRoute}>
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="w-full"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href={ROUTES.LOGIN}>Sign In</Link>
                        </Button>
                        <Button
                          variant="default"
                          className="w-full"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href={ROUTES.REGISTER}>Get Started</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
