import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote } from "./StickyNote";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
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
  const [userName] = useState(() => 
    localStorage.getItem('solid_username') || `User${Math.floor(Math.random() * 1000)}`
  );

  // Drawing state
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [drawingTool, setDrawingTool] = useState('pen');

  // Optimized fetch with shorter refetch interval for real-time feel
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
    refetchInterval: 500, // Faster updates
  });

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
    refetchInterval: 500, // Faster updates
  });

  // Optimized real-time subscriptions
  useEffect(() => {
    const stickyNotesChannel = supabase
      .channel(`sticky-notes-${roomId}`)
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
      .channel(`text-elements-${roomId}`)
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

  const handleWhiteboardClick = useCallback(async (e: React.MouseEvent) => {
    if (currentTool === 'select' || currentTool === 'pen') return;

    const rect = whiteboardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Optimistic updates for faster UI response
    if (currentTool === 'sticky') {
      const tempNote = {
        id: `temp-${Date.now()}`,
        content: 'New idea...',
        x_position: x,
        y_position: y,
        color: 'yellow',
        votes: 0,
        created_by: userName,
      };

      // Update cache immediately
      queryClient.setQueryData(['sticky-notes', roomId], (old: StickyNoteType[] = []) => [
        ...old,
        tempNote as StickyNoteType
      ]);

      // Then save to database
      const { error } = await supabase.from('sticky_notes').insert({
        room_id: roomId,
        content: 'New idea...',
        x_position: x,
        y_position: y,
        color: 'yellow',
        created_by: userName,
      });

      if (error) {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: ['sticky-notes', roomId] });
        console.error('Error creating sticky note:', error);
      }
    } else if (currentTool === 'text') {
      const tempText = {
        id: `temp-${Date.now()}`,
        content: 'Text...',
        x_position: x,
        y_position: y,
        font_size: 16,
        color: 'black',
        created_by: userName,
      };

      // Update cache immediately
      queryClient.setQueryData(['text-elements', roomId], (old: TextElementType[] = []) => [
        ...old,
        tempText as TextElementType
      ]);

      // Then save to database
      const { error } = await supabase.from('text_elements').insert({
        room_id: roomId,
        content: 'Text...',
        x_position: x,
        y_position: y,
        font_size: 16,
        color: 'black',
        created_by: userName,
      });

      if (error) {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: ['text-elements', roomId] });
        console.error('Error creating text element:', error);
      }
    }
  }, [currentTool, roomId, userName, queryClient]);

  const getCursorClass = () => {
    switch (currentTool) {
      case 'sticky': return 'cursor-copy';
      case 'pen': return 'cursor-crosshair';
      case 'text': return 'cursor-text';
      case 'select': return 'cursor-default';
      default: return 'cursor-default';
    }
  };

  const getToolInstruction = () => {
    switch (currentTool) {
      case 'sticky': return 'Click anywhere to add a sticky note';
      case 'pen': return `Draw with ${drawingTool} tool • Size: ${brushSize}px • Color: ${brushColor}`;
      case 'text': return 'Click anywhere to add text';
      case 'select': return 'Click and drag to move items';
      default: return '';
    }
  };

  return (
    <div
      ref={whiteboardRef}
      className={`w-full h-full bg-gray-50 relative overflow-hidden ${getCursorClass()}`}
      onClick={handleWhiteboardClick}
    >
      {/* Drawing Canvas */}
      <DrawingCanvas 
        roomId={roomId} 
        isActive={currentTool === 'pen'}
        userName={userName}
        brushSize={brushSize}
        brushColor={brushColor}
        drawingTool={drawingTool}
      />

      {/* Drawing Toolbar */}
      <DrawingToolbar
        isVisible={currentTool === 'pen'}
        brushSize={brushSize}
        brushColor={brushColor}
        currentTool={drawingTool}
        onBrushSizeChange={setBrushSize}
        onBrushColorChange={setBrushColor}
        onToolChange={setDrawingTool}
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

      {/* Tool instruction */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {getToolInstruction()}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Collaborating as: {userName}
        </div>
        {currentTool === 'pen' && (
          <div className="text-xs text-gray-500 mt-1">
            Brush: {brushSize}px • Color: {brushColor}
          </div>
        )}
      </div>
    </div>
  );
}
