
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const showcaseGalleries = [
  {
    title: "Digital Renaissance",
    artist: "Maria Chen",
    description: "A modern interpretation of classical art forms",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop",
    visitors: "2.4k"
  },
  {
    title: "Neon Dreams",
    artist: "Alex Rodriguez",
    description: "Cyberpunk-inspired digital installations",
    image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=500&h=300&fit=crop",
    visitors: "1.8k"
  },
  {
    title: "Abstract Emotions",
    artist: "Sarah Kim",
    description: "Exploring human feelings through color and form",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop",
    visitors: "3.1k"
  }
]

export function Showcase() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Featured
            <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent"> Exhibitions</span>
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            Discover incredible virtual galleries created by our talented artist community
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {showcaseGalleries.map((gallery, index) => (
            <motion.div
              key={gallery.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 overflow-hidden group cursor-pointer">
                <div className="relative">
                  <img 
                    src={gallery.image} 
                    alt={gallery.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {gallery.visitors} visitors
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{gallery.title}</h3>
                  <p className="text-amber-500 font-medium mb-2">by {gallery.artist}</p>
                  <p className="text-neutral-300 mb-4">{gallery.description}</p>
                  <Button variant="outline" size="sm" className="w-full border-gray-600 text-neutral-200 hover:bg-neutral-800">
                    Enter Gallery
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-8 py-3"
          >
            View All Galleries
          </Button>
        </div>
      </div>
    </section>
  )
}
