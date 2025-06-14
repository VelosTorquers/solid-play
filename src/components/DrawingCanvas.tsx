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
}

interface Drawing {
  id: string;
  path_data: string;
  color: string;
  stroke_width: number;
  created_by: string;
}

export function DrawingCanvas({ roomId, isActive, userName, brushSize, brushColor, drawingTool }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
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
    refetchInterval: 500, // Faster updates for real-time feel
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

  // Redraw canvas when drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    drawings.forEach((drawing) => {
      const path = new Path2D(drawing.path_data);
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.stroke_width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(path);
    });
  }, [drawings]);

  // Resize canvas to fill container
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

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
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

  const startDrawing = (e: React.MouseEvent) => {
    if (!isActive) return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);

    if (drawingTool === 'pen') {
      setCurrentPath(`M ${pos.x} ${pos.y}`);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);

    // Clear canvas and redraw all existing drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawings.forEach((drawing) => {
      const existingPath = new Path2D(drawing.path_data);
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.stroke_width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(existingPath);
    });

    // Draw current path/shape
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawingTool === 'pen') {
      setCurrentPath(prev => `${prev} L ${pos.x} ${pos.y}`);
      const path = new Path2D(currentPath + ` L ${pos.x} ${pos.y}`);
      ctx.stroke(path);
    } else if (startPoint) {
      // For shapes, create preview
      const shapePath = createShapePath(drawingTool, startPoint, pos);
      if (shapePath) {
        const path = new Path2D(shapePath);
        ctx.stroke(path);
      }
    }
  };

  const stopDrawing = async (e: React.MouseEvent) => {
    if (!isDrawing) return;

    setIsDrawing(false);
    
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

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${isActive ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      style={{ pointerEvents: isActive ? 'auto' : 'none' }}
    />
  );
}
