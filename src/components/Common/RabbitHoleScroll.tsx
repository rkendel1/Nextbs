"use client";

import { useEffect, useRef } from "react";

export default function RabbitHoleScroll() {
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollDirection = useRef<"down" | "up" | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const body = document.body;

          // Determine scroll direction
          if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            // Scrolling down - going into the rabbit hole
            if (scrollDirection.current !== "down") {
              scrollDirection.current = "down";
              body.style.transform = "perspective(1000px) rotateX(1deg) scale(0.99)";
            }
          } else if (currentScrollY < lastScrollY.current) {
            // Scrolling up - coming out of the rabbit hole
            if (scrollDirection.current !== "up") {
              scrollDirection.current = "up";
              body.style.transform = "perspective(1000px) rotateX(0deg) scale(1)";
            }
          }

          // Reset when at the top
          if (currentScrollY < 50) {
            body.style.transform = "perspective(1000px) rotateX(0deg) scale(1)";
            scrollDirection.current = null;
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    // Apply initial styles to body
    const body = document.body;
    body.style.transformStyle = "preserve-3d";
    body.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      // Clean up styles
      body.style.transform = "";
      body.style.transformStyle = "";
      body.style.transition = "";
    };
  }, []);

  return null;
}
