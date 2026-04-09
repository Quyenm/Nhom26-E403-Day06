# SPEC — Nhom26-E403

**Nhóm:** Nhom26-E403  
**Track:** Vinmec

**Problem statement (1 câu):**  
Bệnh nhân đến Vinmec thường không biết cần chuẩn bị gì trước buổi khám, hiện phải gọi tổng đài hoặc tự tìm thông tin rời rạc trên website, mất thời gian và dễ thiếu sót; AI có thể hỏi ngắn gọn về nhu cầu khám và tạo checklist cá nhân hóa để giúp bệnh nhân chuẩn bị đúng ngay từ đầu.

---

## 1. AI Product Canvas

| Value | Trust | Feasibility |
|---|---|---|
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | **User:** bệnh nhân mới, bệnh nhân tái khám, người nhà đi khám hộ tại Vinmec. **Pain:** không biết có cần nhịn ăn không, cần mang giấy tờ gì, nên đặt lịch trước hay đến trực tiếp, cần đến sớm bao lâu. Hậu quả là mất công đi lại, phải xét nghiệm lại, chờ lâu hoặc lỡ lịch. **AI giải:** chatbot hỏi 2–3 câu ngắn về lý do khám, loại dịch vụ và tình trạng đặt lịch, sau đó sinh **checklist cá nhân hóa trước khám** gồm: nhịn ăn/không, giấy tờ cần mang, khuyến nghị đặt lịch, thời gian nên có mặt, lưu ý thêm nếu là lần đầu đến khám. | **Rủi ro khi AI sai:** nếu AI báo sai việc nhịn ăn hoặc thiếu giấy tờ cần thiết, bệnh nhân có thể có trải nghiệm tệ hoặc phải làm lại quy trình. **Cách user nhận biết:** checklist luôn hiển thị theo từng mục rõ ràng, có nhãn “khuyến nghị AI”, kèm nút “Thông tin này chưa đúng”. **Cách sửa:** user chọn lại phương án đúng hoặc bấm gọi hotline/lễ tân để xác nhận. **Cơ chế trust:** không đưa chẩn đoán, chỉ hỗ trợ logistics chuẩn bị; luôn có disclaimer “Thông tin mang tính hỗ trợ, vui lòng xác nhận với Vinmec nếu trường hợp đặc biệt.” | Bài toán phù hợp để làm **rule-based + AI hỏi đáp đầu vào**, nên khả thi hơn các bài toán y khoa chuyên sâu. **Cost:** được tính theo token thay vì cố định theo request. Với flow ngắn gồm 2–3 câu hỏi và một checklist đầu ra, chi phí ước tính khoảng **$0.0003–0.001/lượt** tùy số token sử dụng. **Latency:** mục tiêu <3 giây/lượt. **Risk chính:** user mô tả quá mơ hồ (“khám tổng quát”), bệnh nền đặc biệt cần hướng dẫn riêng, AI suy diễn quá mức ngoài phạm vi chuẩn bị trước khám. |

**Automation hay augmentation?** ☑ **Augmentation**  
**Justify:** AI chỉ đóng vai trò **gợi ý checklist**, bệnh nhân vẫn là người xác nhận và quyết định cuối cùng; cost of reject gần như bằng 0 vì user có thể bỏ qua hoặc sửa ngay.

### Learning signal

**User correction đi vào đâu?**  
Đi vào **correction log** gồm:

- loại khám user chọn ban đầu
- checklist AI sinh ra
- mục nào bị user sửa
- user bấm “chưa đúng” ở mục nào
- trường hợp nào bị chuyển sang hotline/lễ tân

**Product thu signal gì để biết tốt lên hay tệ đi?**

- Tỷ lệ user **chấp nhận checklist không sửa**
- Tỷ lệ checklist bị sửa ở từng mục: nhịn ăn / giấy tờ / đặt lịch / thời gian đến
- Tỷ lệ user bấm **“không chắc / cần xác nhận thêm”**
- Tỷ lệ bệnh nhân phản ánh **thiếu thông tin khi đến khám**
- Tỷ lệ chuyển sang hotline vì AI không đủ chắc chắn

