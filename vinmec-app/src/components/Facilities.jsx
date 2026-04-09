import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5QM0c4hc3ILAC2uM70qGO-BqhwR0m7D_XLW5uE65UKNi8uWN3jj6C9SNRKdos3tJ1npTxnT8id7hDpU0VEl-Y1lm8WzrMqHy8_FErF7glfrPJux4brmL6cHJN1-3dcVjhZKNXhJBfZjWttdfzXEBkMWSO8eD-Umbro7u6PkaEumKgPBpLsn5YvNgAzDSxLKPKUSiBhR_GUoMvuwaczazQ681z9a5mkhOZnfgz7yzgMvji3as3Px8e9I6S6sPw9oZK-O3z1yOJXEM',
    label: 'Vinmec Times City',
  },
  {
    src: 'https://www.vinmec.com/static/uploads/xlarge_4000x1470_O_cu_4fd209e27d.jpg',
    label: 'Vinmec Central Park',
  },
]

const STATS = [
  { num: '7', label: 'Bệnh viện' },
  { num: '2', label: 'Phòng khám' },
  { num: '50+', label: 'Chuyên khoa' },
  { num: 'JCI', label: 'Tiêu chuẩn' },
]

export default function Facilities() {
  const [idx, setIdx] = useState(0)
  const [animDir, setAnimDir] = useState(null)
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => goNext(), 5000)
    return () => clearInterval(t)
  }, [idx])

  const goPrev = () => { setAnimDir('right'); setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length) }
  const goNext = () => { setAnimDir('left'); setIdx((i) => (i + 1) % SLIDES.length) }

  return (
    <section ref={ref} className="py-24 px-6 lg:px-16 max-w-screen-xl mx-auto">
      {/* Header */}
      <div
        className="text-center mb-14 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)' }}
      >
        <p className="text-xs font-bold text-[#2ebfa5] uppercase tracking-widest mb-3 font-headline">
          Cơ sở vật chất
        </p>
        <h2 className="font-headline font-bold text-[#171c1f] text-2xl md:text-4xl mb-5 leading-tight">
          Hệ thống phòng khám<br className="hidden sm:block" /> và trung tâm của chúng tôi
        </h2>
        <div className="w-16 h-1 rounded-full bg-[#2ebfa5] mx-auto mb-6" />
        <p className="text-[#404751] max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Vinmec là Hệ thống Y tế tư nhân duy nhất tại Việt Nam hoạt động không vì mục tiêu lợi nhuận, với 7 bệnh viện và 2 phòng khám đa khoa đạt tiêu chuẩn JCI.
        </p>
      </div>

      {/* Stats strip */}
      <div
        className="grid grid-cols-4 gap-4 mb-10 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transitionDelay: '150ms' }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            className="text-center py-5 rounded-2xl"
            style={{ background: '#f6fafe', boxShadow: '0 2px 16px rgba(0,93,152,0.05)' }}
          >
            <p className="font-headline font-extrabold text-[#005d98] text-2xl md:text-3xl">{s.num}</p>
            <p className="text-[#707882] text-xs mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Carousel */}
      <div
        className="relative rounded-3xl overflow-hidden mb-10 transition-all duration-700"
        style={{
          boxShadow: '0 24px 64px rgba(0,93,152,0.12)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(20px)',
          transitionDelay: '250ms',
        }}
      >
        <img
          key={idx}
          src={SLIDES[idx].src}
          alt={SLIDES[idx].label}
          className="w-full aspect-video object-cover"
          style={{ animation: 'fadeIn 0.5s ease' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Slide label */}
        <div className="absolute bottom-14 left-6 text-white">
          <p className="font-headline font-bold text-lg drop-shadow-md">{SLIDES[idx].label}</p>
        </div>

        {/* Controls */}
        <button
          onClick={goPrev}
          className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={goNext}
          className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === idx ? 24 : 6, background: i === idx ? '#fff' : 'rgba(255,255,255,0.45)' }}
            />
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          className="text-white px-10 py-3 rounded-full font-bold transition-all active:scale-[0.97]"
          style={{ background: '#2ebfa5', boxShadow: '0 8px 24px rgba(46,191,165,0.30)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#26a38d'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(46,191,165,0.40)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2ebfa5'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(46,191,165,0.30)' }}
        >
          Xem thêm
        </button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0.3; } to { opacity: 1; } }`}</style>
    </section>
  )
}
