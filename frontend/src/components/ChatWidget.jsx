import { useState, useRef, useEffect } from 'react'
import {
  X,
  Plus,
  Send,
  MessageCircle,
  Headphones,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import { FALLBACK_ERROR_MESSAGE, sendChatMessage } from '../lib/chatApi'

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    text: 'Xin chào! Tôi là trợ lý ảo Vinmec. Tôi có thể giúp gì cho bạn hôm nay?',
    time: '14:02',
  },
]

const CHIPS = ['Đặt lịch khám', 'Tra cứu kết quả', 'Tư vấn sức khỏe']

function getTime() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toSafeUrl(url) {
  const trimmed = url.trim()

  try {
    const parsed = new URL(trimmed)
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return trimmed
    }
  } catch {
    return null
  }

  return null
}

function formatInlineMarkdown(text) {
  const linkTokens = []

  const withLinkTokens = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, label, url) => {
      const safeUrl = toSafeUrl(url)
      if (!safeUrl) {
        return escapeHtml(`[${label}](${url})`)
      }

      const token = `__LINK_${linkTokens.length}__`
      linkTokens.push({
        token,
        html: `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(label)}</a>`,
      })
      return token
    }
  )

  let formatted = escapeHtml(withLinkTokens)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')

  for (const { token, html } of linkTokens) {
    formatted = formatted.replace(token, html)
  }

  return formatted
}

