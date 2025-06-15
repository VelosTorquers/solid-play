
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function Hero() {
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createRoom = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter your name before creating a room.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    const roomCode = generateRoomCode();
    
    try {
      const { error } = await supabase
        .from('rooms')
        .insert({ id: roomCode });
      
      if (error) throw error;
      
      // Store username in localStorage
      localStorage.setItem('solid_username', username.trim());
      
      navigate(`/room/${roomCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Zero-friction
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
              brainstorming
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            Create. Collaborate. Export.<br />
            No accounts. No downloads. Just ideas.
          </p>

          <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              className="w-full text-center text-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
              maxLength={30}
            />
            
            <Button
              onClick={createRoom}
              disabled={isCreating || !username.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold text-lg py-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating Room..." : "Start Brainstorming Now"}
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12 text-gray-400"
          >
            <p>Sessions auto-expire in 24 hours • Complete privacy • No data stored</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
