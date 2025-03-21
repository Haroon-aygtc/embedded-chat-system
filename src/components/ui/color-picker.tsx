import React from "react";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const colors = [
    "#4f46e5",
    "#10b981",
    "#ef4444",
    "#f59e0b",
    "#6366f1",
    "#000000",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <div
          key={color}
          className={`w-6 h-6 rounded-full cursor-pointer ${value === color ? "ring-2 ring-offset-2 ring-black" : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 cursor-pointer"
      />
    </div>
  );
};

interface ColorSwatchProps {
  color: string;
}

export const ColorSwatch = ({ color }: ColorSwatchProps) => (
  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
);
