import { useEffect, useRef, useState } from 'react'

const FEATURES = [
  {
    emoji: '👨‍⚕️',
    title: 'Chuyên gia hàng đầu',
    desc: 'Vinmec quy tụ đội ngũ chuyên gia, bác sĩ, dược sĩ và điều dưỡng có trình độ chuyên môn cao, tay nghề giỏi, tận tâm và chuyên nghiệp.',
    color: '#005d98',
    bg: 'rgba(0,93,152,0.07)',
  },
  {
    emoji: '🛡️',
    title: 'Chất lượng quốc tế',
    desc: 'Hệ thống Y tế Vinmec được quản lý và vận hành dưới sự giám sát của những nhà quản lý nhiều năm kinh nghiệm, cùng phương tiện kỹ thuật hiện đại.',
    color: '#006b54',
    bg: 'rgba(0,107,84,0.07)',
  },
  {
    emoji: '💡',
    title: 'Công nghệ tiên tiến',
    desc: 'Vinmec cung cấp cơ sở vật chất hàng nhất và dịch vụ 5 sao bằng cách sử dụng các công nghệ tiên tiến nhất được quản lý bởi các bác sĩ lành nghề.',
    color: '#0076c0',
    bg: 'rgba(0,118,192,0.07)',
  },
  {
    emoji: '🔬',
    title: 'Nghiên cứu & Đổi mới',
    desc: 'Vinmec liên tục thúc đẩy y học hàn lâm dựa trên nghiên cứu có phương pháp và sự phát triển y tế được chia sẻ từ quan hệ đối tác toàn cầu.',
    color: '#2ebfa5',
    bg: 'rgba(46,191,165,0.07)',
  },
]

function useIntersection(ref, options) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, options)
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref, options])
  return visible
}

function FeatureCard({ f, delay }) {
  const ref = useRef(null)
  const visible = useIntersection(ref, { threshold: 0.15 })

  return (
    <div
      ref={ref}
      className="rounded-3xl p-6 group cursor-default transition-all duration-500"
      style={{
        background: '#f6fafe',
        boxShadow: '0 4px 24px rgba(0,93,152,0.05)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms, box-shadow 0.25s ease, background 0.25s ease`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,93,152,0.12)'
        e.currentTarget.style.background = '#fff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,93,152,0.05)'
        e.currentTarget.style.background = '#f6fafe'
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
        style={{ background: f.bg }}
      >
        {f.emoji}
      </div>
      <h4
        className="font-headline font-bold text-base mb-3"
        style={{ color: f.color }}
      >
        {f.title}
      </h4>
      <p className="text-sm text-[#404751] leading-relaxed">{f.desc}</p>
    </div>
  )
}

export default function Features() {
  const headRef = useRef(null)
  const headVisible = useIntersection(headRef, { threshold: 0.2 })

  return (
    <section className="py-24 px-6 lg:px-16 max-w-screen-xl mx-auto">
      {/* Intro */}
      <div
        ref={headRef}
        className="text-center mb-20 transition-all duration-700"
        style={{ opacity: headVisible ? 1 : 0, transform: headVisible ? 'none' : 'translateY(24px)' }}
      >
        <p className="text-xs font-bold text-[#2ebfa5] uppercase tracking-widest mb-3 font-headline">
          Giá trị cốt lõi
        </p>
        <h2
          className="font-headline font-bold text-[#005d98] mb-6 leading-tight"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}
        >
          Chăm sóc bằng tài năng,<br className="hidden sm:block" /> y đức và sự thấu cảm
        </h2>
        <a
          href="#"
          className="inline-block text-white px-8 py-2.5 rounded-full font-semibold text-sm transition-all active:scale-[0.98]"
          style={{ background: '#2ebfa5', boxShadow: '0 6px 20px rgba(46,191,165,0.30)' }}
        >
          Xem thêm
        </a>
      </div>

      {/* Why Vinmec */}
      <div className="text-center mb-12">
        <h3 className="font-headline font-bold text-[#171c1f] text-2xl md:text-3xl">
          Tại sao nên chọn Vinmec?
        </h3>
        <div className="w-12 h-1 bg-[#005d98] rounded-full mx-auto mt-4" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((f, i) => (
          <FeatureCard key={i} f={f} delay={i * 80} />
        ))}
      </div>
    </section>
  )
}
