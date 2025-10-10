"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronRight } from "lucide-react";
import MagicLink from "../MagicLink";
import Loader from "@/components/Common/Loader";
import { Logo } from "@/components/Logo";

const Signin = () => {
  const router = useRouter();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<"password" | "magic">("password");
  const [isSliding, setIsSliding] = useState(false);

  // Trigger slide animation on component mount
  useEffect(() => {
    setIsSliding(true);
  }, []);

  const loginUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        ...loginData,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      if (result?.ok && !result?.error) {
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
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
      setIsSignUp(false);
      setAuthMethod("password");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSliding(false);
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setAuthMethod("password");
      setIsSliding(true);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background overlay with slide effect */}
      <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${isSliding ? 'opacity-100' : 'opacity-0'}`} />
      
      {/* Main authentication panel - slides in from right */}
      <div className={`w-full max-w-md ${isSliding ? 'animate-slide-in-right' : 'animate-slide-out-right'}`}>
        <Card className="border-0 auth-card-shadow bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mb-4 flex justify-center">
              <Link href="/" className="inline-block">
                <Logo className="scale-90" />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-base">
              {isSignUp 
                ? "Join thousands of creators building successful SaaS businesses" 
                : "Sign in to your account to continue"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Auth Method Toggle - only for login */}
            {!isSignUp && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant={authMethod === "password" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("password")}
                  className="flex-1 auth-button-hover"
                >
                  Password
                </Button>
                <Button
                  variant={authMethod === "magic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("magic")}
                  className="flex-1 auth-button-hover"
                >
                  Magic Link
                </Button>
              </div>
            )}

            {/* Login Form */}
            {!isSignUp && authMethod === "password" && (
              <form onSubmit={loginUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 auth-input-focus"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
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
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 auth-input-focus"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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

                <div className="flex items-center justify-between">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 auth-button-hover"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Magic Link Form */}
            {!isSignUp && authMethod === "magic" && (
              <MagicLink />
            )}

            {/* Sign Up Form */}
            {isSignUp && (
              <form onSubmit={handleSignUp} className="space-y-4">
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
            )}

            {/* Toggle between Sign In and Sign Up */}
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={toggleAuthMode}
                  className="text-primary hover:underline font-medium inline-flex items-center auth-button-hover"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </p>
              
              {!isSignUp && (
                <p className="text-xs text-muted-foreground">
                  By signing in you agree to our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                </p>
              )}
              
              {isSignUp && (
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signin;