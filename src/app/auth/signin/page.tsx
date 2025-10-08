"use client";

import SignIn from "@/components/Auth/SignIn";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      toast.error(error === "OAuthCallback" 
        ? "Error signing in with Google. Please try again." 
        : error);
    }
  }, [error]);

  return <SignIn />;
}