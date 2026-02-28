import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// Default color presets
const DEFAULT_PRESETS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

interface ColorPickerProps {
  /** Current color value */
  color: string;
  /** Callback when color changes */
  onChange: (color: string) => void;
  /** Preset colors to show */
  presets?: string[];
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Size of the color trigger: 'sm' | 'md' | 'lg' */
  size?: "sm" | "md" | "lg";
}

/**
 * ColorPicker component - A color selection component with presets
 */
export function ColorPicker({
  color,
  onChange,
  presets = DEFAULT_PRESETS,
  disabled = false,
  size = "md",
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update custom color when prop changes
  useEffect(() => {
    setCustomColor(color);
  }, [color]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle preset color click
  const handlePresetClick = (presetColor: string) => {
    setCustomColor(presetColor);
    onChange(presetColor);
    setIsOpen(false);
  };

  // Handle custom color input
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);
    
    // Only call onChange if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  };

  // Handle blur on custom input
  const handleCustomBlur = () => {
    // If not a valid hex, reset to current color
    if (!/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      setCustomColor(color);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Color trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "rounded-md border-2 border-slate-300 dark:border-slate-600 transition-all",
          "hover:border-slate-400 dark:hover:border-slate-500",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
          disabled && "opacity-50 cursor-not-allowed",
          sizeClasses[size]
        )}
        style={{ backgroundColor: color }}
        title={color}
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-52">
          {/* Preset colors grid */}
          <div className="grid grid-cols-8 gap-1 mb-3">
            {presets.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => handlePresetClick(presetColor)}
                className={cn(
                  "w-5 h-5 rounded transition-all",
                  "hover:scale-110 hover:shadow-md",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500",
                  color === presetColor && "ring-2 ring-primary-500 ring-offset-1"
                )}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>

          {/* Separator */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

          {/* Custom color input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Custom:</label>
            <input
              type="text"
              value={customColor}
              onChange={handleCustomChange}
              onBlur={handleCustomBlur}
              placeholder="#000000"
              className="flex-1 px-2 py-1 text-xs font-mono rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
              maxLength={7}
            />
            {/* Native color picker */}
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setCustomColor(e.target.value);
                onChange(e.target.value);
              }}
              className="w-6 h-6 rounded border-0 cursor-pointer"
              title="Pick custom color"
            />
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-500">Preview:</span>
            <div
              className="flex-1 h-4 rounded"
              style={{ backgroundColor: customColor }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
