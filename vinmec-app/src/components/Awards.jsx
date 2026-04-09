import { useRef } from 'react'

const AWARDS = [
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5zKBNjH3QiwuAm6E-J13R7g6h2oBbCvFPn3F_hBEjGpW5YUDaFe2kRi77b0tJjpFDm5NL6-GlK1-Mb8KSHn9mzF-X-VBrPINmzKfBj-1KjVFMNm79Z7k0uZ-a37ZPvxFjfYdX7W_2X0UBDyKzLqyRSBV5XPWfXrSS_8KGqZ3M-1fChVWKhgFnfU1z5fwkNIVAcpqd-j7hS5-Fb_Q8ZhVKRnlSFfpMVjQz1bClZmHFAI3-E2zWxD4-pAdE2UJX78Jf1r87kP3u',
    label: 'JCI Accredited',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfHTfOEIkMpZPVRfJUxONPXegMFGCRz3d3-6K9i5V-5ICN-GK5-LWTwAFBD5lDxiupbVFNEkaCuQiAVxjX-9cDQ3bZ2B7hgaY6bJZ5q4Wf_iqHdysTQMRY-LkQB3IhsXt8YXQvlnT1UMN9PEfOUqJBpbwGtGDo-hXGhFIf8jqfSnivEqTJH3dVU7wL-UHj4Y1MXGzJpP_GiGOg3Rkp7PD0MXxQCQpRNkGCbB9HKFijiqfWdRj-WPqcEzVvUE9MkiDmhM-43kVk',
    label: 'ISO Certified',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZUvUGMNBJX3-Wd1vSVFSKZO2Jhs_7hf5jCLlsPNFPZ2jZ8fWDp1Pr9YFc9w5kS5wlV3cYD7tV97V8gR_EBH-a-BqQEIUmP6hbCJoR0PXf5QH8Bz5hbT5-Vy3eMRs2ZEqeJDwJ_iKcLcz-MXhyO0OFrKmtJOqR1hbnRLj-KlyoiHIpF0xjqiJXX38kvOIIBhHGEXb17L6kn9lxA2nRJEsXAVc9L-hzFU4a4VKYAOBf7IXFM_n9lGc0VJiXKJEDT8iBtHXDNhw',
    label: 'Safe Work Award',
  },
]

export default function Awards() {
  return (
    <section
      className="py-20 px-6 lg:px-16"
      style={{ background: 'linear-gradient(135deg, #004d80 0%, #005d98 50%, #0076c0 100%)' }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(136,243,208,0.06) 0%, transparent 50%)',
        }}
      />

      <div className="relative max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Text block */}
        <div className="text-white max-w-sm">
          <p className="text-[#88f3d0] text-xs font-bold uppercase tracking-widest mb-3 font-headline">
            Được công nhận toàn cầu
          </p>
          <h3 className="font-headline font-bold text-3xl md:text-4xl mb-4 leading-tight">
            Chứng nhận<br />& Giải thưởng
          </h3>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            Vinmec tự hào được các tổ chức uy tín trên thế giới công nhận về chất lượng dịch vụ y tế đạt chuẩn quốc tế.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 font-semibold text-sm transition-all group"
            style={{ color: '#88f3d0' }}
          >
            <span>Xem thêm</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* Award cards */}
        <div className="flex gap-4 flex-wrap justify-center">
          {AWARDS.map((award, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-2 cursor-pointer"
              style={{ transition: 'transform 0.25s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div
                className="w-28 h-28 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-2"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
              >
                <img src={award.src} alt={award.label} className="w-full h-full object-contain" />
              </div>
              <span className="text-white/60 text-[10px] font-medium">{award.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
