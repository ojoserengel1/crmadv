# CONTEXTO COMPLETO DO PROJETO

## O que é
CRM + IA de Qualificação para escritórios de advocacia. 
Advogados usam IA no WhatsApp para qualificar leads automaticamente.
Cada advogado (cliente) pode ter múltiplas IAs (nichos diferentes: BPC/LOAS, Trabalhista, etc).

## Quem são os usuários
1. **Admin (Mateus/PlusssTech)** — configura tudo, cria clientes, cria agentes/IAs
2. **Cliente (Advogado)** — vê leads no kanban, configura perguntas/mensagens, conecta WhatsApp

## Fluxo de dados
```
Admin cria cliente no FRONT → Supabase (profiles + clientes)
Admin cria agente/IA no FRONT → Supabase (agentes + perguntas padrão + etapas padrão via trigger)
Admin preenche configs → Supabase (instância, webhook, planilha, áudio, prompts)
Admin duplica workflow N8N → muda só webhook path
Lead manda msg no WhatsApp → Evolution API → N8N webhook
N8N busca configs do Supabase (tabela agentes) → monta prompt → AI Agent responde
N8N salva lead no Supabase (tabela leads)
Cliente vê lead no Kanban do frontend
```

## Banco de dados (Supabase)

### profiles
- id (uuid, FK auth.users)
- email (text, unique)
- nome (text)
- role (text: 'admin' ou 'cliente')
- ativo (boolean)

### clientes
- id (uuid)
- profile_id (uuid, FK profiles, unique)
- nome_cliente (text)
- ativo (boolean)

### agentes
- id (uuid)
- cliente_id (uuid, FK clientes)
- nome (text) — "BPC/LOAS"
- nicho (text) — tag do lead
- instancia_wpp (text)
- webhook_path (text, unique)
- url_planilha (text)
- url_audio (text)
- frase_gatilho (text)
- frase_saudacao (text)
- frase_encerramento (text)
- prompt_agente (text) — system message do AI Agent
- prompt_resumo (text) — system message do AI Agent de resumo
- ativo (boolean)
- ia_ativa (boolean)

### perguntas_qualificacao
- id (uuid)
- agente_id (uuid, FK agentes)
- ordem (int, 1-5)
- pergunta (text)
- ativa (boolean)
- UNIQUE(agente_id, ordem)

### etapas_funil
- id (uuid)
- agente_id (uuid, FK agentes)
- nome (text)
- cor (text, hex)
- ordem (int)
- UNIQUE(agente_id, ordem)

### leads
- id (uuid)
- cliente_id (uuid, FK clientes)
- agente_id (uuid, FK agentes)
- etapa_id (uuid, FK etapas_funil)
- nome (text)
- telefone (text)
- nicho (text)
- resposta_1 a resposta_5 (text)
- resumo (text)
- status (text)
- UNIQUE(agente_id, telefone)

### chat_memory (N8N gerencia, NÃO MEXER)
- id (int)
- session_id (varchar) — telefone do lead
- message (jsonb)

## Triggers automáticos
- Criar agente → 5 perguntas padrão + 5 etapas padrão

## RLS
- Cliente vê/edita apenas seus dados (via profile_id → clientes → agentes)
- Admin vê/edita tudo

## Telas do Frontend

### Login
- Email/senha via Supabase Auth
- Redireciona baseado no role (admin → clientes, cliente → kanban)

### Cliente > Leads (Kanban)
- Seletor de IA no topo (BPC/LOAS | Trabalhista) quando tem +1 IA
- Colunas = etapas_funil daquele agente
- Cards = leads com nome, telefone, tag nicho, data
- Drag and drop entre etapas
- Click no lead abre modal com resumo
- Botão "Gerenciar Etapas" — edita etapas daquele agente (nome, cor, add, remove)

### Cliente > Configurações
- Seletor de IA no topo
- Sub-aba WhatsApp: status conexão, QR code (futuro: integrar Evolution API)
- Sub-aba Qualificação:
  1. Status da I.A (toggle on/off)
  2. Mensagem de Saudação (textarea)
  3. Perguntas de Qualificação (5 cards com toggle e textarea)
  4. Mensagem de Encerramento (textarea)

### Admin > Clientes
- Lista de clientes com badges das IAs
- Botão "+ Novo Cliente"

### Admin > Editor (dentro do cliente)
- Seletor de agente/IA no topo + botão "+ Nova I.A"
- Tudo em uma tela por agente:
  - Nome do Cliente
  - Instância WhatsApp
  - Webhook Path
  - Cliente ativo (toggle)
  - I.A ativa (toggle)
  - URL da Planilha
  - URL do Áudio
  - Frase Gatilho
  - Prompt do Agente
  - Prompt do Resumo

## N8N Workflow
Cada agente = 1 workflow N8N. O workflow tem um nó BUSCAR CLIENTE (Postgres) que lê da tabela agentes:
```sql
SELECT a.*, 
  (SELECT json_agg(p ORDER BY p.ordem) FROM perguntas_qualificacao p WHERE p.agente_id = a.id AND p.ativa = true) as perguntas
FROM agentes a 
WHERE a.instancia_wpp = '{{ instancia da mensagem }}'
AND a.ativo = true AND a.ia_ativa = true
LIMIT 1
```
O DADOS LEAD no N8N não tem mais valores fixos — tudo vem do Supabase.

## Próximos passos
1. Integrar frontend com Supabase (substituir mock data por queries reais)
2. Supabase Auth (login real)
3. CRUD completo (criar cliente, criar agente, salvar configs)
4. Integrar N8N com Supabase (nó BUSCAR CLIENTE)
5. Deploy Vercel
6. Integrar Evolution API para QR Code no frontend
