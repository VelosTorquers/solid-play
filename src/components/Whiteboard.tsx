
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote } from "./StickyNote";
import { DrawingCanvas } from "./DrawingCanvas";
import { TextElement } from "./TextElement";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface WhiteboardProps {
  roomId: string;
  currentTool: 'sticky' | 'pen' | 'text' | 'select';
}

interface StickyNoteType {
  id: string;
  content: string;
  x_position: number;
  y_position: number;
  color: string;
  votes: number;
  created_by: string;
}

interface TextElementType {
  id: string;
  content: string;
  x_position: number;
  y_position: number;
  font_size: number;
  color: string;
  created_by: string;
}

export function Whiteboard({ roomId, currentTool }: WhiteboardProps) {
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [userName] = useState(() => `User${Math.floor(Math.random() * 1000)}`);

  // Fetch sticky notes
  const { data: stickyNotes = [] } = useQuery({
    queryKey: ['sticky-notes', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sticky_notes')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as StickyNoteType[];
    },
  });

  // Fetch text elements
  const { data: textElements = [] } = useQuery({
    queryKey: ['text-elements', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('text_elements')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as TextElementType[];
    },
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const stickyNotesChannel = supabase
      .channel('sticky-notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sticky_notes',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sticky-notes', roomId] });
        }
      )
      .subscribe();

    const textElementsChannel = supabase
      .channel('text-elements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'text_elements',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['text-elements', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stickyNotesChannel);
      supabase.removeChannel(textElementsChannel);
    };
  }, [roomId, queryClient]);

  const handleWhiteboardClick = async (e: React.MouseEvent) => {
    if (currentTool === 'select' || currentTool === 'pen') return;

    const rect = whiteboardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'sticky') {
      await supabase.from('sticky_notes').insert({
        room_id: roomId,
        content: 'New idea...',
        x_position: x,
        y_position: y,
        color: 'yellow',
        created_by: userName,
      });
    } else if (currentTool === 'text') {
      await supabase.from('text_elements').insert({
        room_id: roomId,
        content: 'Text...',
        x_position: x,
        y_position: y,
        font_size: 16,
        color: 'black',
        created_by: userName,
      });
    }
  };

  return (
    <div
      ref={whiteboardRef}
      className="w-full h-full bg-gray-50 relative overflow-hidden cursor-crosshair"
      onClick={handleWhiteboardClick}
    >
      {/* Drawing Canvas */}
      <DrawingCanvas 
        roomId={roomId} 
        isActive={currentTool === 'pen'}
        userName={userName}
      />

      {/* Sticky Notes */}
      {stickyNotes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          roomId={roomId}
          isSelectable={currentTool === 'select'}
        />
      ))}

      {/* Text Elements */}
      {textElements.map((element) => (
        <TextElement
          key={element.id}
          element={element}
          roomId={roomId}
          isSelectable={currentTool === 'select'}
        />
      ))}

      {/* Tool cursor indicator */}
      <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded-lg shadow-sm">
        <span className="text-sm font-medium text-gray-700">
          {currentTool === 'sticky' && 'Click to add sticky note'}
          {currentTool === 'pen' && 'Click and drag to draw'}
          {currentTool === 'text' && 'Click to add text'}
          {currentTool === 'select' && 'Click to select and move items'}
        </span>
      </div>
    </div>
  );
}
