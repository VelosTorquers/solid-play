
import { Button } from "@/components/ui/button";
import { Copy, Share2, Download, QrCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { QRCodeModal } from "./QRCodeModal";
import { ExportModal } from "./ExportModal";

interface RoomHeaderProps {
  roomId: string;
}

export function RoomHeader({ roomId }: RoomHeaderProps) {
  const [showQR, setShowQR] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
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

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full"></div>
            <span className="text-xl font-bold text-gray-900">Solid</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Room:</span>
            <span className="text-lg font-mono font-bold text-gray-900">{roomId}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomCode}
              className="h-6 w-6 p-1"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyRoomLink}
            className="flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Link</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(true)}
            className="flex items-center space-x-2"
          >
            <QrCode className="h-4 w-4" />
            <span>QR Code</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExport(true)}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </header>

      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        roomUrl={roomUrl}
        roomCode={roomId}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        roomId={roomId}
      />
    </>
  );
}
