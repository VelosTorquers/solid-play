
'use client'

import { SplineScene } from "@/components/ui/spline";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
 
export function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <Card className="w-full h-screen bg-black/[0.96] relative overflow-hidden border-0 rounded-none">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        
        <div className="flex h-full">
          {/* Left content */}
          <div className="flex-1 p-8 lg:p-16 relative z-10 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 via-neutral-200 to-neutral-400 leading-tight">
                Solid
              </h1>
              <h2 className="text-2xl md:text-3xl font-light text-neutral-300 mt-2 mb-6">
                Virtual Art Gallery Platform
              </h2>
              <p className="mt-4 text-neutral-300 max-w-lg text-lg leading-relaxed">
                Create immersive 3D gallery spaces, collaborate with artists worldwide, 
                and curate stunning virtual exhibitions that bring digital art to life.
              </p>
              
              <div className="mt-8 flex gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-8 py-3"
                >
                  Start Creating
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-neutral-600 text-neutral-200 hover:bg-neutral-800 px-8 py-3"
                >
                  Explore Galleries
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right content - 3D Scene */}
          <div className="flex-1 relative">
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