function renderSimpleMarkdown(text) {
  const lines = text.split('\n')
  const html = []
  let listType = null

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      closeList()
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line)) {
      closeList()
      html.push('<hr />')
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeList()
      const level = Math.min(headingMatch[1].length, 6)
      html.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (orderedMatch) {
      if (listType !== 'ol') {
        closeList()
        listType = 'ol'
        html.push('<ol>')
      }
      html.push(`<li>${formatInlineMarkdown(orderedMatch[2])}</li>`)
      continue
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/)
    if (unorderedMatch) {
      if (listType !== 'ul') {
        closeList()
        listType = 'ul'
        html.push('<ul>')
      }
      html.push(`<li>${formatInlineMarkdown(unorderedMatch[1])}</li>`)
      continue
    }

    closeList()
    html.push(`<p>${formatInlineMarkdown(line)}</p>`)
  }

  closeList()
  return html.join('')
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [sessionId, setSessionId] = useState(null)
  const [feedbackByMessageId, setFeedbackByMessageId] = useState({})
  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chipsVisible, setChipsVisible] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return
    const userMsg = { id: Date.now(), role: 'user', text: text.trim(), time: getTime() }
    setMessages((prev) => [...prev, userMsg])
    setInputVal('')
    setChipsVisible(false)
    setIsTyping(true)

    try {
      const data = await sendChatMessage({
        message: text.trim(),
        sessionId,
      })

      setSessionId(data.session_id)

      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: data.reply,
        time: getTime(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE,
        time: getTime(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputVal)
    }
  }

  const setFeedback = (messageId, value) => {
    setFeedbackByMessageId((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === value ? null : value,
    }))
  }

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 12px 32px rgba(0,118,192,0.3); }
          50%       { box-shadow: 0 12px 48px rgba(0,118,192,0.5); }
        }
        .msg-enter { animation: fadeSlideUp 0.3s ease forwards; }
        .chat-enter { animation: scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .fab-pulse:not(.open) { animation: fabPulse 2.5s ease-in-out infinite; }
        .chat-markdown p,
        .chat-markdown ul,
        .chat-markdown ol,
        .chat-markdown h1,
        .chat-markdown h2,
        .chat-markdown h3,
        .chat-markdown h4,
        .chat-markdown h5,
        .chat-markdown h6 {
          margin: 0;
        }
        .chat-markdown p + p,
        .chat-markdown p + ul,
        .chat-markdown p + ol,
        .chat-markdown ul + p,
        .chat-markdown ol + p,
        .chat-markdown hr + h1,
        .chat-markdown hr + h2,
        .chat-markdown hr + h3,
        .chat-markdown hr + h4,
        .chat-markdown hr + h5,
        .chat-markdown hr + h6,
        .chat-markdown hr + p,
        .chat-markdown hr + ul,
        .chat-markdown hr + ol,
        .chat-markdown h1 + p,
        .chat-markdown h2 + p,
        .chat-markdown h3 + p,
        .chat-markdown h4 + p,
        .chat-markdown h5 + p,
        .chat-markdown h6 + p,
        .chat-markdown h1 + ul,
        .chat-markdown h2 + ul,
        .chat-markdown h3 + ul,
        .chat-markdown h4 + ul,
        .chat-markdown h5 + ul,
        .chat-markdown h6 + ul,
        .chat-markdown h1 + ol,
        .chat-markdown h2 + ol,
        .chat-markdown h3 + ol,
        .chat-markdown h4 + ol,
        .chat-markdown h5 + ol,
        .chat-markdown h6 + ol {
          margin-top: 0.55rem;
        }
        .chat-markdown ul,
        .chat-markdown ol {
          padding-left: 1.1rem;
        }
        .chat-markdown li + li {
          margin-top: 0.3rem;
        }
        .chat-markdown h1,
        .chat-markdown h2,
        .chat-markdown h3,
        .chat-markdown h4,
        .chat-markdown h5,
        .chat-markdown h6 {
          color: #171c1f;
          font-weight: 700;
          line-height: 1.4;
        }
        .chat-markdown h1 { font-size: 1.125rem; }
        .chat-markdown h2 { font-size: 1.05rem; }
        .chat-markdown h3 { font-size: 1rem; }
        .chat-markdown hr {
          margin: 0.75rem 0;
          border: 0;
          border-top: 1px solid rgba(192,199,211,0.8);
        }
        .chat-markdown code {
          padding: 0.12rem 0.35rem;
          border-radius: 0.35rem;
          background: rgba(0, 93, 152, 0.08);
          color: #005d98;
          font-size: 0.9em;
        }
        .chat-markdown a {
          color: #005d98;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 0.12em;
          word-break: break-word;
        }
        .chat-markdown a:hover {
          color: #0076c0;
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        {/* Chat window */}
        {isOpen && (
          <div
            className="chat-enter w-[370px] bg-white rounded-3xl flex flex-col overflow-hidden"
            style={{ height: 560, boxShadow: '0 12px 48px rgba(0,93,152,0.18)' }}
          >
            {/* Header */}
            <header
              className="flex-shrink-0 h-[72px] px-5 flex items-center justify-between"
              style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(192,199,211,0.2)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-[#005d98]/10 flex items-center justify-center">
                    <Headphones size={18} className="text-[#005d98]" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#006b54] border-2 border-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-[#171c1f] text-sm leading-tight">
                    Hỗ trợ khách hàng
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#006b54]" />
                    <span className="text-[10px] text-[#006b54] font-bold uppercase tracking-wider">
                      Đang hoạt động
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#f0f4f8] rounded-full px-2 py-1">
                  <Sparkles size={10} className="text-[#005d98]" />
                  <span className="text-[9px] text-[#005d98] font-bold uppercase tracking-wider">AI</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#707882] hover:text-[#171c1f] transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f0f4f8]"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {/* Messages thread */}
            <div
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4 hide-scrollbar"
              style={{ background: '#f6fafe' }}
            >
              {messages.map((msg, i) =>
                msg.role === 'ai' ? (
                  <div key={msg.id} className="flex flex-col gap-1 msg-enter" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div
                      className="bg-white rounded-2xl rounded-tl-md p-3.5 relative max-w-[88%]"
                      style={{
                        boxShadow: '0 2px 12px rgba(0,93,152,0.06)',
                        border: '1px solid rgba(192,199,211,0.15)',
                      }}
                    >
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-[#005d98]" />
                      <div
                        className="chat-markdown text-sm text-[#404751] leading-relaxed pl-3"
                        dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(msg.text) }}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1 pr-1">
                      <button
                        type="button"
                        aria-label="Thích phản hồi này"
                        onClick={() => setFeedback(msg.id, 'like')}
                        className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
                        style={{
                          borderColor:
                            feedbackByMessageId[msg.id] === 'like' ? '#005d98' : 'rgba(192,199,211,0.5)',
                          background:
                            feedbackByMessageId[msg.id] === 'like' ? 'rgba(0,93,152,0.10)' : 'white',
                          color: feedbackByMessageId[msg.id] === 'like' ? '#005d98' : '#707882',
                        }}
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Không thích phản hồi này"
                        onClick={() => setFeedback(msg.id, 'dislike')}
                        className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
                        style={{
                          borderColor:
                            feedbackByMessageId[msg.id] === 'dislike' ? '#b54708' : 'rgba(192,199,211,0.5)',
                          background:
                            feedbackByMessageId[msg.id] === 'dislike' ? 'rgba(245,124,0,0.12)' : 'white',
                          color: feedbackByMessageId[msg.id] === 'dislike' ? '#b54708' : '#707882',
                        }}
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </div>
                    <span className="text-[10px] text-[#707882] ml-3">{msg.time}</span>
                  </div>
                ) : (
                  <div key={msg.id} className="flex flex-col items-end gap-1 msg-enter">
                    <div
                      className="rounded-2xl rounded-tr-md p-3.5 max-w-[88%]"
                      style={{ background: 'linear-gradient(135deg, #005d98, #0076c0)' }}
                    >
                      <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-[#707882] mr-2">{msg.time}</span>
                  </div>
                )
              )}

              {/* Quick-reply chips */}
              {chipsVisible && (
                <div className="flex flex-wrap gap-2 pt-1 msg-enter">
                  {CHIPS.map((chip, i) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80 active:scale-[0.97] ${
                        i === 0
                          ? 'bg-[#88f3d0] text-[#002117]'
                          : 'bg-[#eaeef2] text-[#404751] hover:bg-[#dfe3e7]'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 ml-3 msg-enter">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#005d98]"
                      style={{
                        animation: 'typingBounce 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="flex-shrink-0 p-4"
              style={{ background: 'white', borderTop: '1px solid rgba(192,199,211,0.15)' }}
            >
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2 transition-all duration-200"
                style={{ background: '#f0f4f8' }}
              >
                <button className="text-[#707882] hover:text-[#005d98] transition-colors flex-shrink-0">
                  <Plus size={18} />
                </button>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[#171c1f] placeholder:text-[#707882]"
                />
                <button
                  onClick={() => sendMessage(inputVal)}
                  disabled={!inputVal.trim() || isTyping}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all duration-200 active:scale-95 disabled:opacity-40"
                  style={{
                    background: inputVal.trim() && !isTyping
                      ? 'linear-gradient(135deg, #005d98, #0076c0)'
                      : '#c0c7d3',
                  }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          className={`fab-pulse ${isOpen ? 'open' : ''} w-16 h-16 rounded-full text-white flex items-center justify-center transition-all duration-200 active:scale-95`}
          style={{ background: 'linear-gradient(135deg, #005d98, #0076c0)' }}
        >
          <div
            style={{
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
              transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
            }}
          >
            {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
          </div>
        </button>
      </div>
    </>
  )
}
