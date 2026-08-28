import React, { useRef, useEffect } from "react";
import {
  type StudioElement,
  type SlideBackground,
  type StudioAspectRatio,
  type TextProperties,
  type ShapeProperties,
  type ImageProperties,
  STUDIO_DIMENSIONS,
} from "@/types/studio";

interface StudioCanvasProps {
  aspectRatio: StudioAspectRatio;
  background: SlideBackground;
  elements: StudioElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementPosition: (id: string, pos: { x: number; y: number }) => void;
  zoom?: number;
}

export function StudioCanvas({
  aspectRatio,
  background,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElementPosition,
  zoom = 1,
}: StudioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = STUDIO_DIMENSIONS[aspectRatio] || STUDIO_DIMENSIONS["1:1"];

  const getBackgroundStyle = (): React.CSSProperties => {
    if (background.type === "color") {
      return { backgroundColor: background.value || "#0F172A" };
    }
    if (background.type === "gradient" && background.gradient) {
      const colors = background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(", ");
      return {
        background: `linear-gradient(${background.gradient.angle || 135}deg, ${colors})`,
      };
    }
    if (background.type === "image" && background.imageUrl) {
      return {
        backgroundImage: `url(${background.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return { backgroundColor: "#0F172A" };
  };

  // Sort elements by zIndex and layer
  const sortedElements = [...elements].sort((a, b) => {
    if (a.layer !== b.layer) return a.layer - b.layer;
    return a.zIndex - b.zIndex;
  });

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onSelectElement(null);
        }
      }}
      className="relative flex items-center justify-center p-8 select-none overflow-hidden"
      style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
    >
      <div
        className="relative overflow-hidden rounded-3xl transition-all duration-200 border border-white/10"
        style={{
          width: `${dimensions.width / 2.5}px`,
          height: `${dimensions.height / 2.5}px`,
          ...getBackgroundStyle(),
        }}
      >
        {sortedElements.map((el) => {
          if (!el.visible) return null;
          const isSelected = el.id === selectedElementId;

          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement(el.id);
              }}
              style={{
                position: "absolute",
                left: `${el.position.x}%`,
                top: `${el.position.y}%`,
                width: el.size.width ? `${el.size.width}%` : "auto",
                height: el.size.height ? `${el.size.height}%` : "auto",
                transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                opacity: el.opacity,
                zIndex: el.zIndex,
                cursor: el.locked ? "default" : "move",
              }}
              className={`group transition-all ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent"
                  : "hover:outline-dashed hover:outline-1 hover:outline-primary/50"
              }`}
            >
              {/* Element Rendering based on Type */}
              {el.type === "text" && (
                <div
                  style={{
                    fontFamily: (el.properties as TextProperties).fontFamily || "Inter",
                    fontSize: `${((el.properties as TextProperties).fontSize || 36) / 2.5}px`,
                    fontWeight: (el.properties as TextProperties).fontWeight || 700,
                    color: (el.properties as TextProperties).color || "#FFFFFF",
                    textAlign: (el.properties as TextProperties).textAlign || "center",
                    lineHeight: (el.properties as TextProperties).lineHeight || 1.2,
                    letterSpacing: `${(el.properties as TextProperties).letterSpacing || 0}px`,
                    textTransform: (el.properties as TextProperties).textTransform || "none",
                  }}
                  className="w-full h-full p-2 break-words"
                >
                  {(el.properties as TextProperties).content}
                </div>
              )}

              {el.type === "shape" && (
                <div
                  style={{
                    backgroundColor: (el.properties as ShapeProperties).fill || "#FACC15",
                    borderRadius: `${((el.properties as ShapeProperties).borderRadius || 0) / 2.5}px`,
                    borderWidth: (el.properties as ShapeProperties).strokeWidth
                      ? `${(el.properties as ShapeProperties).strokeWidth}px`
                      : 0,
                    borderColor: (el.properties as ShapeProperties).strokeColor || "transparent",
                  }}
                  className="size-full"
                />
              )}

              {el.type === "image" && (el.properties as ImageProperties).src && (
                <img
                  src={(el.properties as ImageProperties).src}
                  alt={(el.properties as ImageProperties).alt || "Mídia"}
                  style={{
                    borderRadius: `${((el.properties as ImageProperties).borderRadius || 0) / 2.5}px`,
                    objectFit: (el.properties as ImageProperties).objectFit || "cover",
                  }}
                  className="size-full pointer-events-none"
                />
              )}

              {/* Selection Handles */}
              {isSelected && !el.locked && (
                <>
                  <div className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-primary border-2 border-white" />
                  <div className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-primary border-2 border-white" />
                  <div className="absolute -bottom-1.5 -left-1.5 size-3 rounded-full bg-primary border-2 border-white" />
                  <div className="absolute -bottom-1.5 -right-1.5 size-3 rounded-full bg-primary border-2 border-white" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
