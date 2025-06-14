
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Whiteboard } from "@/components/Whiteboard";
import { RoomHeader } from "@/components/RoomHeader";
import { Toolbar } from "@/components/Toolbar";
import { toast } from "@/hooks/use-toast";

const Room = () => {
  const { roomId } = useParams();
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [tool, setTool] = useState<'sticky' | 'pen' | 'text' | 'select'>('sticky');

  useEffect(() => {
    const checkRoom = async () => {
      if (!roomId) return;
      
      const { data, error } = await supabase
        .from('rooms')
        .select('id, expires_at')
        .eq('id', roomId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setRoomExists(false);
        toast({
          title: "Room not found",
          description: "This room doesn't exist or has expired.",
          variant: "destructive"
        });
        return;
      }

      // Check if room has expired
      if (new Date(data.expires_at) < new Date()) {
        setRoomExists(false);
        toast({
          title: "Room expired",
          description: "This brainstorming session has expired.",
          variant: "destructive"
        });
        return;
      }

      setRoomExists(true);
    };

    checkRoom();
  }, [roomId]);

  if (roomExists === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (roomExists === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h1>
          <p className="text-gray-600 mb-6">This room doesn't exist or has expired.</p>
          <a 
            href="/" 
            className="bg-amber-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            Create New Room
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <RoomHeader roomId={roomId!} />
      <Toolbar currentTool={tool} onToolChange={setTool} />
      <div className="flex-1 overflow-hidden">
        <Whiteboard roomId={roomId!} currentTool={tool} />
      </div>
    </div>
  );
};

export default Room;
