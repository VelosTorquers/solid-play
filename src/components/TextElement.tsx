
import { useState, useRef, useEffect } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(element.content);
  }, [element.content]);

  const handleContentSave = async () => {
    if (content.trim() !== element.content) {
      await supabase
        .from('text_elements')
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', element.id);
    }
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('text_elements')
      .delete()
      .eq('id', element.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectable || isEditing) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x_position,
      y: e.clientY - element.y_position,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    supabase
      .from('text_elements')
      .update({ 
        x_position: Math.max(0, newX), 
        y_position: Math.max(0, newY) 
      })
      .eq('id', element.id);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      className={`absolute group ${isSelectable ? 'cursor-move' : 'cursor-text'} ${isDragging ? 'opacity-75' : ''}`}
      style={{ left: element.x_position, top: element.y_position }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging && !isSelectable) {
          setIsEditing(true);
        }
      }}
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
          className="bg-transparent border-none outline-none"
          style={{ 
            fontSize: `${element.font_size}px`, 
            color: element.color,
            minWidth: '100px'
          }}
          autoFocus
        />
      ) : (
        <div
          className="whitespace-nowrap"
          style={{ 
            fontSize: `${element.font_size}px`, 
            color: element.color 
          }}
        >
          {content}
        </div>
      )}

      {/* Delete button (visible on hover) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="absolute -top-2 -right-2 h-6 w-6 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
