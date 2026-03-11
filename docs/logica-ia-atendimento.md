# Lógica de Atendimento da IA — Quando o N8N é acionado

## Visão Geral do Fluxo

```
WhatsApp (UazAPI)
    ↓
/api/webhook/whatsapp  (Next.js)
    ↓ salva em chat_messages (SEMPRE)
    ↓ decide se repassa ao N8N
N8N (workflow por agente)
    ↓
IA responde ao lead
```

A decisão de acionar ou não o N8N acontece **no relay do webhook** (`src/app/api/webhook/whatsapp/route.js`), antes de qualquer execução no N8N.

---

## Regras do Relay (Next.js → N8N)

### 1. Mensagens enviadas pelo bot (`fromMe=true`)
**Nunca** são repassadas ao N8N. São apenas salvas em `chat_messages` para exibição no chat do CRM.

### 2. Lead já processado pela IA (`fromMe=false`)
O relay verifica em paralelo:
- `leads.etapa_id` do lead (pelo telefone + agente_id)
- `etapas_funil` primeira etapa do agente (menor `ordem`)

**Não repassa ao N8N se:**
- O lead existe **e** sua `etapa_id` é diferente da primeira etapa do agente
  → significa que a IA já fez a triagem e moveu o lead adiante
- **OU** o lead possui `resumo IS NOT NULL`
  → cobertura extra para edge cases

**Repassa ao N8N se:**
- Não existe registro do lead ainda (lead novo)
- O lead está na primeira etapa ("Atendimento (IA)")
- O advogado moveu manualmente o lead de volta para a primeira etapa (reinício intencional)

### 3. Multi-agente na mesma instância WhatsApp
Quando o mesmo número de WhatsApp serve múltiplos agentes, o relay identifica qual agente deve receber a mensagem:

1. **Lead existente** → usa o `agente_id` do lead já cadastrado (lookup em `leads`)
2. **Lead novo + frase_gatilho** → match por `frase_gatilho` do agente no texto recebido
   - Ordenação por especificidade: frases mais longas têm prioridade (evita match prematuro)
3. **Fallback** → primeiro agente da instância

> Para `fromMe=true` (resposta da IA), o roteamento também usa o lead lookup para garantir que a mensagem seja salva no agente correto.

---

## Regras Internas do N8N (workflow)

Mesmo que o relay envie a mensagem ao N8N, o workflow possui suas próprias verificações:

### Nó `BUSCAR CLIENTE`
```sql
WHERE a.id = '{{ $('Webhook').item.json.body.agente_id }}'
```
Usa o `agente_id` enviado pelo relay — garante o agente correto mesmo em multi-agente.

### Nó `Tem Conversa em Aberto?`
```sql
SELECT COUNT(*) as total FROM chat_memory
WHERE session_id = '{agente_id}:{telefone}'
OR session_id = '{telefone}'
```
Verifica se existe histórico de conversa para este lead.

### Nó `If` — decide se a IA responde
```
total > 0  →  conversa em andamento → IA continua
  OU
mensagem contém frase_gatilho  →  lead novo → IA inicia
```

Se nenhuma condição for verdadeira: fluxo vai para `No Operation` (IA silenciosa).

---

## Tabela de Decisão Completa

| Situação | Relay envia ao N8N? | N8N executa IA? |
|---|---|---|
| Lead novo envia frase_gatilho | ✅ Sim | ✅ Sim |
| Lead na etapa 1 envia qualquer msg (total > 0) | ✅ Sim | ✅ Sim |
| Lead na etapa 1 envia msg sem frase_gatilho (total = 0) | ✅ Sim | ❌ Não (If falha) |
| Lead em etapa 2+ (Qualificado, Em Análise, etc.) | ❌ Não | — |
| Advogado edita ou apaga o resumo | ❌ Não (etapa ainda é 2+) | — |
| Advogado muda status/etapa para qualquer etapa 2+ | ❌ Não | — |
| Advogado move lead de volta para etapa 1 | ✅ Sim | ✅ Sim (reinício intencional) |
| Mensagem enviada pela IA (fromMe=true) | ❌ Não | — |
| ia_ativa=false no agente | ✅ Sim (salva no chat) | ⚠️ N8N recebe mas deve verificar campo `ia_ativa` |

---

## Arquivos Relevantes

| Arquivo | Responsabilidade |
|---|---|
| `src/app/api/webhook/whatsapp/route.js` | Relay: salva mensagens, decide envio ao N8N, roteamento multi-agente |
| `docs/workflow-n8n-modelo.json` | Modelo do workflow N8N com `BUSCAR CLIENTE` usando `agente_id` |

---

## Histórico de Decisões

- **2026-03-11**: Implementado multi-agente (mesma instância WhatsApp, múltiplos agentes diferenciados por `frase_gatilho`)
- **2026-03-11**: Correção de routing por especificidade (frase mais longa tem prioridade)
- **2026-03-11**: `fromMe=true` também usa lead lookup para salvar no agente correto
- **2026-03-11**: Bloqueio de relay para leads já processados — critério: etapa > 1 ou resumo preenchido
