
import { Button } from "@/components/ui/button";
import { StickyNote, Pen, Type, MousePointer, Eraser } from "lucide-react";

interface ToolbarProps {
  currentTool: 'sticky' | 'pen' | 'text' | 'select' | 'eraser';
  onToolChange: (tool: 'sticky' | 'pen' | 'text' | 'select' | 'eraser') => void;
}

export function Toolbar({ currentTool, onToolChange }: ToolbarProps) {
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select' },
    { id: 'sticky' as const, icon: StickyNote, label: 'Sticky Note' },
    { id: 'pen' as const, icon: Pen, label: 'Draw' },
    { id: 'eraser' as const, icon: Eraser, label: 'Eraser' },
    { id: 'text' as const, icon: Type, label: 'Text' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{tool.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
