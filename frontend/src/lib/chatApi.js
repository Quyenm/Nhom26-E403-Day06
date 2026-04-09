const DEFAULT_API_URL = 'https://vinmec-api-windows.ngtdt204.id.vn'

const FALLBACK_ERROR_MESSAGE = 'Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại hoăc gọi hotline 1900 54 61 54.'

function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return DEFAULT_API_URL
}

export async function sendChatMessage({ message, sessionId, history = [] }) {
  const response = await fetch(`${getApiBaseUrl()}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      session_id: sessionId ?? '',
      history,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail || FALLBACK_ERROR_MESSAGE)
  }

  return data
}

export { FALLBACK_ERROR_MESSAGE }
