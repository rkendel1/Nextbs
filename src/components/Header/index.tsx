"use client";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, User, LogOut, Settings, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathUrl = usePathname();
  const [scrolled, setScrolled] = useState(false);

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
      // Navigate to home page and trigger auth modal there
      router.push("/?auth=signup");
    }
  };

  const handleAuth = (mode: "signin" | "signup") => {
    // Navigate to home page and trigger auth modal there
    router.push(`/?auth=${mode}`);
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
              <Logo className="scale-75" />
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

    </>
  );
};

export default Header;