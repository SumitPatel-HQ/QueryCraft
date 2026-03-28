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
  asBackground = true, // Key: Defaults to true for background use
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

    const ctx = canvas.getContext("2d")!;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const cols = Math.floor(rect.width / gridSize);
    const rows = Math.floor(rect.height / gridSize);

    // Initialize primary straight-line beams
    const primaryBeams = Array.from({ length: beamCount }).map(() => ({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      dir: Math.random() > 0.5 ? "x" : ("y" as "x" | "y"),
      offset: Math.random() * gridSize,
      speed: beamSpeed + Math.random() * 0.3,
      type: "primary", // Identifier
    }));

    // Initialize extra beams
    const extraBeams = Array.from({ length: extraBeamCount }).map(() => ({
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
      dir: Math.random() > 0.5 ? "x" : ("y" as "x" | "y"),
      offset: Math.random() * gridSize,
      speed: beamSpeed * 0.5 + Math.random() * 0.1,
      type: "extra", // Identifier
    }));

    // Combine all beams
    const allBeams = [...primaryBeams, ...extraBeams];

    const updateMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      lastMouseMoveRef.current = Date.now();
    };

    if (interactive) window.addEventListener("mousemove", updateMouse);

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      const lineColor = isDarkMode ? darkGridColor : gridColor;
      const activeBeamColor = isDarkMode ? darkBeamColor : beamColor;

      // Draw grid
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      for (let x = 0; x <= rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = 0; y <= rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      const now = Date.now();
      const idle = now - lastMouseMoveRef.current > 2000;

      // Beam effect intensity and movement
      allBeams.forEach((beam) => {
        ctx.strokeStyle = activeBeamColor;
        ctx.lineWidth =
          beam.type === "extra" ? beamThickness * 0.75 : beamThickness;

        if (beamGlow) {
          ctx.shadowBlur = glowIntensity;
          ctx.shadowColor = activeBeamColor;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        if (beam.dir === "x") {
          const y = beam.y * gridSize;
          const beamLength = gridSize * 1.5;
          const start = -beamLength + (beam.offset % (rect.width + beamLength));

          ctx.moveTo(start, y);
          ctx.lineTo(start + beamLength, y);
          ctx.stroke();

          beam.offset += idle ? beam.speed * idleSpeed * 60 : beam.speed * 60;
          if (beam.offset > rect.width + beamLength) beam.offset = -beamLength;
        } else {
          const x = beam.x * gridSize;
          const beamLength = gridSize * 1.5;
          const start =
            -beamLength + (beam.offset % (rect.height + beamLength));

          ctx.moveTo(x, start);
          ctx.lineTo(x, start + beamLength);
          ctx.stroke();

          beam.offset += idle ? beam.speed * idleSpeed * 60 : beam.speed * 60;
          if (beam.offset > rect.height + beamLength) beam.offset = -beamLength;
        }
      });

      // Reset shadow before drawing the interactive highlight
      ctx.shadowBlur = 0;

      // --- Multi-level Interactive highlight near mouse (Circular smooth feather) ---
      if (interactive && !idle) {
        const targetX = mouseRef.current.x;
        const targetY = mouseRef.current.y;

        // Parse the active beam color to get RGB values
        const colorMatch = activeBeamColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)/,
        );
        const r = colorMatch ? colorMatch[1] : "217";
        const g = colorMatch ? colorMatch[2] : "70";
        const b = colorMatch ? colorMatch[3] : "239";

        // Turn off glow completely
        ctx.shadowBlur = 0;

        // Draw smooth circular gradient
        const maxRadius = gridSize * 2.5;
        const gradient = ctx.createRadialGradient(
          targetX,
          targetY,
          0,
          targetX,
          targetY,
          maxRadius,
        );

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.15)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(targetX, targetY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    // Initial setup for beams to avoid a blank frame
    // This is where you would call draw once or set up a listener for resize if needed

    draw();

    return () => {
      if (interactive) window.removeEventListener("mousemove", updateMouse);
    };
  }, [
    gridSize,
    beamColor,
    darkBeamColor,
    gridColor,
    darkGridColor,
    beamSpeed,
    beamCount,
    extraBeamCount,
    beamThickness,
    glowIntensity,
    beamGlow,
    isDarkMode,
    idleSpeed,
    interactive,
  ]);

  // --- Component JSX ---
  return (
    <div
      ref={containerRef}
      className={`relative ${className || ""}`}
      {...props}
      style={{
        // This ensures it becomes an absolute, full-covering background
        position: asBackground ? "absolute" : "relative",
        top: asBackground ? 0 : undefined,
        left: asBackground ? 0 : undefined,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...(props.style || {}),
      }}
    >
      <canvas
        ref={canvasRef}
        // pointer-events-none is CRUCIAL for letting mouse events pass to the content above.
        className={`absolute top-0 left-0 w-full h-full z-0 pointer-events-none`}
      />

      {/* Black vignette effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.9) 100%)`,
        }}
      />

      {showFade && (
        <div
          className="pointer-events-none absolute inset-0 bg-white dark:bg-black"
          style={{
            maskImage: `radial-gradient(ellipse at center, transparent ${fadeIntensity}%, black)`,
            WebkitMaskImage: `radial-gradient(ellipse at center, transparent ${fadeIntensity}%, black)`,
          }}
        />
      )}

      {/* Content children are only rendered if asBackground is explicitly false */}
      {!asBackground && (
        <div className="relative z-0 w-full h-full">{children}</div>
      )}
    </div>
  );
};

export default BeamGridBackground;
