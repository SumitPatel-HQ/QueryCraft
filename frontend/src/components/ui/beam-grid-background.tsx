"use client";

import React, { useEffect, useRef, useState } from "react";

export interface BeamGridBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  gridSize?: number;
  gridColor?: string;
  darkGridColor?: string;
  beamColor?: string;
  darkBeamColor?: string;
  beamSpeed?: number;
  beamThickness?: number;
  beamGlow?: boolean;
  glowIntensity?: number;
  beamCount?: number;
  extraBeamCount?: number;
  idleSpeed?: number;
  interactive?: boolean;
  asBackground?: boolean;
  className?: string;
  children?: React.ReactNode;
  showFade?: boolean;
  fadeIntensity?: number;
}

const BeamGridBackground: React.FC<BeamGridBackgroundProps> = ({
  gridSize = 40,
  gridColor = "#212121",
  darkGridColor = "#212121",
  beamColor = "rgba(0, 180, 255, 0.8)",
  darkBeamColor = "rgba(0, 255, 255, 0.8)",
  beamSpeed = 0.1,
  beamThickness = 3,
  beamGlow = true,
  glowIntensity = 50,
  beamCount = 8,
  extraBeamCount = 3,
  idleSpeed = 1.15,
  interactive = true,
  asBackground = true,
  showFade = true,
  fadeIntensity = 20,
  className,
  children,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMouseMoveRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // --- Dark Mode Detection ---
  useEffect(() => {
    lastMouseMoveRef.current = Date.now();
    const updateDarkMode = () => {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(
        document.documentElement.classList.contains("dark") || prefersDark,
      );
    };
    updateDarkMode();
    const observer = new MutationObserver(() => updateDarkMode());
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // --- Drawing Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true })!;
    
    // Handle Window Resize
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);

    const rect = container.getBoundingClientRect();
    const cols = Math.floor(rect.width / gridSize);
    const rows = Math.floor(rect.height / gridSize);

    // Initialize beams
    const primaryBeams = Array.from({ length: beamCount }).map(() => ({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      dir: Math.random() > 0.5 ? "x" : ("y" as "x" | "y"),
      offset: Math.random() * gridSize * 10,
      speed: beamSpeed + Math.random() * 0.3,
      type: "primary",
    }));

    const extraBeams = Array.from({ length: extraBeamCount }).map(() => ({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      dir: Math.random() > 0.5 ? "x" : ("y" as "x" | "y"),
      offset: Math.random() * gridSize * 10,
      speed: beamSpeed * 0.5 + Math.random() * 0.1,
      type: "extra",
    }));

    const allBeams = [...primaryBeams, ...extraBeams];

    const updateMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      lastMouseMoveRef.current = Date.now();
    };

    if (interactive) window.addEventListener("mousemove", updateMouse);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const lineColor = isDarkMode ? darkGridColor : gridColor;
      const activeBeamColor = isDarkMode ? darkBeamColor : beamColor;

      // Draw grid
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      
      ctx.beginPath();
      for (let x = 0; x <= w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      const now = Date.now();
      const idle = now - lastMouseMoveRef.current > 2000;

      // Draw Beams
      if (beamGlow) {
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = activeBeamColor;
      }

      allBeams.forEach((beam) => {
        ctx.strokeStyle = activeBeamColor;
        ctx.lineWidth = beam.type === "extra" ? beamThickness * 0.75 : beamThickness;
        ctx.beginPath();

        if (beam.dir === "x") {
          const y = beam.y * gridSize;
          const beamLength = gridSize * 1.5;
          const start = -beamLength + (beam.offset % (w + beamLength));
          ctx.moveTo(start, y);
          ctx.lineTo(start + beamLength, y);
          beam.offset += idle ? beam.speed * idleSpeed * 60 : beam.speed * 60;
        } else {
          const x = beam.x * gridSize;
          const beamLength = gridSize * 1.5;
          const start = -beamLength + (beam.offset % (h + beamLength));
          ctx.moveTo(x, start);
          ctx.lineTo(x, start + beamLength);
          beam.offset += idle ? beam.speed * idleSpeed * 60 : beam.speed * 60;
        }
        ctx.stroke();
      });

      // Interactive highlight
      if (interactive && !idle) {
        ctx.shadowBlur = 0;
        const targetX = mouseRef.current.x;
        const targetY = mouseRef.current.y;
        const colorMatch = activeBeamColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        const r = colorMatch ? colorMatch[1] : "217";
        const g = colorMatch ? colorMatch[2] : "70";
        const b = colorMatch ? colorMatch[3] : "239";

        const maxRadius = gridSize * 2.5;
        const gradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, maxRadius);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(targetX, targetY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (interactive) window.removeEventListener("mousemove", updateMouse);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    gridSize, beamColor, darkBeamColor, gridColor, darkGridColor,
    beamSpeed, beamCount, extraBeamCount, beamThickness,
    glowIntensity, beamGlow, isDarkMode, idleSpeed, interactive
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className || ""}`}
      {...props}
      style={{
        position: asBackground ? "absolute" : "relative",
        top: 0, left: 0, width: "100%", height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        ...(props.style || {}),
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-50"
      />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" 
           style={{ background: `radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.9) 100%)` }} 
      />
      {showFade && (
        <div className="absolute inset-0 bg-white dark:bg-black pointer-events-none"
             style={{
               maskImage: `radial-gradient(ellipse at center, transparent ${fadeIntensity}%, black)`,
               WebkitMaskImage: `radial-gradient(ellipse at center, transparent ${fadeIntensity}%, black)`,
             }}
        />
      )}
      {!asBackground && <div className="relative z-0 w-full h-full pointer-events-auto">{children}</div>}
    </div>
  );
};

export default BeamGridBackground;
