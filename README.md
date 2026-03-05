# Plataforma IA Qualificação - CRM + IA para Advogados

## Visão Geral
CRM com IA de qualificação de leads via WhatsApp para escritórios de advocacia.
Cada cliente (advogado) pode ter múltiplas IAs (nichos), cada uma com suas perguntas, etapas de funil e leads.

## Stack
- **Frontend:** Next.js 14 + Tailwind CSS
- **Backend/Auth/DB:** Supabase (Auth + Postgres + RLS)
- **Automação:** N8N (workflow WhatsApp → IA → CRM)
- **WhatsApp:** Evolution API
- **Deploy:** Vercel

## Estrutura do Banco (Supabase)
```
profiles       → login (vinculado ao auth.users)
clientes       → firma/escritório (nome_cliente, email, ativo)
  └── agentes  → cada IA do cliente
        ├── perguntas_qualificacao (5 por agente, toggle on/off)
        ├── etapas_funil (kanban por agente)
        └── leads (respostas genéricas resposta_1 a resposta_5 + resumo)
chat_memory    → N8N gerencia (não mexer)
```

## Tipos de Usuário
- **admin** — vê todos os clientes, cria agentes, configura tudo (instância, webhook, planilha, áudio, prompts, frase gatilho)
- **cliente** — vê seus leads (kanban), configura suas IAs (status, saudação, perguntas, encerramento, WhatsApp)

## Área do Cliente
- **Leads** — Kanban com seletor de IA (BPC/LOAS | Trabalhista), drag-and-drop, gerenciar etapas por IA, tag de nicho por lead
- **Configurações** — WhatsApp (QR Code/status) | Qualificação (status IA, saudação, perguntas, encerramento)

## Área Admin
- **Clientes** — lista com badges de IAs
- **Editor** — dentro do cliente, seletor de IA/agente, tudo em uma tela: nome, instância, webhook, toggles, URLs, frase gatilho, prompts

## Integração N8N
O frontend salva configs no Supabase. O N8N lê do Supabase via nó BUSCAR CLIENTE a cada mensagem recebida.
Cada agente = 1 workflow N8N duplicado (muda só webhook path).

## Supabase Config
- URL: (preencher)
- Anon Key: (preencher)
- Projeto: iapreatendimento

## Setup Local
```bash
npm install
cp .env.example .env.local  # preencher com Supabase keys
npm run dev
```

## Arquivos de Referência
- `docs/schema-supabase-v3.sql` — SQL completo das tabelas
- `docs/CONTEXTO.md` — contexto completo do projeto para o Claude Code
- `src/components/App.jsx` — protótipo React completo (mock data)
