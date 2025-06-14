
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomUrl: string;
  roomCode: string;
}

export function QRCodeModal({ isOpen, onClose, roomUrl, roomCode }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && qrRef.current) {
      // Generate QR code using a simple approach
      // In a real app, you'd use a QR code library
      const qrSize = 200;
      const canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Simple placeholder - in production use QRCode.js or similar
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, qrSize, qrSize);
        ctx.fillStyle = '#fff';
        ctx.fillRect(10, 10, qrSize - 20, qrSize - 20);
        ctx.fillStyle = '#000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', qrSize / 2, qrSize / 2 - 10);
        ctx.fillText(roomCode, qrSize / 2, qrSize / 2 + 10);
      }
      
      qrRef.current.innerHTML = '';
      qrRef.current.appendChild(canvas);
    }
  }, [isOpen, roomUrl, roomCode]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share Room</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <div ref={qrRef} className="flex justify-center" />
          <div>
            <p className="text-sm text-gray-600 mb-2">Room Code:</p>
            <p className="text-2xl font-mono font-bold">{roomCode}</p>
          </div>
          <p className="text-sm text-gray-500">
            Scan QR code or visit solid.app and enter the room code
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
