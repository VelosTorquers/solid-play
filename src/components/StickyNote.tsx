
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  yellow: 'bg-yellow-200 border-yellow-300',
  blue: 'bg-blue-200 border-blue-300',
  green: 'bg-green-200 border-green-300',
  pink: 'bg-pink-200 border-pink-300',
  orange: 'bg-orange-200 border-orange-300',
};

export function StickyNote({ note, roomId, isSelectable }: StickyNoteProps) {
  const [content, setContent] = useState(note.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  const handleContentSave = async () => {
    if (content.trim() !== note.content) {
      await supabase
        .from('sticky_notes')
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', note.id);
    }
    setIsEditing(false);
  };

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('sticky_notes')
      .update({ votes: note.votes + 1 })
      .eq('id', note.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', note.id);
  };

  const handleColorChange = async (newColor: string) => {
    await supabase
      .from('sticky_notes')
      .update({ color: newColor })
      .eq('id', note.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelectable || isEditing) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - note.x_position,
      y: e.clientY - note.y_position,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    supabase
      .from('sticky_notes')
      .update({ 
        x_position: Math.max(0, newX), 
        y_position: Math.max(0, newY) 
      })
      .eq('id', note.id);
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
      className={`absolute w-48 min-h-32 p-3 border-2 rounded-lg shadow-lg ${
        colorClasses[note.color as keyof typeof colorClasses] || colorClasses.yellow
      } ${isSelectable ? 'cursor-move' : 'cursor-pointer'} ${isDragging ? 'opacity-75' : ''}`}
      style={{ left: note.x_position, top: note.y_position }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging && !isSelectable) {
          setIsEditing(true);
        }
      }}
    >
      {/* Color palette */}
      <div className="flex space-x-1 mb-2">
        {Object.keys(colorClasses).map((color) => (
          <button
            key={color}
            className={`w-4 h-4 rounded-full border ${
              colorClasses[color as keyof typeof colorClasses]
            } ${note.color === color ? 'ring-2 ring-gray-400' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleColorChange(color);
            }}
          />
        ))}
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleContentSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleContentSave();
            }
            if (e.key === 'Escape') {
              setContent(note.content);
              setIsEditing(false);
            }
          }}
          className="w-full h-20 bg-transparent border-none outline-none resize-none text-sm"
          autoFocus
        />
      ) : (
        <div className="text-sm whitespace-pre-wrap min-h-20">
          {content}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVote}
            className="h-6 px-2 text-xs"
          >
            <Heart className="h-3 w-3 mr-1" />
            {note.votes}
          </Button>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">{note.created_by}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-1 text-red-500 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
