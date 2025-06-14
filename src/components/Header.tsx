
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export function Header() {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-neutral-800"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full"></div>
          <span className="text-2xl font-bold text-white">Solid</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <span className="text-neutral-300">Zero-friction brainstorming</span>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="text-neutral-300 hover:text-white"
            onClick={() => navigate('/join')}
          >
            Join Room
          </Button>
          <Button 
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold"
            onClick={() => navigate('/')}
          >
            Start Session
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
