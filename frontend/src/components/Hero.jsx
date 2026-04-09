import { useEffect, useState } from 'react'

export default function Hero() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative w-full overflow-hidden" style={{ aspectRatio: '16/7', minHeight: 300 }}>
      <img
        alt="Hero Banner"
        className="w-full h-full object-cover"
        src="https://www.vinmec.com/static/uploads/xlarge_4000x1470_O_cu_4fd209e27d.jpg"
        style={{ transition: 'transform 8s ease', transform: loaded ? 'scale(1.03)' : 'scale(1)' }}
      />

      {/* Multi-layer gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, rgba(246,250,254,0.88) 0%, rgba(246,250,254,0.55) 45%, rgba(246,250,254,0.05) 75%, transparent 100%)',
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.6), transparent)' }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-16 lg:px-24">
        <p
          className="font-headline font-semibold text-[#005d98] text-[10px] md:text-xs uppercase tracking-[0.2em] mb-3 transition-all duration-700"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'none' : 'translateY(12px)', transitionDelay: '100ms' }}
        >
          Hệ thống y tế hàng đầu Việt Nam
        </p>

        <h1
          className="font-headline font-extrabold text-[#005d98] leading-tight mb-5"
          style={{
            fontSize: 'clamp(1.4rem, 4vw, 3rem)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
          }}
        >
          TẬN HƯỞNG ĐẶC QUYỀN<br />BẢO VỆ SỨC KHỎE TOÀN DIỆN
        </h1>

        <p
          className="text-[#404751] text-sm md:text-base mb-8 font-medium"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s',
          }}
        >
          Ưu tiên thăm khám – Tối ưu chi phí
        </p>

        <button
          className="text-white px-8 md:px-12 py-3 rounded-full font-bold text-sm md:text-base uppercase tracking-wide transition-all duration-200 active:scale-[0.97]"
          style={{
            background: '#2ebfa5',
            boxShadow: '0 8px 28px rgba(46,191,165,0.35)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s, background 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#26a38d'
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(46,191,165,0.45)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2ebfa5'
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(46,191,165,0.35)'
          }}
        >
          Đăng ký ngay
        </button>
      </div>
    </section>
  )
}
