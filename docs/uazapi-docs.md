# UazAPI — Documentação de Referência

> API Premium para WhatsApp (v2.0)
> Docs oficiais: https://docs.uazapi.com/
> Postman v2.0: https://www.postman.com/augustofcs/uazapi-v2/documentation/dhsg7sc/uazapigo-whatsapp-api-v2-0

---

## URL Base

```
https://{subdomain}.uazapi.com
```

Exemplos:
- `https://free.uazapi.com` (conta free)
- `https://suaempresa.uazapi.com` (domínio customizado)

---

## Autenticação

### Headers obrigatórios
```
Authorization: Bearer {instanceToken}
Content-Type: application/json
```

### Tipos de token

| Token | Uso |
|-------|-----|
| **Admin Token** | Criar/listar instâncias e operações administrativas |
| **Instance Token** | Enviar mensagens e operações da instância |

---

## Instâncias WhatsApp

### Criar instância
```
POST /instances
Authorization: Bearer {adminToken}

{
  "instanceName": "minha-instancia",
  "phoneName": "Meu WhatsApp"
}
```

Resposta:
```json
{
  "instanceId": "inst-123",
  "instanceName": "minha-instancia",
  "instanceToken": "token-xxxx-yyyy-zzzz",
  "qrCode": "https://...",
  "status": "disconnected"
}
```

### Gerar QR Code
```
GET /instances/{instanceId}/qrcode
Authorization: Bearer {instanceToken}
```

Resposta:
```json
{
  "qrCode": "data:image/png;base64,...",
  "expiresIn": 30
}
```

### Listar instâncias
```
GET /instances
Authorization: Bearer {adminToken}
```

### Desconectar instância
```
POST /instances/{instanceId}/disconnect
Authorization: Bearer {instanceToken}
```

---

## Envio de Mensagens

### Texto
```
POST /send/text
Authorization: Bearer {instanceToken}

{
  "phone": "5511999999999",
  "message": "Sua mensagem aqui"
}
```

### Áudio
```
POST /send/audio
Authorization: Bearer {instanceToken}

{
  "phone": "5511999999999",
  "url": "https://exemplo.com/audio.mp3"
}
```

Formatos suportados: MP3, OGG, WAV

### Imagem
```
POST /send/image
Authorization: Bearer {instanceToken}

{
  "phone": "5511999999999",
  "url": "https://exemplo.com/imagem.jpg",
  "caption": "Descrição opcional"
}
```

### Documento
```
POST /send/document
Authorization: Bearer {instanceToken}

{
  "phone": "5511999999999",
  "url": "https://exemplo.com/doc.pdf",
  "filename": "doc.pdf"
}
```

### Vídeo
```
POST /send/video
Authorization: Bearer {instanceToken}

{
  "phone": "5511999999999",
  "url": "https://exemplo.com/video.mp4",
  "caption": "Descrição opcional"
}
```

---

## Histórico de Mensagens

### Buscar mensagens de um chat
```
GET /chats/{phoneNumber}/messages?limit=50&offset=0&order=desc
Authorization: Bearer {instanceToken}
```

Resposta:
```json
{
  "messages": [
    {
      "id": "msg-123",
      "from": "5511999999999",
      "body": "Olá!",
      "type": "text",
      "timestamp": 1640995200,
      "isFromMe": false
    }
  ],
  "total": 150,
  "hasMore": true
}
```

Tipos de mensagem: `text`, `image`, `document`, `audio`, `video`, `location`, `contact`

---

## Webhook

### Configurar webhook
```
POST /webhooks/config
Authorization: Bearer {instanceToken}

{
  "url": "https://seu-dominio.com/webhook",
  "events": [
    "message.received",
    "message.sent",
    "status.connected",
    "status.disconnected",
    "qrcode.updated"
  ]
}
```

### Payload — Mensagem recebida
```json
{
  "event": "message.received",
  "instanceId": "inst-123",
  "data": {
    "messageId": "msg-123",
    "from": "5511999999999",
    "body": "Olá!",
    "type": "text",
    "timestamp": 1640995200,
    "isFromMe": false
  }
}
```

### Payload — Mensagem enviada
```json
{
  "event": "message.sent",
  "instanceId": "inst-123",
  "data": {
    "messageId": "msg-124",
    "to": "5511999999999",
    "body": "Resposta",
    "type": "text",
    "timestamp": 1640995260,
    "isFromMe": true
  }
}
```

### Validação de assinatura
```
Header: X-Webhook-Signature: sha256={hash}
```

---

## Integração N8N

Pacote NPM disponível: `n8n-nodes-n8ntools-uazapi`
- Instalar no N8N: Settings → Community Nodes → `n8n-nodes-n8ntools-uazapi`
- Substitui o node da Evolution API

---

## Limites

| Plano | Requisições/hora |
|-------|-----------------|
| Free | 100 |
| Pago | 10.000 |

- Máximo 100 instâncias por conta
- Retenção de histórico: 90 dias
- HTTP 429 ao exceder rate limit

---

## Status Codes

| Código | Significado |
|--------|------------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Requisição inválida |
| 401 | Token inválido |
| 429 | Rate limit |
| 500 | Erro interno |

---

## Migração da Evolution API → UazAPI

### O que muda no N8N

| Aspecto | Evolution API | UazAPI |
|---------|--------------|--------|
| Node N8N | `n8n-nodes-evolution-api` | `n8n-nodes-n8ntools-uazapi` |
| Enviar texto | `POST /message/sendText/{instance}` | `POST /send/text` |
| Enviar áudio | `POST /message/sendWhatsAppAudio/{instance}` | `POST /send/audio` |
| Auth | `apikey: {key}` no header | `Authorization: Bearer {instanceToken}` |
| Identificar instância | Path param `/{instance}` | Token já identifica a instância |

### O que muda no frontend/backend
- Campo `instancia_wpp` no agente: passa a ser o `instanceToken` (ou mantém o nome e armazena o token)
- API key global → substituída por token por instância
- Envio de mensagens: `POST /send/text` com Bearer token
