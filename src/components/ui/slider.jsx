import * as React from "react"
import { cn } from "../../lib/utils"

const Slider = React.forwardRef(({ 
  value = [0], 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  className, 
  disabled = false,
  ...props 
}, ref) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef(null);

  const handleRef = React.useCallback((node) => {
    sliderRef.current = node;
    if (!ref) return;
    if (typeof ref === "function") {
      ref(node);
    } else {
      ref.current = node;
    }
  }, [ref]);

  const currentValue = value[0] || 0;

  const updateValue = React.useCallback((clientX) => {
    if (!sliderRef.current || disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    if (onValueChange && clampedValue !== currentValue) {
      onValueChange([clampedValue]);
    }
  }, [min, max, step, currentValue, onValueChange, disabled]);

  const handleMouseDown = React.useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientX);
  }, [updateValue, disabled]);

  const handleMouseMove = React.useCallback((e) => {
    if (isDragging && !disabled) {
      updateValue(e.clientX);
    }
  }, [isDragging, updateValue, disabled]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const percentage = Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100));

  return (
    <div
      ref={handleRef}
      className={cn(
        "relative w-full h-4 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {/* Track background */}
      <div className="absolute top-1/2 left-0 right-0 h-2 bg-secondary rounded-full transform -translate-y-1/2" />
      
      {/* Track filled */}
      <div
        className="absolute top-1/2 left-0 h-2 bg-primary rounded-full transform -translate-y-1/2"
        style={{ width: `${percentage}%` }}
      />
      
      {/* Thumb */}
      <div
        className={cn(
          "absolute top-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full transform -translate-y-1/2 -translate-x-1/2 transition-shadow",
          isDragging ? "shadow-lg scale-110" : "shadow-md",
          !disabled && "hover:shadow-lg hover:scale-105"
        )}
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
});

Slider.displayName = "Slider";

export { Slider };
