import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface StickyNoteProps {
  note: {
    id: string;
    content: string;
    x_position: number;
    y_position: number;
    color: string;
    votes: number;
    created_by: string;
  };
  roomId: string;
  isSelectable: boolean;
}

const colorClasses = {
  yellow: 'bg-yellow-200 border-yellow-300 shadow-yellow-100',
  blue: 'bg-blue-200 border-blue-300 shadow-blue-100',
  green: 'bg-green-200 border-green-300 shadow-green-100',
  pink: 'bg-pink-200 border-pink-300 shadow-pink-100',
  orange: 'bg-orange-200 border-orange-300 shadow-orange-100',
};

export function StickyNote({ note, roomId, isSelectable }: StickyNoteProps) {
  const [content, setContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  const handleContentSave = useCallback(async () => {
    if (content.trim() !== note.content) {
      await supabase
        .from('sticky_notes')
        .update({ content: content.trim() })
        .eq('id', note.id);
    }
    setIsEditing(false);
  }, [content, note.content, note.id]);

  const handleVote = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('sticky_notes')
      .update({ votes: note.votes + 1 })
      .eq('id', note.id);
  }, [note.votes, note.id]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', note.id);
  }, [note.id]);

  const handleColorChange = useCallback(async (newColor: string) => {
    await supabase
      .from('sticky_notes')
      .update({ color: newColor })
      .eq('id', note.id);
  }, [note.id]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSelectable || isEditing) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  }, [isSelectable, isEditing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Update position in database immediately for real-time collaboration
    supabase
      .from('sticky_notes')
      .update({ 
        x_position: note.x_position + deltaX, 
        y_position: note.y_position + deltaY 
      })
      .eq('id', note.id);
      
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, note.x_position, note.y_position, note.id]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
  }, [isDragging]);

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
      setContent(note.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`w-48 min-h-32 p-3 border-2 rounded-lg shadow-lg transition-all duration-200 group ${
        colorClasses[note.color as keyof typeof colorClasses] || colorClasses.yellow
      } ${isSelectable ? 'cursor-move hover:shadow-xl' : 'cursor-pointer hover:shadow-md'} ${
        isDragging ? 'opacity-75 scale-105 z-50' : 'hover:scale-102'
      }`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="flex space-x-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {Object.keys(colorClasses).map((color) => (
          <button
            key={color}
            className={`w-4 h-4 rounded-full border-2 hover:scale-110 transition-transform ${
              colorClasses[color as keyof typeof colorClasses]
            } ${note.color === color ? 'ring-2 ring-gray-500' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleColorChange(color);
            }}
          />
        ))}
      </div>

      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleContentSave}
          onKeyDown={handleKeyDown}
          className="w-full h-20 bg-transparent border-none outline-none resize-none text-sm placeholder:text-gray-500"
          autoFocus
          placeholder="Enter your idea..."
        />
      ) : (
        <div className="text-sm whitespace-pre-wrap min-h-20 break-words">
          {content || 'Double-tap to add your idea'}
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVote}
            className="h-6 px-2 text-xs hover:bg-white/50 transition-colors"
          >
            <Heart className="h-3 w-3 mr-1" />
            {note.votes}
          </Button>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-600 font-medium">{note.created_by}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
