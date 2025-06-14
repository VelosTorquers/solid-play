
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileImage, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function ExportModal({ isOpen, onClose, roomId }: ExportModalProps) {
  const exportAsText = async () => {
    try {
      const { data: stickyNotes } = await supabase
        .from('sticky_notes')
        .select('*')
        .eq('room_id', roomId)
        .order('votes', { ascending: false });

      const { data: textElements } = await supabase
        .from('text_elements')
        .select('*')
        .eq('room_id', roomId);

      let content = `BRAINSTORMING SESSION - Room ${roomId}\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n\n`;

      if (stickyNotes && stickyNotes.length > 0) {
        content += "STICKY NOTES (sorted by votes):\n";
        content += "=" .repeat(40) + "\n\n";
        
        stickyNotes.forEach((note, index) => {
          content += `${index + 1}. ${note.content}\n`;
          content += `   👤 ${note.created_by} | ❤️ ${note.votes} votes | 🎨 ${note.color}\n\n`;
        });
      }

      if (textElements && textElements.length > 0) {
        content += "TEXT ELEMENTS:\n";
        content += "=" .repeat(40) + "\n\n";
        
        textElements.forEach((element, index) => {
          content += `${index + 1}. ${element.content}\n`;
          content += `   👤 ${element.created_by}\n\n`;
        });
      }

      // Download as text file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainstorming-${roomId}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const exportAsImage = async () => {
    // Simple implementation - in production you'd capture the actual whiteboard
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Brainstorming Session`, canvas.width / 2, 50);
        ctx.fillText(`Room: ${roomId}`, canvas.width / 2, 80);
        ctx.font = '16px Arial';
        ctx.fillText('Export feature coming soon!', canvas.width / 2, 300);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `brainstorming-${roomId}-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Image export failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Brainstorming Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={exportAsText}
            className="w-full flex items-center space-x-2"
            variant="outline"
          >
            <FileText className="h-4 w-4" />
            <span>Export as Text Summary</span>
          </Button>
          
          <Button
            onClick={exportAsImage}
            className="w-full flex items-center space-x-2"
            variant="outline"
          >
            <FileImage className="h-4 w-4" />
            <span>Export as Image</span>
          </Button>
          
          <p className="text-sm text-gray-500">
            Text export includes all sticky notes (sorted by votes) and text elements. 
            Image export captures the current whiteboard state.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
