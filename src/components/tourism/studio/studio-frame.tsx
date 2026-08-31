import React, { useRef, useState, useEffect } from "react";
import type { ProposalCanvasFormat } from "@/services/travel-proposal.functions";

export const CANVAS_DIMENSIONS: Record<ProposalCanvasFormat, { width: string; minHeight: string; label: string; iconEmoji: string }> = {
  "a4-portrait": { width: "794px", minHeight: "1123px", label: "A4 Retrato (PDF)", iconEmoji: "📄" },
  "a4-landscape": { width: "1123px", minHeight: "794px", label: "A4 Paisagem (Lâmina)", iconEmoji: "📑" },
  "story-916": { width: "1080px", minHeight: "1920px", label: "Story 9:16 (WhatsApp/Insta)", iconEmoji: "📱" },
  "presentation-169": { width: "1920px", minHeight: "1080px", label: "Apresentação 16:9 (Slide)", iconEmoji: "🖥️" },
  "letter-portrait": { width: "816px", minHeight: "1056px", label: "Carta (US Letter)", iconEmoji: "✉️" },
};

interface StudioFrameProps {
  format: ProposalCanvasFormat;
  children: React.ReactNode;
  canvasId?: string;
}

export function StudioFrame({ format, children, canvasId = "proposal-canvas" }: StudioFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState(1123);
  const dims = CANVAS_DIMENSIONS[format] || CANVAS_DIMENSIONS["a4-portrait"];

  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      if (!containerRef.current) return;
      const padX = 48;
      const availW = containerRef.current.clientWidth - padX;
      const targetW = parseInt(dims.width, 10) || 794;
      const calculatedScale = Math.min(1, availW / targetW);
      setScale(calculatedScale);
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    handleResize();
    return () => observer.disconnect();
  }, [dims.width]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const handleHeight = () => {
      if (!canvasRef.current) return;
      const layoutHeight = canvasRef.current.scrollHeight || canvasRef.current.offsetHeight || 1123;
      setCanvasHeight(layoutHeight);
    };

    const observer = new ResizeObserver(handleHeight);
    observer.observe(canvasRef.current);
    handleHeight();
    return () => observer.disconnect();
  }, [scale, format]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-muted/40 flex flex-col items-center justify-start relative p-4 sm:p-8 rounded-2xl border border-border/40 min-h-[500px]"
    >
      <div
        style={{
          width: `calc(${dims.width} * ${scale})`,
          height: canvasHeight * scale,
          position: "relative",
          transition: "width 0.15s ease-out, height 0.15s ease-out",
        }}
      >
        <div
          id={canvasId}
          ref={canvasRef}
          style={{
            width: dims.width,
            minHeight: dims.minHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: "#ffffff",
          }}
          className="shadow-2xl rounded-2xl overflow-hidden text-foreground"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
