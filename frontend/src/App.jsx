import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Awards from './components/Awards'
import Facilities from './components/Facilities'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'

export default function App() {
  return (
    <div className="min-h-screen bg-white text-[#171c1f]">
      <Navbar />
      <Hero />
      <Features />
      <Awards />
      <Facilities />
      <Footer />
      <ChatWidget />
    </div>
  )
}
