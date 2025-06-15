
import { Button } from "@/components/ui/button";
import { StickyNote, Pen, Type, MousePointer, Eraser, Hand } from "lucide-react";

interface ToolbarProps {
  currentTool: 'sticky' | 'pen' | 'text' | 'select' | 'eraser' | 'pan';
  onToolChange: (tool: 'sticky' | 'pen' | 'text' | 'select' | 'eraser' | 'pan') => void;
}

export function Toolbar({ currentTool, onToolChange }: ToolbarProps) {
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select & Edit', shortcut: 'V' },
    { id: 'pan' as const, icon: Hand, label: 'Pan/Move View', shortcut: 'H' },
    { id: 'sticky' as const, icon: StickyNote, label: 'Sticky Note', shortcut: 'S' },
    { id: 'text' as const, icon: Type, label: 'Text', shortcut: 'T' },
    { id: 'pen' as const, icon: Pen, label: 'Draw', shortcut: 'P' },
    { id: 'eraser' as const, icon: Eraser, label: 'Eraser', shortcut: 'E' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center space-x-2">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={currentTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(tool.id)}
            className="flex items-center space-x-2"
            title={`${tool.label} (${tool.shortcut})`}
          >
            <tool.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tool.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
