import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StickyNote } from "./StickyNote";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingToolbar } from "./DrawingToolbar";
import { TextElement } from "./TextElement";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhiteboardProps {
  roomId: string;
  currentTool: 'sticky' | 'pen' | 'text' | 'select' | 'eraser';
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

  // Improved zoom and pan state
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

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
    refetchInterval: 500,
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
    refetchInterval: 500,
  });

  // Real-time subscriptions
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

  // Improved zoom controls
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Handle wheel zoom with better sensitivity
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.005; // Reduced sensitivity for smoother zoom
      const newScale = Math.min(Math.max(0.1, scale + delta), 3);
      setScale(newScale);
    }
  }, [scale]);

  // Handle pan with space key for easier laptop use
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !isPanning) {
      e.preventDefault();
      document.body.style.cursor = 'grab';
    }
  }, [isPanning]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      document.body.style.cursor = 'default';
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = 'default';
    };
  }, [handleKeyDown, handleKeyUp]);

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool === 'select' && e.button === 0) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'grabbing';
    }
  }, [currentTool]);

  // Handle pan move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      document.body.style.cursor = 'default';
    }
  }, [isPanning]);

  // Fixed cursor position calculation
  const getCanvasPosition = useCallback((e: React.MouseEvent) => {
    const rect = whiteboardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    // Get the exact cursor position relative to the whiteboard
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert to canvas coordinates accounting for zoom and pan
    const canvasX = (clientX - panOffset.x) / scale;
    const canvasY = (clientY - panOffset.y) / scale;

    return { x: canvasX, y: canvasY };
  }, [scale, panOffset]);

  const handleWhiteboardClick = useCallback(async (e: React.MouseEvent) => {
    if (currentTool === 'select' || currentTool === 'pen' || isPanning) return;

    const { x, y } = getCanvasPosition(e);

    if (currentTool === 'sticky') {
      const tempNote = {
        id: `temp-${Date.now()}`,
        content: '',
        x_position: x,
        y_position: y,
        color: 'yellow',
        votes: 0,
        created_by: userName,
      };

      queryClient.setQueryData(['sticky-notes', roomId], (old: StickyNoteType[] = []) => [
        ...old,
        tempNote as StickyNoteType
      ]);

      const { error } = await supabase.from('sticky_notes').insert({
        room_id: roomId,
        content: '',
        x_position: x,
        y_position: y,
        color: 'yellow',
        created_by: userName,
      });

      if (error) {
        queryClient.invalidateQueries({ queryKey: ['sticky-notes', roomId] });
        console.error('Error creating sticky note:', error);
      }
    } else if (currentTool === 'text') {
      const tempText = {
        id: `temp-${Date.now()}`,
        content: '',
        x_position: x,
        y_position: y,
        font_size: 16,
        color: 'black',
        created_by: userName,
      };

      queryClient.setQueryData(['text-elements', roomId], (old: TextElementType[] = []) => [
        ...old,
        tempText as TextElementType
      ]);

      const { error } = await supabase.from('text_elements').insert({
        room_id: roomId,
        content: '',
        x_position: x,
        y_position: y,
        font_size: 16,
        color: 'black',
        created_by: userName,
      });

      if (error) {
        queryClient.invalidateQueries({ queryKey: ['text-elements', roomId] });
        console.error('Error creating text element:', error);
      }
    }
  }, [currentTool, roomId, userName, queryClient, getCanvasPosition, isPanning]);

  const getCursorClass = () => {
    switch (currentTool) {
      case 'sticky': return 'cursor-copy';
      case 'pen': return 'cursor-crosshair';
      case 'text': return 'cursor-text';
      case 'select': return isPanning ? 'cursor-grabbing' : 'cursor-grab';
      case 'eraser': return 'cursor-crosshair';
      default: return 'cursor-default';
    }
  };

  const getToolInstruction = () => {
    switch (currentTool) {
      case 'sticky': return 'Click anywhere to add a sticky note';
      case 'pen': return `Draw with ${drawingTool} tool • Size: ${brushSize}px • Color: ${brushColor}`;
      case 'text': return 'Click anywhere to add text';
      case 'select': return 'Drag to pan • Ctrl+Scroll to zoom • Double-click items to edit • Space+Drag to pan';
      case 'eraser': return 'Draw to erase content';
      default: return '';
    }
  };

  return (
    <div
      ref={whiteboardRef}
      className={`w-full h-full bg-gray-50 relative overflow-hidden ${getCursorClass()}`}
      onClick={handleWhiteboardClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Infinite canvas container */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: '5000px', // Large fixed canvas size
          height: '5000px',
          position: 'absolute',
          top: '0px',
          left: '0px',
        }}
      >
        {/* Drawing Canvas */}
        <DrawingCanvas 
          roomId={roomId} 
          isActive={currentTool === 'pen' || currentTool === 'eraser'}
          userName={userName}
          brushSize={brushSize}
          brushColor={brushColor}
          drawingTool={currentTool === 'eraser' ? 'eraser' : drawingTool}
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
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-2 z-30">
        <Button
          onClick={zoomIn}
          size="sm"
          variant="outline"
          className="w-10 h-10 bg-white/95 backdrop-blur-sm shadow-lg border"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          onClick={zoomOut}
          size="sm"
          variant="outline"
          className="w-10 h-10 bg-white/95 backdrop-blur-sm shadow-lg border"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          onClick={resetView}
          size="sm"
          variant="outline"
          className="w-10 h-10 bg-white/95 backdrop-blur-sm shadow-lg border"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

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

      {/* Tool instruction */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border z-30">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            {getToolInstruction()}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Collaborating as: {userName}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Zoom: {Math.round(scale * 100)}% • Pan: ({Math.round(panOffset.x)}, {Math.round(panOffset.y)})
        </div>
      </div>
    </div>
  );
}
