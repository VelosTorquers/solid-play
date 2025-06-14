
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(element.content);
    setPosition({ x: element.x_position, y: element.y_position });
  }, [element.content, element.x_position, element.y_position]);

  const handleContentSave = useCallback(async () => {
    if (content.trim() !== element.content) {
      await supabase
        .from('text_elements')
        .update({ content: content.trim() })
        .eq('id', element.id);
    }
    setIsEditing(false);
  }, [content, element.content, element.id]);

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
    
    // Update database with final position
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
    if (!isDragging && !isSelectable) {
      setIsEditing(true);
    }
  }, [isDragging, isSelectable]);

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
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleContentSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleContentSave();
            }
            if (e.key === 'Escape') {
              setContent(element.content);
              setIsEditing(false);
            }
          }}
          className="bg-transparent border-none outline-none min-w-24 px-1 py-1 rounded border-2 border-dashed border-blue-300 bg-blue-50"
          style={{ 
            fontSize: `${element.font_size}px`, 
            color: element.color,
            minWidth: '100px'
          }}
          autoFocus
        />
      ) : (
        <div
          className="whitespace-nowrap px-1 py-1 rounded hover:bg-gray-100 transition-colors"
          style={{ 
            fontSize: `${element.font_size}px`, 
            color: element.color 
          }}
        >
          {content}
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
