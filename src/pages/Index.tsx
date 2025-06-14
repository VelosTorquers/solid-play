
import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { Showcase } from "@/components/Showcase"
import { Footer } from "@/components/Footer"

const Index = () => {
  console.log("Index page rendering...")
  
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Showcase />
      <Footer />
    </div>
  );
};

export default Index;
