# Vinmec App

`vinmec-app` is the React + Vite frontend for the Vinmec landing page and embedded AI chat widget.

## Features

- Marketing website sections for Vinmec services and brand content.
- Floating chat widget connected to the hosted Vinmec agent backend.
- In-memory chat session handling: refreshing the page starts a new conversation.
- Like/dislike feedback buttons under each bot response.

## Tech stack

- React
- Vite
- Tailwind CSS
- Lucide React

## Local development

1. Create a local env file:
   ```bash
   cp .env.example .env.local
   ```
2. Confirm the chat API URL in `.env.local`:
   ```env
   VITE_CHAT_API_URL=https://vinmec-api.ngtdt204.id.vn/chat
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open the local app:
   `http://localhost:5174/`

## Available scripts

- `npm run dev`: start the Vite development server
- `npm run build`: create a production build
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint

## Chat API contract

The chat widget sends `POST` requests to the configured backend URL.

Request body:

```json
{
  "message": "Tôi cần chuẩn bị gì trước khi khám tim mạch?",
  "session_id": "",
  "history": []
}
```

Expected response body:

```json
{
  "reply": "...",
  "session_id": "uuid",
  "blocked": false,
  "guard_result": "pass"
}
```

## Current integration behavior

- The frontend uses `VITE_CHAT_API_URL` instead of calling any browser-side LLM provider.
- The current default backend endpoint is `https://vinmec-api.ngtdt204.id.vn/chat`.
- `session_id` is stored only in React state.
- Quick-reply chips send normal chat requests to the backend.
- Feedback buttons are UI-only for now and are not sent to the backend.

## Project structure

- `src/App.jsx`: page composition
- `src/components/ChatWidget.jsx`: floating chat widget UI and feedback buttons
- `src/lib/chatApi.js`: backend chat client

## Notes

- If you deploy the frontend to another environment, set `VITE_CHAT_API_URL` for that environment.
- If the backend later tightens CORS, add the frontend origin there as an allowed origin.
