
import { Button } from "@/components/ui/button";
import { Copy, Share2, Download, Layers3, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExportModal } from "./ExportModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface RoomHeaderProps {
  roomId: string;
}

export function RoomHeader({ roomId }: RoomHeaderProps) {
  const [showExport, setShowExport] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const roomUrl = `${window.location.origin}/room/${roomId}`;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Room code copied!",
      description: "Share this code with your team",
    });
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomUrl);
    toast({
      title: "Room link copied!",
      description: "Share this link with your team",
    });
  };

  const goHome = () => {
    navigate('/');
  };

  const saveWhiteboard = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your whiteboard",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!saveTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your whiteboard",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_whiteboards')
        .insert({
          title: saveTitle.trim(),
          room_id: roomId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Whiteboard saved!",
        description: "Your whiteboard has been saved to your dashboard",
      });
      
      setSaveTitle("");
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      toast({
        title: "Error",
        description: "Failed to save whiteboard",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={goHome}>
            <Layers3 className="h-8 w-8 text-amber-500" />
            <span className="text-xl font-bold text-gray-900">Solid</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg border">
            <span className="text-sm font-medium text-gray-600">Room:</span>
            <span className="text-lg font-mono font-bold text-gray-900">{roomId}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomCode}
              className="h-6 w-6 p-1 hover:bg-gray-200 transition-colors"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 hover:bg-gray-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Whiteboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter whiteboard title"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveWhiteboard()}
                />
                <Button 
                  onClick={saveWhiteboard} 
                  disabled={isSaving || !saveTitle.trim()}
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Whiteboard"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={copyRoomLink}
            className="flex items-center space-x-2 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Link</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExport(true)}
            className="flex items-center space-x-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </header>

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        roomId={roomId}
      />
    </>
  );
}
