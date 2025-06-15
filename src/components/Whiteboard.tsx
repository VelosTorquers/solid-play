
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

  // Infinite canvas state
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [canvasBounds, setCanvasBounds] = useState({ 
    minX: -5000, 
    minY: -5000, 
    maxX: 5000, 
    maxY: 5000 
  });

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

  // Update canvas bounds based on content
  useEffect(() => {
    const allElements = [...stickyNotes, ...textElements];
    if (allElements.length === 0) return;

    const positions = allElements.map(el => ({ x: el.x_position, y: el.y_position }));
    const minX = Math.min(...positions.map(p => p.x)) - 1000;
    const minY = Math.min(...positions.map(p => p.y)) - 1000;
    const maxX = Math.max(...positions.map(p => p.x)) + 1000;
    const maxY = Math.max(...positions.map(p => p.y)) + 1000;

    setCanvasBounds({ minX, minY, maxX, maxY });
  }, [stickyNotes, textElements]);

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
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(0.1, scale + delta), 3);
      setScale(newScale);
    }
  }, [scale]);

  // Handle pan with space key for easier laptop use
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !isPanning && currentTool === 'select') {
      e.preventDefault();
      document.body.style.cursor = 'grab';
    }
  }, [isPanning, currentTool]);

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

  // Handle pan start - only allow panning when not interacting with elements
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't pan if clicking on interactive elements or in select mode
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('[data-interactive="true"]');
    
    if ((currentTool === 'select' || e.button === 1) && 
        e.button !== 2 && 
        !isInteractiveElement) {
      e.preventDefault();
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

  // Fixed cursor position calculation for infinite canvas
  const getCanvasPosition = useCallback((e: React.MouseEvent) => {
    const rect = whiteboardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (clientX - panOffset.x) / scale;
    const canvasY = (clientY - panOffset.y) / scale;

    return { x: canvasX, y: canvasY };
  }, [scale, panOffset]);

  const handleWhiteboardClick = useCallback(async (e: React.MouseEvent) => {
    if (currentTool === 'select' || currentTool === 'pen' || currentTool === 'eraser' || isPanning) return;

    // Don't create elements when clicking on existing elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('[data-interactive="true"]');
    if (isInteractiveElement) return;

    const { x, y } = getCanvasPosition(e);

    // Expand canvas bounds if needed
    const expandedBounds = {
      minX: Math.min(canvasBounds.minX, x - 1000),
      minY: Math.min(canvasBounds.minY, y - 1000),
      maxX: Math.max(canvasBounds.maxX, x + 1000),
      maxY: Math.max(canvasBounds.maxY, y + 1000)
    };
    setCanvasBounds(expandedBounds);

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
  }, [currentTool, roomId, userName, queryClient, getCanvasPosition, isPanning, canvasBounds]);

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
      case 'select': return 'Double-click items to edit • Space+Drag or Middle-click+Drag to pan • Ctrl+Scroll to zoom';
      case 'eraser': return 'Draw to erase content';
      default: return '';
    }
  };

  const canvasWidth = canvasBounds.maxX - canvasBounds.minX;
  const canvasHeight = canvasBounds.maxY - canvasBounds.minY;

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
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          position: 'absolute',
          top: `${canvasBounds.minY}px`,
          left: `${canvasBounds.minX}px`,
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
          canvasBounds={canvasBounds}
        />

        {/* Sticky Notes */}
        {stickyNotes.map((note) => (
          <div key={note.id} data-interactive="true">
            <StickyNote
              note={note}
              roomId={roomId}
              isSelectable={currentTool === 'select'}
            />
          </div>
        ))}

        {/* Text Elements */}
        {textElements.map((element) => (
          <div key={element.id} data-interactive="true">
            <TextElement
              element={element}
              roomId={roomId}
              isSelectable={currentTool === 'select'}
            />
          </div>
        ))}
      </div>

      {/* Grid background for better orientation */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ddd 1px, transparent 1px),
            linear-gradient(to bottom, #ddd 1px, transparent 1px)
          `,
          backgroundSize: `${50 * scale}px ${50 * scale}px`,
          backgroundPosition: `${panOffset.x % (50 * scale)}px ${panOffset.y % (50 * scale)}px`
        }}
      />

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
        isVisible={currentTool === 'pen' || currentTool === 'eraser'}
        brushSize={brushSize}
        brushColor={brushColor}
        currentTool={currentTool === 'eraser' ? 'eraser' : drawingTool}
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
          Zoom: {Math.round(scale * 100)}% • Canvas: {Math.round(canvasWidth)} x {Math.round(canvasHeight)}
        </div>
      </div>

      {/* Custom eraser cursor when eraser tool is active */}
      {currentTool === 'eraser' && (
        <div 
          className="pointer-events-none fixed z-50 rounded-full border-2 border-red-500 bg-red-100/50"
          style={{
            width: `${brushSize * 2}px`,
            height: `${brushSize * 2}px`,
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%'
          }}
        />
      )}
    </div>
  );
}