**Data thuộc loại nào?**  
☑ User-specific  
☑ Domain-specific  
☑ Human-judgment  
☑ Khác: operational workflow data

**Có marginal value không?**  
Có. Model chung có thể biết “xét nghiệm máu thường cần nhịn ăn”, nhưng **quy trình chuẩn bị thực tế theo từng loại dịch vụ và vận hành của Vinmec** là dữ liệu có giá trị riêng theo domain. User correction cũng tạo ra tín hiệu rất hữu ích vì nó bám sát context bệnh viện cụ thể.

---

## 2. User Stories — 4 paths

### Feature 1: AI Pre-Visit Checklist Generator

**Trigger:**  
User mở chatbot hỗ trợ trước khám → nhập lý do khám / chọn loại dịch vụ → AI hỏi bổ sung 2–3 câu → AI tạo checklist cá nhân hóa.

| Path | Câu hỏi thiết kế | Mô tả |
|---|---|---|
| **Happy — AI đúng, tự tin** | User thấy gì? Flow kết thúc ra sao? | Bệnh nhân chọn “xét nghiệm máu tổng quát”, AI hỏi thêm “đã có lịch hẹn chưa?” và “đây có phải lần đầu đến Vinmec không?”, sau đó trả ra checklist: nhịn ăn 8 tiếng, mang CCCD/BHYT nếu có, nên đặt lịch trước, đến sớm 15 phút. User thấy hợp lý, bấm “Đã hiểu” và lưu checklist. |
| **Low-confidence — AI không chắc** | System báo “không chắc” bằng cách nào? User quyết thế nào? | Khi user nhập mô tả mơ hồ như “khám tổng quát xem sức khỏe”, AI hiện trạng thái: “Mình chưa chắc loại dịch vụ cụ thể” và đưa ra 2–3 lựa chọn như khám tổng quát, xét nghiệm máu, khám chuyên khoa. User chọn lại 1 phương án để AI sinh checklist chính xác hơn. |
| **Failure — AI sai** | User biết AI sai bằng cách nào? Recover ra sao? | AI không báo nhịn ăn trong khi dịch vụ thực tế có xét nghiệm cần nhịn ăn. User phát hiện vì đã từng đi khám hoặc thấy khác với thông tin trên website/hotline. User bấm “Thông tin chưa đúng”, chọn mục sai và xem ngay khuyến nghị gọi hotline để xác nhận. |
| **Correction — user sửa** | User sửa bằng cách nào? Data đó đi vào đâu? | User sửa checklist bằng cách bấm vào từng mục như “Có cần nhịn ăn không?” → chọn lại “Có”. Hệ thống lưu correction log theo loại khám, nội dung AI trả lời, và mục bị sửa để cập nhật mapping/rule ở phiên bản sau. |

---

### Feature 2: Triage to Human Support / Fallback

**Trigger:**  
AI phát hiện user thuộc trường hợp mơ hồ, đặc biệt hoặc ngoài phạm vi v1.

| Path | Câu hỏi thiết kế | Mô tả |
|---|---|---|
| **Happy — AI đúng, tự tin** | User thấy gì? | Nếu user chỉ hỏi các trường hợp phổ biến, AI không cần fallback, chỉ hiện checklist. |
| **Low-confidence — AI không chắc** | Báo sao cho user hiểu? | AI hiện thông báo: “Trường hợp này có thể cần xác nhận trực tiếp với Vinmec vì mỗi chỉ định có thể khác nhau.” Kèm nút hotline / quầy hỗ trợ. |
| **Failure — AI sai** | Điều gì nguy hiểm nhất? | AI vẫn cố trả lời cụ thể trong trường hợp cần con người xử lý, khiến user tin vào hướng dẫn chưa an toàn. Đây là failure nghiêm trọng nhất vì user có thể không biết mình đang nhận thông tin sai. |
| **Correction — user sửa** | Hệ thống học gì? | Nếu user liên tục chọn “Tôi muốn gặp nhân viên hỗ trợ” ở một nhóm câu hỏi nhất định, hệ thống học rằng nhóm đó nên được fallback sớm hơn thay vì cố sinh checklist. |

---

