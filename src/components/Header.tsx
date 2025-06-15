
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Layers3 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-neutral-800"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <Layers3 className="h-8 w-8 text-amber-500" />
          <span className="text-2xl font-bold text-white">Solid</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <span className="text-neutral-300">Zero-friction brainstorming</span>
        </nav>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <Button 
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold transition-all duration-200"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="text-neutral-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                onClick={() => navigate('/join')}
              >
                Join Room
              </Button>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold transition-all duration-200"
                onClick={() => navigate('/')}
              >
                Start Session
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
