
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Palette, Brush } from "lucide-react";
import { useState } from "react";

interface DrawingToolbarProps {
  isVisible: boolean;
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (size: number) => void;
  onBrushColorChange: (color: string) => void;
}

const colorPalette = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
  '#FFC0CB', '#A52A2A', '#808080', '#000080', '#800000'
];

export function DrawingToolbar({ 
  isVisible, 
  brushSize, 
  brushColor, 
  onBrushSizeChange, 
  onBrushColorChange 
}: DrawingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg border p-4 z-20 min-w-[280px]">
      <div className="space-y-4">
        {/* Brush Size */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Brush className="h-4 w-4" />
            <span className="text-sm font-medium">Brush Size: {brushSize}px</span>
          </div>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            max={20}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span className="text-sm font-medium">Color</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
              style={{ backgroundColor: brushColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              Pick Color
            </Button>
          </div>

          {showColorPicker && (
            <div className="grid grid-cols-5 gap-2 p-2 bg-gray-50 rounded">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: color,
                    borderColor: brushColor === color ? '#333' : '#ddd'
                  }}
                  onClick={() => {
                    onBrushColorChange(color);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Brush Preview */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Preview</span>
          <div className="flex justify-center p-4 bg-gray-50 rounded">
            <div 
              className="rounded-full"
              style={{
                width: `${brushSize}px`,
                height: `${brushSize}px`,
                backgroundColor: brushColor
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
