"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import MagicLink from "../MagicLink";
import Loader from "@/components/Common/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

const SignUp = () => {
  const router = useRouter();
  const [isPassword, setIsPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'password';
    }
    return false;
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  // Trigger slide animation on component mount
  useEffect(() => {
    setIsSliding(true);
  }, []);

  // Update URL when mode changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (isPassword) {
      url.searchParams.set('mode', 'password');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url.toString());
  }, [isPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData(e.currentTarget);
    const value = Object.fromEntries(data.entries());

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      toast.success("Account created successfully!");
      router.push("/signin");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background overlay with slide effect */}
      <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${isSliding ? 'opacity-100' : 'opacity-0'}`} />
      
      {/* Main authentication panel - slides in from right */}
      <div className={`w-full max-w-md ${isSliding ? 'animate-slide-in-right' : 'animate-slide-out-right'}`}>
        <Card className="border-0 auth-card-shadow bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mb-4">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/logo/logo.svg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="dark:hidden"
                />
                <Image
                  src="/images/logo/logo-white.svg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="hidden dark:block"
                />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription className="text-base">
              Join thousands of creators building successful SaaS businesses
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Auth Method Toggle */}
            <div className="flex justify-center space-x-2">
              <Button
                variant={isPassword ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPassword(true)}
                className="flex-1 auth-button-hover"
              >
                Password
              </Button>
              <Button
                variant={!isPassword ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPassword(false)}
                className="flex-1 auth-button-hover"
              >
                Magic Link
              </Button>
            </div>

            {isPassword ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10 auth-input-focus"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 auth-input-focus"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 auth-input-focus"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 auth-button-hover"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <MagicLink />
            )}

            <div className="space-y-2 text-center">
              <p className="text-xs text-muted-foreground">
                By creating an account you agree to our{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/signin" className="text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;