"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { 
  BarChart3, 
  Users, 
  Package,
  TrendingUp,
  Wallet,
  Settings,
  Code,
  Home,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Subscribers", href: "/dashboard/subscribers", icon: Users },
    { name: "Revenue", href: "/dashboard/revenue", icon: TrendingUp },
    { name: "Embed Tools", href: "/tools/embed-viewer", icon: Code },
    { name: "Account", href: "/dashboard/account", icon: Wallet },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-xl transition-transform duration-300 ease-in-out lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:z-50 flex flex-col justify-between",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-full">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <Link href="/dashboard">
              <Logo className="h-12 w-12 object-contain" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 mt-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Section Sticky at bottom */}
        <div className="border-t p-3 space-y-2">
          <Link 
            href="/dashboard/account"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">My Subscription</p>
              <p className="text-xs text-muted-foreground">Manage billing</p>
            </div>
          </Link>

          {session && (
            <p className="px-3 text-xs text-muted-foreground capitalize">
              Role: {session.user.role}
            </p>
          )}
          
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <main className="flex-1 p-6 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;