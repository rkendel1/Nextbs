import DashboardLayout from "@/components/DashboardLayout";
import type { ReactNode } from "react";

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}