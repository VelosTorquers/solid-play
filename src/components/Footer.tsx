
export function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full"></div>
              <span className="text-2xl font-bold text-white">Solid</span>
            </div>
            <p className="text-neutral-400 mb-4 max-w-md">
              The future of digital art curation. Create, collaborate, and showcase your work in stunning 3D virtual galleries.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                Discord
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Create Gallery</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Browse Art</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Collaborate</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Analytics</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-neutral-400">
            © 2024 Solid. All rights reserved. Empowering artists worldwide.
          </p>
        </div>
      </div>
    </footer>
  )
}
