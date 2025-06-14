
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const JoinRoom = () => {
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && username.trim()) {
      // Store username in localStorage
      localStorage.setItem('solid_username', username.trim());
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/90 border-neutral-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Join Room</CardTitle>
          <p className="text-neutral-400">Enter your name and room code to join a brainstorming session</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-center text-lg bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400"
                maxLength={30}
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Enter room code (e.g., ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-wider bg-neutral-800 border-neutral-700 text-white"
                maxLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold"
              disabled={roomCode.length !== 6 || !username.trim()}
            >
              Join Room
            </Button>
          </form>
          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="text-amber-500 hover:text-amber-400 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoom;
