"use client";

import { ReactLenis, useLenis } from "@studio-freight/react-lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<any>(null);

  // Sync GSAP ScrollTrigger with Lenis
  useLenis(({ scroll }) => {
    ScrollTrigger.update();
  });

  // Stop scrolling when a Clerk modal is present
  useEffect(() => {
    const checkModal = () => {
      const isModalOpen = !!document.querySelector('.cl-modalBackdrop');
      if (lenisRef.current?.lenis) {
        if (isModalOpen) {
          lenisRef.current.lenis.stop();
        } else {
          lenisRef.current.lenis.start();
        }
      }
    };

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <ReactLenis 
      ref={lenisRef} 
      root
      options={{ 
        // More standard "high-end" settings
        duration: 1.5,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      }}
    >
      <div className="relative isolate min-h-screen">
        {children}
      </div>
    </ReactLenis>
  );
}
