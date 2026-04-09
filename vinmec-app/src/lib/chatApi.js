const DEFAULT_CHAT_API_URL = 'https://vinmec-api.ngtdt204.id.vn/chat'

export const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL?.trim() || DEFAULT_CHAT_API_URL

const FALLBACK_ERROR_MESSAGE =
  'Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại hoăc gọi hotline 1900 54 61 54.'

function isChatResponse(data) {
  return (
    data &&
    typeof data.reply === 'string' &&
    typeof data.session_id === 'string' &&
    typeof data.blocked === 'boolean' &&
    typeof data.guard_result === 'string'
  )
}

export async function sendChatMessage({ message, sessionId }) {
  let response

  try {
    response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId ?? '',
        history: [],
      }),
    })
  } catch {
    throw new Error(FALLBACK_ERROR_MESSAGE)
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new Error(FALLBACK_ERROR_MESSAGE)
  }

  if (!response.ok || !isChatResponse(data)) {
    throw new Error(
      typeof data?.detail === 'string' ? data.detail : FALLBACK_ERROR_MESSAGE,
    )
  }

  return data
}

export { FALLBACK_ERROR_MESSAGE }
