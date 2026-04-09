import { useState, useEffect } from 'react'
import { Globe, Menu, X } from 'lucide-react'

const NAV_LINKS = ['Tìm bác sĩ', 'Chuyên khoa', 'Dịch vụ', 'Tin tức']

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 w-full z-40 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.92)' : '#fff',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        boxShadow: scrolled
          ? '0 2px 24px rgba(0,93,152,0.10)'
          : '0 1px 0 rgba(192,199,211,0.3)',
      }}
    >
      <div className="flex justify-between items-center h-16 px-6 lg:px-16 max-w-screen-xl mx-auto">
        <img
          alt="Vinmec Logo"
          className="h-9 object-contain"
          src="https://www.vinmec.com/static/uploads/Logo_Vinmec_System_c725c14ffd.png"
        />

        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#404751]">
          {NAV_LINKS.map((item) => (
            <a
              key={item}
              href="#"
              className="relative group hover:text-[#005d98] transition-colors duration-200"
            >
              {item}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#005d98] rounded-full transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Globe size={18} className="text-[#707882] cursor-pointer hidden lg:block hover:text-[#005d98] transition-colors" />
          <a
            href="#"
            className="text-white px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 active:scale-[0.98] hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #005d98, #0076c0)', boxShadow: '0 4px 14px rgba(0,93,152,0.25)' }}
          >
            Đặt lịch hẹn
          </a>
          <button
            className="lg:hidden text-[#404751] p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className="lg:hidden overflow-hidden transition-all duration-300"
        style={{ maxHeight: mobileOpen ? 300 : 0 }}
      >
        <div className="border-t border-[#eaeef2] px-6 py-4 flex flex-col gap-4 bg-white">
          {NAV_LINKS.map((item) => (
            <a key={item} href="#" className="text-[#404751] font-medium text-sm hover:text-[#005d98] transition-colors">
              {item}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
