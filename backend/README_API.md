# VinmecPrep AI - Backend API Guide

Tai lieu nay dung cho backend-only (khong frontend).

## Base URL
- API: `http://localhost:8000`
- Content-Type: `application/json`

## Endpoints

### 1) Health check
- Method: `GET`
- URL: `http://localhost:8000/health`

Response:
```json
{
  "status": "ok",
  "redis": true
}
```

### 2) Chat
- Method: `POST`
- URL: `http://localhost:8000/chat`

Request body:
```json
{
  "message": "Xet nghiem mau tong quat can nhin an khong?",
  "session_id": "",
  "history": []
}
```

Response body:
```json
{
  "reply": "Thong thuong xet nghiem mau tong quat nen nhin an 8-12 gio...",
  "session_id": "8935cba4-9721-4d0f-a2e6-df0a256bd7ae",
  "blocked": false,
  "guard_result": "pass"
}
```

Field note:
- `message`: bat buoc, max 2000 ky tu
- `session_id`: de trong o lan dau, cac lan sau gui lai de giu ngu canh
- `history`: tuy chon, thuong de `[]` de backend dung Redis

## Loi thuong gap
- `422`: sai schema request
- `429`: vuot rate limit
- `500`: loi noi bo

Error format:
```json
{
  "detail": "Noi dung loi"
}
```

## Huong dan dung Postman

### A. Tao Environment
1. Mo Postman -> `Environments` -> `New`.
2. Tao bien:
   - `base_url` = `http://localhost:8000`
   - `session_id` = (de trong)
3. Save.

### B. Request 1 - Health
1. Tao request moi: `GET {{base_url}}/health`
2. Bam `Send`.
3. Ky vong `200 OK` va JSON co `status: ok`.

### C. Request 2 - Chat lan dau
1. Tao request moi: `POST {{base_url}}/chat`
2. Tab `Headers`:
   - `Content-Type: application/json`
3. Tab `Body` -> `raw` -> `JSON`:
```json
{
  "message": "Xet nghiem mau tong quat can nhin an khong?",
  "session_id": "",
  "history": []
}
```
4. Bam `Send`.
5. Copy gia tri `session_id` trong response.
6. Paste vao bien environment `session_id`.

### D. Request 3 - Chat tiep theo giu context
Gui body:
```json
{
  "message": "Toi can mang giay to gi?",
  "session_id": "{{session_id}}",
  "history": []
}
```

## Chay backend-only stack
```bash
docker compose up -d --build
```

Neu truoc do ban dang chay stack co frontend/nginx cu, dung:
```bash
docker compose down --remove-orphans
docker compose up -d --build
```

## Nhanh gon de test bang curl
```bash
curl -X GET http://localhost:8000/health

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xet nghiem mau tong quat can nhin an khong?","session_id":"","history":[]}'
```
