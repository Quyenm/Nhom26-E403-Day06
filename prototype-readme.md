# Prototype — Vinmec Assistant

## Mô tả
Prototype hỗ trợ bệnh nhân chuẩn bị trước buổi khám tại Vinmec.  
Người dùng nhập nhu cầu khám hoặc câu hỏi như cần nhịn ăn không, mang giấy tờ gì, nên đặt lịch hay không, hoặc tìm cơ sở Vinmec gần nhất.  
Hệ thống trả về checklist chuẩn bị cá nhân hóa hoặc thông tin cơ sở phù hợp.

## Level: Functional prototype
- UI build bằng web frontend build bằng claude (Vite + React) của nhóm
- Backend chạy thật với chatbot flow cho các câu hỏi chuẩn bị khám tại Vinmec
- 1 flow chính chạy được: nhập nhu cầu khám / câu hỏi → nhận checklist hoặc hướng dẫn phù hợp

## Links
- Prototype: https://drive.google.com/drive/folders/1lg1c_ZvwrhfpTzzV7IHUGokSwKCbkHmx?usp=drive_link
- Video demo (backup): https://drive.google.com/file/d/19JbehCCCSpz-SR0DDlks84L6S6jaUVRT/view?usp=drive_link

## Tools
- UI: Claude + frontend web app
- Backend: LLM API + prompt system cho Vinmec Assistant, codex
- Prompt: system prompt + routing rules + checklist format cho các tình huống chuẩn bị khám phổ biến

## Phân công
| Thành viên | Phần | Output |
|-----------|------|--------|
| An | CI/CD + deploy | Docker, deployment config, deploy link |
| Hùng | UI | frontend/, UI chatbot/web |
| Dũng | Mobile | mobile/, UI mobile and mobile prototype |
| Đạt | Backend | backend/, API/chatbot flow |
| Quyền | Business logic, docs, repo setup | SPEC, Canvas, prompt, README, setup repository |

## Flow chính của prototype
1. Người dùng nhập câu hỏi hoặc nhu cầu khám
2. Hệ thống xác định loại yêu cầu:
   - chuẩn bị khám
   - tìm cơ sở Vinmec
   - hỏi quy trình khám
3. AI trả lời theo checklist hoặc thông tin phù hợp
4. Nếu câu hỏi quá mơ hồ, hệ thống hỏi lại 1 câu ngắn để làm rõ
5. Nếu ngoài phạm vi, hệ thống từ chối theo mẫu đã định

## Ghi chú
- Prototype tập trung vào **hỗ trợ logistics trước khám**, không chẩn đoán bệnh
- Chưa tích hợp hệ thống đặt lịch thực tế của Vinmec
- Chưa xử lý các tình huống cấp cứu hoặc chỉ định y khoa phức tạp