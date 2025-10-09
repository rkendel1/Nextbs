"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import "../styles/index.css";
import "../styles/prism-vsc-dark-plus.css";
import Providers from "./providers";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const isWhitelabelPath = pathname && pathname.split('/').length > 1 && /^[a-z][a-z0-9-]*$/.test(pathname.split('/')[1]);
  
  return (
    <html suppressHydrationWarning className="!scroll-smooth" lang="en">
      <body>
        <Providers>
          <div className="isolate">
            {!isDashboardPage && !isWhitelabelPath && <Header />}
            {children}
            {!isWhitelabelPath && <Footer />}
            <ScrollToTop />
          </div>
        </Providers>
      </body>
    </html>
  );
}