
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

const features = [
  {
    title: "3D Gallery Builder",
    description: "Create stunning virtual gallery spaces with our intuitive drag-and-drop builder. Choose from professional templates or design your own unique environment.",
    icon: "🏛️"
  },
  {
    title: "Real-time Collaboration",
    description: "Work together with artists from around the world. Share galleries, get feedback, and curate exhibitions as a team in real-time.",
    icon: "🤝"
  },
  {
    title: "Immersive Experience",
    description: "Visitors can walk through your galleries in first-person view, interact with artworks, and experience art like never before.",
    icon: "👁️"
  },
  {
    title: "Artist Profiles",
    description: "Showcase your portfolio, connect with other artists, and build your reputation in the digital art community.",
    icon: "👨‍🎨"
  },
  {
    title: "Advanced Analytics",
    description: "Track visitor engagement, popular artworks, and exhibition performance with detailed analytics and insights.",
    icon: "📊"
  },
  {
    title: "Mobile Optimized",
    description: "Your galleries look perfect on any device. From desktop to mobile, the experience is always smooth and responsive.",
    icon: "📱"
  }
]

export function Features() {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to
            <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent"> Create</span>
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            Powerful tools and features designed specifically for digital artists and gallery curators
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 h-full">
                <CardHeader>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-neutral-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
