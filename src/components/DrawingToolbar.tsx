
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Palette, Brush, Square, Circle, ArrowRight, Triangle, Minus, Eraser } from "lucide-react";
import { useState } from "react";

interface DrawingToolbarProps {
  isVisible: boolean;
  brushSize: number;
  brushColor: string;
  currentTool: string;
  onBrushSizeChange: (size: number) => void;
  onBrushColorChange: (color: string) => void;
  onToolChange: (tool: string) => void;
}

const colorCategories = {
  basic: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
  grays: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#EEEEEE', '#F5F5F5', '#FFFFFF'],
  reds: ['#8B0000', '#B22222', '#DC143C', '#FF0000', '#FF6347', '#FF7F7F', '#FFB6C1', '#FFC0CB'],
  blues: ['#000080', '#0000CD', '#0000FF', '#1E90FF', '#4169E1', '#87CEEB', '#ADD8E6', '#E0F6FF'],
  greens: ['#006400', '#008000', '#228B22', '#32CD32', '#7CFC00', '#ADFF2F', '#98FB98', '#F0FFF0'],
  yellows: ['#FFD700', '#FFFF00', '#FFFFE0', '#FFFACD', '#FFF8DC', '#FFEFD5', '#FFE4B5', '#FFDAB9'],
  purples: ['#4B0082', '#663399', '#800080', '#9932CC', '#BA55D3', '#DA70D6', '#DDA0DD', '#E6E6FA'],
  oranges: ['#8B4513', '#D2691E', '#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFB347', '#FFDAB9']
};

export function DrawingToolbar({ 
  isVisible, 
  brushSize, 
  brushColor, 
  currentTool,
  onBrushSizeChange, 
  onBrushColorChange,
  onToolChange
}: DrawingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorCategory, setActiveColorCategory] = useState('basic');

  if (!isVisible) return null;

  const tools = [
    { id: 'pen', icon: Brush, label: 'Free Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  ];

  return (
    <div className="absolute top-20 left-4 bg-white rounded-lg shadow-xl border p-4 z-20 min-w-[320px] max-h-[80vh] overflow-y-auto">
      <div className="space-y-6">
        {/* Drawing Tools */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Drawing Tools</h3>
          <div className="grid grid-cols-3 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolChange(tool.id)}
                  className="flex flex-col items-center space-y-1 h-16 text-xs"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tool.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Brush Size - Hide for eraser */}
        {currentTool !== 'eraser' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Brush className="h-4 w-4" />
              <span className="text-sm font-medium">Size: {brushSize}px</span>
            </div>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => onBrushSizeChange(value[0])}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1px</span>
              <span>50px</span>
            </div>
          </div>
        )}

        {/* Eraser Size */}
        {currentTool === 'eraser' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Eraser className="h-4 w-4" />
              <span className="text-sm font-medium">Eraser Size: {brushSize}px</span>
            </div>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => onBrushSizeChange(value[0])}
              max={50}
              min={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5px</span>
              <span>50px</span>
            </div>
          </div>
        )}

        {/* Color Picker - Hide for eraser */}
        {currentTool !== 'eraser' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span className="text-sm font-medium">Color</span>
              </div>
              <div 
                className="w-8 h-8 rounded-full border-3 border-gray-300 cursor-pointer shadow-sm"
                style={{ backgroundColor: brushColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
            </div>

            {showColorPicker && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                {/* Color Category Tabs */}
                <div className="flex flex-wrap gap-1">
                  {Object.keys(colorCategories).map((category) => (
                    <Button
                      key={category}
                      variant={activeColorCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveColorCategory(category)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Color Grid */}
                <div className="grid grid-cols-8 gap-1">
                  {colorCategories[activeColorCategory as keyof typeof colorCategories].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform shadow-sm"
                      style={{ 
                        backgroundColor: color,
                        borderColor: brushColor === color ? '#333' : '#ddd'
                      }}
                      onClick={() => {
                        onBrushColorChange(color);
                      }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <span className="text-xs text-gray-600">Custom:</span>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => onBrushColorChange(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brushColor}
                    onChange={(e) => onBrushColorChange(e.target.value)}
                    className="text-xs px-2 py-1 border rounded flex-1 font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Brush/Eraser Preview */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Preview</span>
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            <div 
              className="rounded-full shadow-sm border-2"
              style={{
                width: `${Math.max(brushSize, 4)}px`,
                height: `${Math.max(brushSize, 4)}px`,
                backgroundColor: currentTool === 'eraser' ? '#f3f4f6' : brushColor,
                borderColor: currentTool === 'eraser' ? '#9ca3af' : brushColor,
                borderStyle: currentTool === 'eraser' ? 'dashed' : 'solid'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
