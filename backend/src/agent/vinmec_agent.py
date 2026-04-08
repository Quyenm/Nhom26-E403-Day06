"""
src/agent/vinmec_agent.py – LangGraph ReAct agent cho Vinmec chatbot.

Tools:
  RAG   : search_vinmec_preparation, get_specialty_checklist
  Web   : web_search_medical, fetch_webpage_content
  Places: find_nearest_vinmec_hospital, get_vinmec_all_locations   ← MỚI
"""
from __future__ import annotations

import logging
from typing import Annotated

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_community.chat_models import ChatLiteLLM
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from typing_extensions import TypedDict

from src.config import LLM_MODEL, LLM_API_BASE, LLM_API_KEY, LLM_TEMPERATURE, LLM_MAX_TOKENS
from src.tools.vinmec_rag import VINMEC_RAG_TOOLS
from src.tools.web_search_tool import VINMEC_WEB_TOOLS
from src.tools.hospital_finder import VINMEC_HOSPITAL_TOOLS
from src.guardrails import check as guard_check, is_blocked, GuardResult

logger = logging.getLogger(__name__)

# ── System prompt ──────────────────────────────────────────────────────────────
VINMEC_SYSTEM_PROMPT = """Bạn là **VinmecPrep AI** – trợ lý thông minh giúp bệnh nhân chuẩn bị trước buổi khám và tìm cơ sở Vinmec gần nhất.

## Nhiệm vụ chính
1. Tạo **checklist cá nhân hóa** cho bệnh nhân: nhịn ăn, giấy tờ, đặt lịch, thời gian dự kiến
2. Tìm **bệnh viện/phòng khám Vinmec gần nhất** theo địa điểm của bệnh nhân

## Quy trình sử dụng tools

### Câu hỏi chuẩn bị khám:
**Bước 1 – RAG trước:**
Dùng `search_vinmec_preparation` hoặc `get_specialty_checklist`.

**Bước 2 – Web fallback:**
Dùng `web_search_medical` khi RAG trả về "Không tìm thấy" hoặc kết quả quá chung.

**Bước 3 – Fetch chi tiết:**
Dùng `fetch_webpage_content` khi cần đọc toàn bộ trang từ vinmec.com.

### Câu hỏi tìm địa điểm Vinmec:
Dùng `find_nearest_vinmec_hospital` khi bệnh nhân hỏi:
- "Vinmec ở [tỉnh/thành] ở đâu?"
- "Bệnh viện Vinmec gần tôi nhất"
- "Tôi ở Hưng Yên có Vinmec không?"
- "Địa chỉ Vinmec Times City"
- "Đường đi đến Vinmec Central Park"

Dùng `get_vinmec_all_locations` khi hỏi:
- "Vinmec có bao nhiêu cơ sở?"
- "Danh sách tất cả bệnh viện Vinmec"

## Quy tắc trích dẫn (BẮT BUỘC)
✅ **RAG:** Ghi "theo hướng dẫn Vinmec"
✅ **Web search:** Ghi [Nguồn N] kèm domain
❌ Tuyệt đối không bịa thông tin y tế

## Format checklist chuẩn
```
📋 CHECKLIST CHUẨN BỊ KHÁM – [Chuyên khoa]

🍽️ 1. NHỊN ĂN
[thông tin cụ thể]

📄 2. GIẤY TỜ CẦN MANG
[danh sách]

📅 3. ĐẶT LỊCH
[có cần đặt không + cách đặt]

⏱️ 4. THỜI GIAN DỰ KIẾN
[ước tính]

📝 LƯU Ý ĐẶC BIỆT
[lưu ý quan trọng]
```

## Disclaimer (LUÔN thêm vào cuối mỗi checklist)
⚠️ *Thông tin mang tính tham khảo. Vui lòng gọi **1900 54 61 54** để xác nhận.*

## Ngôn ngữ
- Tiếng Việt, thân thiện, dễ hiểu cho bệnh nhân phổ thông
- Không dùng thuật ngữ y khoa chuyên sâu mà không giải thích
- Nếu bệnh nhân hỏi tiếng Anh → trả lời tiếng Anh

## Giới hạn tuyệt đối
- KHÔNG chẩn đoán bệnh
- KHÔNG tư vấn thuốc điều trị
- KHÔNG thay thế tư vấn bác sĩ
- Cấp cứu: nhắc gọi **115** ngay lập tức
- Chỉ fetch URL từ vinmec.com, moh.gov.vn, và nguồn y tế uy tín
"""

# ── Agent state ────────────────────────────────────────────────────────────────
_MAX_HISTORY_TURNS = 20

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


# ── Build graph ────────────────────────────────────────────────────────────────
def build_vinmec_agent():
    all_tools = VINMEC_RAG_TOOLS + VINMEC_WEB_TOOLS + VINMEC_HOSPITAL_TOOLS

    litellm_kwargs = dict(
        model       = LLM_MODEL,
        temperature = LLM_TEMPERATURE,
        max_tokens  = LLM_MAX_TOKENS,
    )
    if LLM_API_BASE:
        litellm_kwargs["api_base"] = LLM_API_BASE
    if LLM_API_KEY:
        litellm_kwargs["api_key"] = LLM_API_KEY

    llm = ChatLiteLLM(**litellm_kwargs)
    llm_with_tools = llm.bind_tools(all_tools)

    def call_model(state: AgentState):
        history = state["messages"]
        if len(history) > _MAX_HISTORY_TURNS * 2:
            history = history[-(_MAX_HISTORY_TURNS * 2):]

        messages = [SystemMessage(content=VINMEC_SYSTEM_PROMPT)] + history
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    graph = StateGraph(AgentState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", ToolNode(all_tools))
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition)
    graph.add_edge("tools", "agent")

    return graph.compile()


# ── Singleton ──────────────────────────────────────────────────────────────────
_agent = None

def get_agent():
    global _agent
    if _agent is None:
        _agent = build_vinmec_agent()
    return _agent


# ── High-level chat function ──────────────────────────────────────────────────
def chat(user_message: str, history: list[dict] | None = None) -> dict:
    outcome = guard_check(user_message)
    if is_blocked(outcome):
        return {
            "reply":        outcome.message,
            "blocked":      True,
            "guard_result": outcome.result.value,
        }

    lc_messages = []
    if history:
        for turn in history[-(_MAX_HISTORY_TURNS * 2):]:
            role    = turn.get("role", "user")
            content = turn.get("content", "")
            if role == "user":
                lc_messages.append(HumanMessage(content=content))
            else:
                lc_messages.append(AIMessage(content=content))

    pii_prefix = ""
    if outcome.result == GuardResult.PII_WARN and outcome.message:
        pii_prefix = outcome.message

    lc_messages.append(HumanMessage(content=user_message))

    agent  = get_agent()
    result = agent.invoke({"messages": lc_messages})
    reply  = result["messages"][-1].content

    if pii_prefix:
        reply = pii_prefix + reply

    return {
        "reply":        reply,
        "blocked":      False,
        "guard_result": outcome.result.value,
    }
