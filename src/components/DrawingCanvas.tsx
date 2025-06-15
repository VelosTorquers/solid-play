import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DrawingCanvasProps {
  roomId: string;
  isActive: boolean;
  userName: string;
  brushSize: number;
  brushColor: string;
  drawingTool: string;
  canvasBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

interface Drawing {
  id: string;
  path_data: string;
  color: string;
  stroke_width: number;
  created_by: string;
}

export function DrawingCanvas({ 
  roomId, 
  isActive, 
  userName, 
  brushSize, 
  brushColor, 
  drawingTool,
  canvasBounds 
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});
  const queryClient = useQueryClient();

  // Fetch drawings
  const { data: drawings = [] } = useQuery({
    queryKey: ['drawings', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Drawing[];
    },
    refetchInterval: 500,
  });

  // Set up real-time subscription for drawings
  useEffect(() => {
    const drawingsChannel = supabase
      .channel(`drawings-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drawings',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['drawings', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(drawingsChannel);
    };
  }, [roomId, queryClient]);

  // Resize canvas to match bounds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvasBounds.maxX - canvasBounds.minX;
    const height = canvasBounds.maxY - canvasBounds.minY;
    
    canvas.width = width;
    canvas.height = height;
  }, [canvasBounds]);

  // Redraw canvas when drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths, adjusting for canvas bounds
    drawings.forEach((drawing) => {
      try {
        // Parse the path data and adjust coordinates relative to canvas bounds
        const adjustedPathData = drawing.path_data.replace(/(\d+\.?\d*)/g, (match) => {
          const num = parseFloat(match);
          return (num - canvasBounds.minX).toString();
        });
        
        const path = new Path2D(adjustedPathData);
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.stroke_width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(path);
      } catch (error) {
        console.error('Error drawing path:', error);
      }
    });
  }, [drawings, canvasBounds]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    // Convert to absolute canvas coordinates
    const absoluteX = relativeX + canvasBounds.minX;
    const absoluteY = relativeY + canvasBounds.minY;
    
    return { x: absoluteX, y: absoluteY };
  };

  // Track mouse position for eraser cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    if (!isDrawing || !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);

    if (drawingTool === 'eraser') {
      handleErase(pos);
      return;
    }

    // Clear canvas and redraw all existing drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawings.forEach((drawing) => {
      try {
        const adjustedPathData = drawing.path_data.replace(/(\d+\.?\d*)/g, (match) => {
          const num = parseFloat(match);
          return (num - canvasBounds.minX).toString();
        });
        
        const existingPath = new Path2D(adjustedPathData);
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.stroke_width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(existingPath);
      } catch (error) {
        console.error('Error redrawing existing path:', error);
      }
    });

    // Draw current path/shape
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawingTool === 'pen') {
      setCurrentPath(prev => `${prev} L ${pos.x} ${pos.y}`);
      // Convert to relative coordinates for display
      const displayPath = currentPath.replace(/(\d+\.?\d*)/g, (match) => {
        const num = parseFloat(match);
        return (num - canvasBounds.minX).toString();
      }) + ` L ${pos.x - canvasBounds.minX} ${pos.y - canvasBounds.minY}`;
      
      const path = new Path2D(displayPath);
      ctx.stroke(path);
    } else if (startPoint) {
      // For shapes, create preview
      const shapePath = createShapePath(drawingTool, startPoint, pos);
      if (shapePath) {
        // Convert to relative coordinates for display
        const displayPath = shapePath.replace(/(\d+\.?\d*)/g, (match) => {
          const num = parseFloat(match);
          return (num - canvasBounds.minX).toString();
        });
        
        const path = new Path2D(displayPath);
        ctx.stroke(path);
      }
    }
  };

  const createShapePath = (tool: string, start: {x: number, y: number}, end: {x: number, y: number}) => {
    switch (tool) {
      case 'line':
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      
      case 'rectangle':
        const width = end.x - start.x;
        const height = end.y - start.y;
        return `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y} L ${start.x} ${end.y} Z`;
      
      case 'circle':
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radiusX = Math.abs(end.x - start.x) / 2;
        const radiusY = Math.abs(end.y - start.y) / 2;
        return `M ${centerX - radiusX} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${centerX + radiusX} ${centerY} A ${radiusX} ${radiusY} 0 1 1 ${centerX - radiusX} ${centerY}`;
      
      case 'triangle':
        const topX = (start.x + end.x) / 2;
        return `M ${topX} ${start.y} L ${end.x} ${end.y} L ${start.x} ${end.y} Z`;
      
      case 'arrow':
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const arrowLength = Math.min(length * 0.3, 20);
        const arrowAngle = Math.PI / 6;
        
        const arrowX1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = end.y - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = end.y - arrowLength * Math.sin(angle + arrowAngle);
        
        return `M ${start.x} ${start.y} L ${end.x} ${end.y} M ${end.x} ${end.y} L ${arrowX1} ${arrowY1} M ${end.x} ${end.y} L ${arrowX2} ${arrowY2}`;
      
      default:
        return '';
    }
  };

  const handleErase = async (pos: {x: number, y: number}) => {
    // Find drawings that intersect with eraser
    const drawingsToDelete: string[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Convert absolute position to relative canvas position
    const relativeX = pos.x - canvasBounds.minX;
    const relativeY = pos.y - canvasBounds.minY;

    drawings.forEach((drawing) => {
      try {
        // Adjust path data for relative coordinates
        const adjustedPathData = drawing.path_data.replace(/(\d+\.?\d*)/g, (match) => {
          const num = parseFloat(match);
          return (num - canvasBounds.minX).toString();
        });
        
        const path = new Path2D(adjustedPathData);
        ctx.lineWidth = drawing.stroke_width + 10; // Increase hit area for eraser
        
        if (ctx.isPointInStroke && ctx.isPointInStroke(path, relativeX, relativeY)) {
          drawingsToDelete.push(drawing.id);
        }
      } catch (error) {
        console.error('Error checking path for erasing:', error);
      }
    });

    // Delete intersecting drawings
    if (drawingsToDelete.length > 0) {
      const { error } = await supabase
        .from('drawings')
        .delete()
        .in('id', drawingsToDelete);

      if (error) {
        console.error('Error erasing drawings:', error);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!isActive) return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);

    if (drawingTool === 'eraser') {
      setIsErasing(true);
      handleErase(pos);
    } else if (drawingTool === 'pen') {
      setCurrentPath(`M ${pos.x} ${pos.y}`);
    }
  };

  const stopDrawing = async (e: React.MouseEvent) => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setIsErasing(false);
    
    if (drawingTool === 'eraser') {
      setCurrentPath('');
      setStartPoint(null);
      return;
    }

    let pathToSave = '';

    if (drawingTool === 'pen') {
      pathToSave = currentPath;
    } else if (startPoint) {
      const pos = getMousePos(e);
      pathToSave = createShapePath(drawingTool, startPoint, pos);
    }

    if (pathToSave) {
      const { error } = await supabase.from('drawings').insert({
        room_id: roomId,
        path_data: pathToSave,
        color: brushColor,
        stroke_width: brushSize,
        created_by: userName,
      });

      if (error) {
        console.error('Error saving drawing:', error);
      }
    }

    setCurrentPath('');
    setStartPoint(null);
  };

  const getCursor = () => {
    if (!isActive) return 'default';
    if (drawingTool === 'eraser') return 'none'; // Hide default cursor for custom eraser
    return 'crosshair';
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full`}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ 
          pointerEvents: isActive ? 'auto' : 'none',
          cursor: getCursor()
        }}
      />
      
      {/* Custom eraser cursor */}
      {isActive && drawingTool === 'eraser' && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-red-500 bg-red-100/50 z-10"
          style={{
            width: `${brushSize * 3}px`,
            height: `${brushSize * 3}px`,
            left: `${mousePos.x - (brushSize * 1.5)}px`,
            top: `${mousePos.y - (brushSize * 1.5)}px`,
            transform: 'translate(0, 0)'
          }}
        />
      )}
    </div>
  );
}
