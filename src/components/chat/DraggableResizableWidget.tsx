import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraggableResizableWidgetProps {
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  onClose?: () => void;
  isFullPage?: boolean;
}

const DraggableResizableWidget: React.FC<DraggableResizableWidgetProps> = ({
  children,
  initialWidth = 380,
  initialHeight = 600,
  minWidth = 300,
  minHeight = 400,
  maxWidth = 800,
  maxHeight = 800,
  className,
  onClose,
  isFullPage = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const [isMaximized, setIsMaximized] = useState(isFullPage);
  const [previousState, setPreviousState] = useState({
    position: { x: 20, y: 20 },
    dimensions: { width: initialWidth, height: initialHeight },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (isMaximized) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [isMaximized]);

  // Set to full page mode if specified
  useEffect(() => {
    if (isFullPage) {
      setIsMaximized(true);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setPosition({ x: 0, y: 0 });
    }
  }, [isFullPage]);

  const handleDragStart = () => {
    if (!isMaximized) {
      setIsDragging(true);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMaximized) {
      setIsResizing(true);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  const handleResize = (e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, e.clientX - rect.left),
      );
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, e.clientY - rect.top),
      );

      setDimensions({
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isMaximized) {
      // Save current state before maximizing
      setPreviousState({
        position,
        dimensions,
      });

      // Maximize
      setIsMaximized(true);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setPosition({ x: 0, y: 0 });
    } else {
      // Restore previous state
      setIsMaximized(false);
      setPosition(previousState.position);
      setDimensions(previousState.dimensions);
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizing]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "fixed bg-background border rounded-lg shadow-lg overflow-hidden",
        isMaximized ? "inset-0 z-50" : "z-40",
        isDragging && "cursor-grabbing",
        className,
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        x: position.x,
        y: position.y,
        ...(isMaximized ? { top: 0, left: 0, right: 0, bottom: 0 } : {}),
      }}
      drag={!isMaximized}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      dragConstraints={{
        left: 0,
        top: 0,
        right: window.innerWidth - dimensions.width,
        bottom: window.innerHeight - dimensions.height,
      }}
    >
      {/* Header with controls */}
      <div
        className="p-2 flex justify-between items-center bg-primary/5 cursor-move"
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
      >
        <div className="flex space-x-1">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggleMaximize}
        >
          {isMaximized ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-2.5rem)] overflow-hidden">{children}</div>

      {/* Resize handle */}
      {!isMaximized && (
        <div
          ref={resizeHandleRef}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleResizeStart}
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.2) 2px, transparent 2px)",
            backgroundSize: "4px 4px",
            backgroundPosition: "0 0",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </motion.div>
  );
};

export default DraggableResizableWidget;
