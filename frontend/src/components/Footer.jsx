export default function Footer() {
  return (
    <footer className="bg-[#f6fafe] border-t border-[#eaeef2] py-16 px-6 lg:px-24">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        {/* Col 1 */}
        <div>
          <h5 className="font-headline font-bold text-[#005d98] mb-5 text-sm">Hệ thống Vinmec</h5>
          <ul className="space-y-3 text-sm text-[#404751]">
            {['Tầm nhìn sứ mệnh', 'Hệ thống cơ sở y tế', 'Tìm bác sĩ', 'Làm việc tại Vinmec'].map((t) => (
              <li key={t}><a href="#" className="hover:text-[#005d98] transition-colors">{t}</a></li>
            ))}
          </ul>
        </div>

        {/* Col 2 */}
        <div>
          <h5 className="font-headline font-bold text-[#005d98] mb-5 text-sm">Dịch vụ</h5>
          <ul className="space-y-3 text-sm text-[#404751]">
            {['Chuyên khoa', 'Gói dịch vụ', 'Bảo hiểm', 'Đặt lịch hẹn'].map((t) => (
              <li key={t}><a href="#" className="hover:text-[#005d98] transition-colors">{t}</a></li>
            ))}
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h5 className="font-headline font-bold text-[#005d98] mb-5 text-sm">Tải App MyVinmec</h5>
          <div className="w-24 h-24 bg-white border border-[#eaeef2] rounded-xl flex items-center justify-center p-2">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLVROFlJlu2sRFKYXNSudwdAMojG7O8MT44KvHi9NOXctMMeobpeMQiZjrkT3FbhIdPt640G9sM2cO7mrZ2HBNTeIJjABkJSc_knHsMYcY6gG-cVfjUku3tzCaB7fB1f9pzrmMXajby_pucPUdVP_6h9jDfA4NHWeCYEjnVU7w6qOYzcN8uRZduXjk07M7hScapr5jRkWzrdaKMTobhJGiQEgmN17sbkwQ7hzNNcvSlhOv5diPAEU0jcnyHwIDJ3FlKnUya6aJ3tQ"
              alt="QR Code"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Col 4 */}
        <div>
          <h5 className="font-headline font-bold text-[#005d98] mb-5 text-sm">Theo dõi chúng tôi</h5>
          <div className="flex gap-3 mb-5">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-red-700 transition-colors text-lg">▶</div>
            <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-900 transition-colors text-sm font-bold">f</div>
          </div>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVgbQKBA0PbfdOotza0epeGhf93N4tSV31SQlN2EdYTCaKlCf0WTkIBvIWBaa0czHCqXNgo5A_lbRKDPlq2FzIuFjYvd3v_Tcwc_vD_eIfnd9zpfBdX_xXgtR1CpzKEwLeXoNBngY3s38na-gQ_jVwFggVJs6sYrziOBQv0mtGbkMaAL1VH2IQcBZtqsdMoqiTnfZuNx-SZmiwGaQWxA05AL79R9fj_fjXJMxPMfvkXO2khrjlylFJddYbVPxK8jEO8emOkEXcQoU"
            alt="BCT"
            className="h-10 object-contain"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-screen-xl mx-auto mt-12 pt-8 border-t border-[#eaeef2] flex flex-col md:flex-row justify-between items-center text-xs text-[#707882] gap-4">
        <p>© 2024 Bản quyền thuộc về Công ty Cổ phần Bệnh viện Đa khoa Quốc tế Vinmec</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#005d98] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#005d98] transition-colors">Terms of Use</a>
        </div>
      </div>
    </footer>
  )
}
