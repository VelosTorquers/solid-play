
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Layers3, LogOut, Edit, Trash2, Share2, Users } from "lucide-react";

interface SavedWhiteboard {
  id: string;
  title: string;
  room_id: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [whiteboards, setWhiteboards] = useState<SavedWhiteboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchWhiteboards();
    }
  }, [user, loading, navigate]);

  const fetchWhiteboards = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_whiteboards')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setWhiteboards(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createNewWhiteboard = async () => {
    if (!newRoomTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your room",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    const roomCode = generateRoomCode();
    
    try {
      // Create room first
      const { error: roomError } = await supabase
        .from('rooms')
        .insert({ id: roomCode });
      
      if (roomError) throw roomError;

      // Save whiteboard
      const { error: whiteboardError } = await supabase
        .from('saved_whiteboards')
        .insert({
          title: newRoomTitle.trim(),
          room_id: roomCode,
          user_id: user!.id
        });
      
      if (whiteboardError) throw whiteboardError;
      
      toast({
        title: "Room created!",
        description: "Your new room is ready",
      });
      
      navigate(`/room/${roomCode}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
      setNewRoomTitle("");
    }
  };

  const joinRoom = async () => {
    if (!joinRoomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a room code",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, expires_at')
        .eq('id', joinRoomCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Room not found",
          description: "This room doesn't exist or has expired.",
          variant: "destructive"
        });
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: "Room expired",
          description: "This room has expired.",
          variant: "destructive"
        });
        return;
      }

      navigate(`/room/${joinRoomCode.toUpperCase()}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
      setJoinRoomCode("");
    }
  };

  const createTemporaryRoom = async () => {
    const username = localStorage.getItem('solid_username') || user?.email?.split('@')[0] || 'User';
    const roomCode = generateRoomCode();
    
    try {
      const { error } = await supabase
        .from('rooms')
        .insert({ id: roomCode });
      
      if (error) throw error;
      
      localStorage.setItem('solid_username', username);
      navigate(`/room/${roomCode}`);
    } catch (error) {
      console.error('Error creating temporary room:', error);
      toast({
        title: "Error",
        description: "Failed to create temporary room",
        variant: "destructive"
      });
    }
  };

  const deleteWhiteboard = async (id: string, roomId: string) => {
    try {
      // Delete from saved_whiteboards
      const { error } = await supabase
        .from('saved_whiteboards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Also delete the room if no other whiteboards use it
      await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      toast({
        title: "Room deleted",
        description: "Your room has been removed",
      });
      
      fetchWhiteboards();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers3 className="h-8 w-8 text-amber-500" />
            <span className="text-2xl font-bold text-gray-900">Solid</span>
            <span className="text-gray-500">Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rooms</h1>
            <p className="text-gray-600">Create and manage your collaborative rooms</p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={createTemporaryRoom}
              variant="outline"
              className="hover:bg-gray-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Temporary Room
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="hover:bg-gray-50">
                  <Users className="h-4 w-4 mr-2" />
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter room code"
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                    className="uppercase"
                  />
                  <Button 
                    onClick={joinRoom} 
                    disabled={isJoining || !joinRoomCode.trim()}
                    className="w-full"
                  >
                    {isJoining ? "Joining..." : "Join Room"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Room title"
                    value={newRoomTitle}
                    onChange={(e) => setNewRoomTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createNewWhiteboard()}
                  />
                  <Button 
                    onClick={createNewWhiteboard} 
                    disabled={isCreating || !newRoomTitle.trim()}
                    className="w-full"
                  >
                    {isCreating ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {whiteboards.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Layers3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved rooms yet</h3>
              <p className="text-gray-600 mb-6">Create your first room to get started</p>
              <div className="flex justify-center space-x-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Room</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Room title"
                        value={newRoomTitle}
                        onChange={(e) => setNewRoomTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createNewWhiteboard()}
                      />
                      <Button 
                        onClick={createNewWhiteboard} 
                        disabled={isCreating || !newRoomTitle.trim()}
                        className="w-full"
                      >
                        {isCreating ? "Creating..." : "Create Room"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={createTemporaryRoom}
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Temporary Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whiteboards.map((whiteboard) => (
              <Card key={whiteboard.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{whiteboard.title}</CardTitle>
                  <CardDescription>
                    Room: {whiteboard.room_id} • Created {new Date(whiteboard.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/room/${whiteboard.room_id}`)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/room/${whiteboard.room_id}`);
                        toast({ title: "Link copied!", description: "Share this link with others" });
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteWhiteboard(whiteboard.id, whiteboard.room_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
