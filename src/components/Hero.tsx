
'use client'

import { SplineScene } from "@/components/ui/spline";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"
 
export function Hero() {
  const navigate = useNavigate();

  const createRoom = async () => {
    try {
      // Generate room code
      const { data: roomCode, error: codeError } = await supabase
        .rpc('generate_room_code');
      
      if (codeError || !roomCode) {
        toast({
          title: "Error",
          description: "Failed to create room. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Create room
      const { error: roomError } = await supabase
        .from('rooms')
        .insert({
          id: roomCode,
          is_active: true,
        });

      if (roomError) {
        toast({
          title: "Error", 
          description: "Failed to create room. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Navigate to room
      navigate(`/room/${roomCode}`);
      
    } catch (error) {
      console.error('Room creation error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <Card className="w-full h-screen bg-black/[0.96] relative overflow-hidden border-0 rounded-none">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        
        <div className="flex h-full flex-col lg:flex-row">
          {/* Left content */}
          <div className="flex-1 p-8 lg:p-16 relative z-10 flex flex-col justify-center min-h-[50vh] lg:min-h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 via-neutral-200 to-neutral-400 leading-tight">
                Solid
              </h1>
              <h2 className="text-2xl md:text-3xl font-light text-neutral-300 mt-2 mb-6">
                Team Brainstorming Board
              </h2>
              <p className="mt-4 text-neutral-300 max-w-lg text-lg leading-relaxed">
                Zero friction collaboration. No signups, no downloads. 
                Just share a room code and start brainstorming together in real-time.
              </p>
              
              <div className="mt-8 flex gap-4 flex-col sm:flex-row">
                <Button 
                  size="lg" 
                  onClick={createRoom}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-8 py-3"
                >
                  Start Brainstorming Now
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/join')}
                  className="border-neutral-600 text-neutral-200 hover:bg-neutral-800 px-8 py-3"
                >
                  Join Room
                </Button>
              </div>

              {/* Quick features */}
              <div className="mt-12 space-y-3">
                <div className="flex items-center space-x-3 text-neutral-400">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>No account required - instant collaboration</span>
                </div>
                <div className="flex items-center space-x-3 text-neutral-400">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Sticky notes, drawing, and text tools</span>
                </div>
                <div className="flex items-center space-x-3 text-neutral-400">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Auto-expires in 24 hours for privacy</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right content - 3D Scene */}
          <div className="flex-1 relative min-h-[400px] lg:min-h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="w-full h-full"
            >
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </motion.div>
          </div>
        </div>
      </Card>
    </div>
  )
}
