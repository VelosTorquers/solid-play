
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
  scale: number;
  panOffset: { x: number; y: number };
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
  canvasBounds,
  scale,
  panOffset
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});
  const queryClient = useQueryClient();

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

  // Resize canvas to fill the entire viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw canvas when drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach((drawing) => {
      try {
        // Parse the path data and transform it to screen coordinates
        const transformedPath = transformPathToScreen(drawing.path_data);
        
        if (transformedPath) {
          const path = new Path2D(transformedPath);
          ctx.strokeStyle = drawing.color;
          ctx.lineWidth = drawing.stroke_width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke(path);
        }
      } catch (error) {
        console.error('Error drawing path:', error);
      }
    });
  }, [drawings, scale, panOffset]);

  // Transform world coordinates to screen coordinates
  const worldToScreen = (worldX: number, worldY: number) => {
    return {
      x: worldX * scale + panOffset.x,
      y: worldY * scale + panOffset.y
    };
  };

  // Transform screen coordinates to world coordinates
  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - panOffset.x) / scale,
      y: (screenY - panOffset.y) / scale
    };
  };

  // Transform path data from world coordinates to screen coordinates
  const transformPathToScreen = (pathData: string): string => {
    return pathData.replace(/([ML])\s*([+-]?\d*\.?\d+)\s*([+-]?\d*\.?\d+)/g, (match, command, x, y) => {
      const worldX = parseFloat(x);
      const worldY = parseFloat(y);
      const screen = worldToScreen(worldX, worldY);
      return `${command} ${screen.x} ${screen.y}`;
    });
  };

  // Transform path data from screen coordinates to world coordinates
  const transformPathToWorld = (pathData: string): string => {
    return pathData.replace(/([ML])\s*([+-]?\d*\.?\d+)\s*([+-]?\d*\.?\d+)/g, (match, command, x, y) => {
      const screenX = parseFloat(x);
      const screenY = parseFloat(y);
      const world = screenToWorld(screenX, screenY);
      return `${command} ${world.x} ${world.y}`;
    });
  };

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setMousePos(pos);

    if (!isDrawing || !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (drawingTool === 'eraser') {
      handleErase(pos);
      return;
    }

    // Clear and redraw all existing drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawings.forEach((drawing) => {
      try {
        const transformedPath = transformPathToScreen(drawing.path_data);
        if (transformedPath) {
          const existingPath = new Path2D(transformedPath);
          ctx.strokeStyle = drawing.color;
          ctx.lineWidth = drawing.stroke_width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke(existingPath);
        }
      } catch (error) {
        console.error('Error redrawing existing path:', error);
      }
    });

    // Draw current stroke
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawingTool === 'pen') {
      setCurrentPath(prev => `${prev} L ${pos.x} ${pos.y}`);
      const path = new Path2D(currentPath + ` L ${pos.x} ${pos.y}`);
      ctx.stroke(path);
    } else if (startPoint) {
      const shapePath = createShapePath(drawingTool, startPoint, pos);
      if (shapePath) {
        const path = new Path2D(shapePath);
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
    const drawingsToDelete: string[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check which drawings intersect with the eraser position
    drawings.forEach((drawing) => {
      try {
        const transformedPath = transformPathToScreen(drawing.path_data);
        if (transformedPath) {
          const path = new Path2D(transformedPath);
          ctx.lineWidth = drawing.stroke_width + brushSize;
          
          if (ctx.isPointInStroke && ctx.isPointInStroke(path, pos.x, pos.y)) {
            drawingsToDelete.push(drawing.id);
          }
        }
      } catch (error) {
        console.error('Error checking path for erasing:', error);
      }
    });

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
      handleErase(pos);
    } else if (drawingTool === 'pen') {
      setCurrentPath(`M ${pos.x} ${pos.y}`);
    }
  };

  const stopDrawing = async (e: React.MouseEvent) => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
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
      // Transform screen coordinates to world coordinates before saving
      const worldPath = transformPathToWorld(pathToSave);
      
      const { error } = await supabase.from('drawings').insert({
        room_id: roomId,
        path_data: worldPath,
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
    if (drawingTool === 'eraser') return 'none';
    return 'crosshair';
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ 
          pointerEvents: isActive ? 'auto' : 'none',
          cursor: getCursor()
        }}
      />
      
      {isActive && drawingTool === 'eraser' && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-red-500 bg-red-100/50 z-10"
          style={{
            width: `${brushSize * 2}px`,
            height: `${brushSize * 2}px`,
            left: `${mousePos.x - brushSize}px`,
            top: `${mousePos.y - brushSize}px`,
            transform: 'translate(0, 0)'
          }}
        />
      )}
    </div>
  );
}
