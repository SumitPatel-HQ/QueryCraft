"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface ScrollCarouselProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // Duration in seconds for one complete loop
  pauseOnHover?: boolean;
}

export function ScrollCarousel({
  children,
  className,
  speed = 30,
  pauseOnHover = true,
}: ScrollCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!containerRef.current || !carouselRef.current) return;

    const carousel = carouselRef.current;
    const firstChild = carousel.firstElementChild as HTMLElement;

    if (!firstChild) return;

    // Clone children for seamless loop
    const children = Array.from(carousel.children);
    children.forEach((child) => {
      const clone = child.cloneNode(true) as HTMLElement;
      carousel.appendChild(clone);
    });

    // Calculate the width of one set of items
    const itemsWidth =
      firstChild.offsetWidth * children.length + 24 * children.length; // 24px is gap-6

    // Create infinite scroll animation
    animationRef.current = gsap.to(carousel, {
      x: -itemsWidth,
      duration: speed,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => parseFloat(x) % itemsWidth),
      },
    });

    // Pause on hover
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;

      const handleMouseEnter = () => {
        animationRef.current?.pause();
      };

      const handleMouseLeave = () => {
        animationRef.current?.resume();
      };

      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
        animationRef.current?.kill();
      };
    }

    return () => {
      animationRef.current?.kill();
    };
  }, [speed, pauseOnHover]);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden relative", className)}
    >
      <div
        ref={carouselRef}
        className="flex gap-4 sm:gap-5 md:gap-6 will-change-transform"
        style={{ width: "fit-content" }}
      >
        {children}
      </div>

      {/* Gradient fade on edges - responsive */}
      <div className="absolute inset-y-0 left-0 w-12 sm:w-16 md:w-20 bg-gradient-to-r from-[#0D0D0D] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-12 sm:w-16 md:w-20 bg-gradient-to-l from-[#0D0D0D] to-transparent pointer-events-none z-10" />
    </div>
  );
}

interface ScrollCarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollCarouselItem({
  children,
  className,
}: ScrollCarouselItemProps) {
  return (
    <div
      className={cn(
        "carousel-card relative min-w-[280px] sm:min-w-[320px] md:min-w-sm lg:min-w-sm",
        // Liquid glass effect
        "backdrop-blur-xs bg-white/5",
        "border border-white/10 rounded-2xl sm:rounded-3xl",
        // Minimal hover effect
        "hover:bg-white/8 hover:border-white/20",
        "transition-all duration-300",
        className,
      )}
    >
      {children}
    </div>
  );
}
