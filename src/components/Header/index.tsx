"use client";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, User, LogOut, Settings, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathUrl = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (session?.user) {
      router.push("/dashboard");
    } else {
      setAuthMode("signup");
      setShowAuthModal(true);
    }
  };

  const handleAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const NavItems = () => (
    <>
      <Link href="/#features" className="text-sm font-medium transition-colors hover:text-primary">
        Features
      </Link>
      <Link href="/#pricing" className="text-sm font-medium transition-colors hover:text-primary">
        Pricing
      </Link>
      <Link href="/#about" className="text-sm font-medium transition-colors hover:text-primary">
        About
      </Link>
      <Link href="/docs" className="text-sm font-medium transition-colors hover:text-primary">
        Docs
      </Link>
    </>
  );

  const UserMenu = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <User className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3 border-b pb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{session?.user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          
          <Link href="/dashboard" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/settings" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          
          <Button
            variant="ghost"
            className="justify-start p-2 h-auto"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-sm border-b"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative h-8 w-32">
                <Image
                  src="/images/logo/logo.svg"
                  alt="logo"
                  width={120}
                  height={30}
                  className="dark:hidden"
                />
                <Image
                  src="/images/logo/logo-white.svg"
                  alt="logo"
                  width={120}
                  height={30}
                  className="hidden dark:block"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {!session?.user && <NavItems />}
            </nav>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* Auth/User Menu */}
              {session?.user ? (
                <UserMenu />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => handleAuth("signin")}
                    className="hidden md:inline-flex"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleGetStarted}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Get Started Free
                  </Button>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-4 mt-8">
                    {!session?.user && (
                      <>
                        <NavItems />
                        <div className="border-t pt-4 space-y-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleAuth("signin")}
                            className="w-full justify-start"
                          >
                            Sign In
                          </Button>
                          <Button onClick={handleGetStarted} className="w-full">
                            Get Started Free
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Panel - Slides in from right side */}
      {showAuthModal && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowAuthModal(false)}
          />
          
          {/* Sliding panel from right */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl transform transition-transform duration-500 ease-out animate-slide-in-right">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {authMode === "signin" ? "Welcome Back" : "Create Account"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAuthModal(false)}
                  className="auth-button-hover"
                >
                  ×
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-muted-foreground mb-6">
                  {authMode === "signin"
                    ? "Sign in to your account to continue"
                    : "Create your account to get started"}
                </p>
                
                {/* Social Sign In */}
                <div className="space-y-3 mb-6">
                  <Button className="w-full" variant="outline" onClick={() => window.location.href = '/api/auth/signin/google'}>
                    Continue with Google
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => window.location.href = '/api/auth/signin/github'}>
                    Continue with GitHub
                  </Button>
                </div>
                
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                {/* Email/Password Form */}
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  // Basic form submission - redirect to actual auth pages
                  window.location.href = authMode === 'signin' ? '/auth/signin' : '/auth/signup';
                }}>
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm auth-input-focus"
                      required
                    />
                  </div>
                  {authMode === 'signup' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm auth-input-focus"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm auth-input-focus"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full auth-button-hover">
                    {authMode === "signin" ? "Sign In" : "Sign Up"}
                  </Button>
                </form>
                
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                    className="text-primary hover:underline font-medium"
                  >
                    {authMode === "signin" ? "Sign Up" : "Sign In"}
                  </button>
                </p>
                
                {/* Additional links */}
                <div className="mt-4 text-center">
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;