## 3. Eval metrics + threshold

**Optimize:** ☑ **Precision**

**Tại sao?**  
Với bài toán này, **trả lời sai nhưng trông có vẻ đúng** nguy hiểm hơn là trả lời thiếu. Nếu AI không chắc và yêu cầu user xác nhận thêm thì vẫn chấp nhận được; nhưng nếu AI tự tin đưa checklist sai, trải nghiệm và độ tin cậy sẽ giảm mạnh.

**Nếu sai ngược lại thì chuyện gì xảy ra?**  
Nếu tối ưu recall quá mức, AI có thể cố trả lời nhiều trường hợp dù chưa đủ chắc chắn, dẫn tới tăng lỗi sai trong các mục quan trọng như nhịn ăn, giấy tờ, thời gian đến.

| Metric | Threshold | Red flag (dừng khi) |
|---|---|---|
| Checklist correctness trên bộ test scenario | ≥ 90% | < 75% trong 1 tuần test |
| Precision ở mục “nhịn ăn / không nhịn ăn” | ≥ 95% | < 85% |
| Tỷ lệ fallback đúng ở case mơ hồ | ≥ 80% | < 60% |
| Tỷ lệ user chấp nhận checklist không sửa | ≥ 70% | < 50% |
| Tỷ lệ correction ở mục critical | ≤ 10% | > 20% |
| Latency phản hồi | < 3 giây | > 5 giây ổn định |

---

## 4. Top 3 failure modes

| # | Trigger | Hậu quả | Mitigation |
|---|---|---|---|
| 1 | User mô tả quá mơ hồ, ví dụ “khám tổng quát” mà không rõ có xét nghiệm gì | Checklist quá chung chung hoặc sai trọng tâm, user không nhận được hướng dẫn hữu ích | Hỏi lại 1–2 câu làm rõ; nếu vẫn mơ hồ thì fallback sang hotline / nhân viên |
| 2 | AI suy diễn quá mức từ từ khóa y tế và trả lời như tư vấn y khoa | User hiểu nhầm đây là chỉ định chuyên môn, tăng risk trust và safety | Giới hạn phạm vi rõ: chỉ hỗ trợ chuẩn bị logistics; chặn các câu trả lời mang tính chẩn đoán; thêm disclaimer cố định |
| 3 | Mapping rule không cập nhật theo quy trình thực tế của bệnh viện | Checklist lỗi thời, ví dụ giấy tờ hoặc quy trình tiếp đón thay đổi | Dùng domain review định kỳ, log correction, chỉ triển khai với tập dịch vụ phổ biến trước rồi mở rộng dần |

**Failure mode nguy hiểm nhất:**  
Failure số 2, vì đây là kiểu **user có thể không biết AI đang sai**. Khi AI trả lời quá tự tin trong ngữ cảnh y tế, user dễ tin mà không kiểm tra lại.

---

## 5. ROI — 3 kịch bản

|  | Conservative | Realistic | Optimistic |
|---|---|---|---|
| **Assumption** | 100 user/ngày, 50% hoàn tất flow, 60% thấy hữu ích | 500 user/ngày, 70% hoàn tất flow, 80% thấy hữu ích | 2000 user/ngày, 75% hoàn tất flow, 90% thấy hữu ích |
| **Cost** | ~$0.03–0.10/ngày inference + chi phí vận hành thử nghiệm | ~$0.15–0.50/ngày inference | ~$0.60–2.00/ngày inference |
| **Benefit** | Giảm 1–2 giờ hỗ trợ lặp lại/ngày, giảm một phần cuộc gọi hỏi thông tin cơ bản | Giảm 6–8 giờ hỗ trợ/ngày, giảm tắc nghẽn hỏi đáp trước khám, tăng trải nghiệm đầu vào | Giảm 20+ giờ hỗ trợ/ngày, giảm miss-preparation rate, tăng hài lòng và tỉ lệ quay lại |
| **Net** | Dương nhẹ nếu triển khai nội bộ nhỏ | Dương rõ rệt, đáng pilot | Rất tốt nếu tích hợp chính thức vào hành trình trước khám |

**Kill criteria:**  
Nên dừng hoặc pivot nếu:

