
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TextElementProps {
  element: {
    id: string;
    content: string;
    x_position: number;
    y_position: number;
    font_size: number;
    color: string;
    created_by: string;
  };
  roomId: string;
  isSelectable: boolean;
}

export function TextElement({ element, roomId, isSelectable }: TextElementProps) {
  const [content, setContent] = useState(element.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: element.x_position, y: element.y_position });
  const [lastTap, setLastTap] = useState(0);
  const [fontSize, setFontSize] = useState(element.font_size);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(element.content);
    setPosition({ x: element.x_position, y: element.y_position });
    setFontSize(element.font_size);
  }, [element.content, element.x_position, element.y_position, element.font_size]);

  const handleContentSave = useCallback(async () => {
    if (content.trim() !== element.content || fontSize !== element.font_size) {
      await supabase
        .from('text_elements')
        .update({ 
          content: content.trim(),
          font_size: fontSize
        })
        .eq('id', element.id);
    }
    setIsEditing(false);
  }, [content, fontSize, element.content, element.font_size, element.id]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('text_elements')
      .delete()
      .eq('id', element.id);
  }, [element.id]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSelectable || isEditing) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [isSelectable, isEditing, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, e.clientX - dragStart.x);
    const newY = Math.max(0, e.clientY - dragStart.y);
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(async () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    await supabase
      .from('text_elements')
      .update({ 
        x_position: position.x, 
        y_position: position.y 
      })
      .eq('id', element.id);
  }, [isDragging, position, element.id]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      if (!isDragging) {
        setIsEditing(true);
      }
    }
    
    setLastTap(now);
  }, [isDragging, lastTap]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleContentSave();
    }
    if (e.key === 'Escape') {
      setContent(element.content);
      setFontSize(element.font_size);
      setIsEditing(false);
    }
    // Allow all key presses including space
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 72);
    setFontSize(newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 8);
    setFontSize(newSize);
  };

  return (
    <div
      className={`absolute group transition-all duration-200 ${
        isSelectable ? 'cursor-move' : 'cursor-text'
      } ${isDragging ? 'opacity-75 z-50' : 'hover:scale-105'}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {isEditing ? (
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentSave}
            onKeyDown={handleKeyDown}
            className="bg-white border-2 border-blue-400 outline-none resize-both min-w-32 min-h-16 px-3 py-2 rounded-md shadow-lg"
            style={{ 
              fontSize: `${fontSize}px`, 
              color: element.color,
              minWidth: '150px',
              minHeight: '60px'
            }}
            autoFocus
            placeholder="Enter text..."
          />
          <div className="absolute -top-8 left-0 flex space-x-1 bg-white rounded-md shadow-md p-1">
            <Button
              variant="outline"
              size="sm"
              onClick={decreaseFontSize}
              className="h-6 w-6 p-0"
            >
              -
            </Button>
            <span className="text-xs px-2 py-1">{fontSize}px</span>
            <Button
              variant="outline"
              size="sm"
              onClick={increaseFontSize}
              className="h-6 w-6 p-0"
            >
              +
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="whitespace-pre-wrap px-3 py-2 rounded-md bg-white border-2 border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 min-w-24 min-h-8"
          style={{ 
            fontSize: `${fontSize}px`, 
            color: element.color 
          }}
        >
          {content || 'Double-tap to edit'}
        </div>
      )}

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="absolute -top-2 -right-2 h-6 w-6 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 rounded-full"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
