
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DrawingCanvasProps {
  roomId: string;
  isActive: boolean;
  userName: string;
}

interface Drawing {
  id: string;
  path_data: string;
  color: string;
  stroke_width: number;
  created_by: string;
}

export function DrawingCanvas({ roomId, isActive, userName }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
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
  });

  // Set up real-time subscription for drawings
  useEffect(() => {
    const drawingsChannel = supabase
      .channel('drawings-changes')
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

  const startDrawing = (e: React.MouseEvent) => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath(`M ${x} ${y}`);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPath(prev => `${prev} L ${x} ${y}`);

    // Draw current stroke
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const path = new Path2D(currentPath + ` L ${x} ${y}`);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw all existing drawings
      drawings.forEach((drawing) => {
        const existingPath = new Path2D(drawing.path_data);
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = drawing.stroke_width;
        ctx.stroke(existingPath);
      });
      
      // Draw current path
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke(path);
    }
  };

  const stopDrawing = async () => {
    if (!isDrawing || !currentPath) return;

    setIsDrawing(false);

    // Save drawing to database
    await supabase.from('drawings').insert({
      room_id: roomId,
      path_data: currentPath,
      color: 'black',
      stroke_width: 2,
      created_by: userName,
    });

    setCurrentPath('');
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