- cost > benefit trong 2 tháng liên tục
- correction rate ở mục critical không giảm sau nhiều vòng tuning
- user trust thấp, nhiều người vẫn bỏ qua checklist để gọi hotline ngay
- bài toán chỉ tiết kiệm rất ít effort so với việc dùng FAQ tĩnh

---

## 6. Mini AI spec (1 trang)

Sản phẩm đề xuất là một **AI assistant hỗ trợ chuẩn bị trước buổi khám tại Vinmec**. Đối tượng chính là bệnh nhân mới, bệnh nhân tái khám và người nhà đi khám hộ, những người thường không chắc mình cần chuẩn bị gì trước khi đến bệnh viện. Hiện tại họ phải tự tìm kiếm trên website hoặc gọi tổng đài, vừa mất thời gian vừa dễ thiếu sót. Vấn đề này đặc biệt rõ ở các tình huống như không biết có cần nhịn ăn trước xét nghiệm hay không, không rõ cần mang giấy tờ gì, hoặc không biết nên đặt lịch trước hay đến trực tiếp.

AI trong sản phẩm này không làm chẩn đoán hay tư vấn y khoa. Vai trò của AI là **augmentation**, tức là hỗ trợ sinh ra **checklist cá nhân hóa trước khám** sau khi hỏi người dùng một vài câu ngắn như lý do khám, loại dịch vụ, đã đặt lịch hay chưa, và đây có phải lần đầu đến Vinmec hay không. Checklist đầu ra tập trung vào các mục logistics: có cần nhịn ăn không, cần mang giấy tờ gì, nên đặt lịch trước hay không, và nên đến sớm bao lâu. Đây là một phạm vi hẹp, rõ ràng và thực tế hơn nhiều so với việc xây chatbot y khoa tổng quát.

Về chất lượng, sản phẩm nên ưu tiên **precision** hơn recall. Lý do là trong ngữ cảnh y tế, một câu trả lời sai nhưng nghe có vẻ hợp lý sẽ nguy hiểm hơn một câu trả lời thiếu nhưng biết tự nhận là không chắc. Vì vậy hệ thống cần có cơ chế low-confidence rõ ràng: nếu thông tin đầu vào quá mơ hồ hoặc rơi vào trường hợp đặc biệt, AI phải hỏi thêm hoặc chuyển người dùng sang hotline/lễ tân thay vì cố trả lời. Chỉ số quan trọng nhất là độ đúng của checklist trên các kịch bản khám phổ biến, đặc biệt là các mục critical như “có cần nhịn ăn hay không”.

Rủi ro chính của sản phẩm là AI suy diễn quá mức, trả lời vượt ra ngoài phạm vi chuẩn bị trước khám, hoặc áp dụng checklist không phù hợp cho các trường hợp đặc biệt. Để giảm rủi ro, hệ thống cần giới hạn domain, chỉ hỗ trợ các tình huống phổ biến và luôn hiển thị disclaimer rằng đây là công cụ hỗ trợ thông tin, không thay thế tư vấn từ Vinmec. Ngoài ra, các trường hợp mơ hồ phải có fallback sang kênh hỗ trợ con người.

Data flywheel của sản phẩm đến từ **user correction** và **feedback sau buổi khám**. Khi người dùng sửa một mục trong checklist hoặc báo “thông tin chưa đúng”, hệ thống ghi nhận correction log theo từng loại khám và từng mục lỗi. Các tín hiệu này giúp đội ngũ cập nhật rule mapping hoặc tinh chỉnh prompt/routing để tăng độ chính xác theo thời gian. Giá trị của dữ liệu này nằm ở chỗ nó gắn với **quy trình thực tế của Vinmec**, tức là domain-specific và có marginal value cao hơn kiến thức chung của model nền.

Trong phiên bản đầu, sản phẩm không cần tích hợp đặt lịch thật hay kết nối EMR/HIS. Chỉ cần một chatbot prototype có khả năng hỏi ngắn, suy ra nhóm nhu cầu khám phổ biến, và trả về checklist rõ ràng, dễ kiểm chứng là đã đủ để chứng minh value.
