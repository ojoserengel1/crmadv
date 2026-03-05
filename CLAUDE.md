# CLAUDE.md

## Projeto
CRM + IA de Qualificação para Advogados. Frontend Next.js 14 + Supabase.

## Contexto completo
Leia `docs/CONTEXTO.md` antes de qualquer alteração — contém toda a arquitetura, tabelas, telas e fluxos.

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Deploy: Vercel

## Estrutura
```
src/
  app/           → pages (Next.js App Router)
  components/    → componentes React
    App.jsx      → protótipo completo com mock data (referência visual)
docs/
  CONTEXTO.md    → arquitetura completa
  schema-supabase-v3.sql → SQL das tabelas
  workflow-n8n-modelo.json → workflow N8N de referência
```

## Banco (Supabase)
profiles → clientes → agentes → (perguntas_qualificacao, etapas_funil, leads)
+ chat_memory (N8N gerencia, não mexer)

## Tipos de usuário
- admin: vê tudo, cria clientes/agentes, configura prompts/webhooks
- cliente: vê seus leads (kanban), configura perguntas/mensagens/WhatsApp

## Comandos
```bash
npm install
npm run dev        # localhost:3000
```

## Convenções
- Tema dark (cores definidas no protótipo App.jsx)
- Labels em português
- Componentes funcionais com hooks
- Supabase client-side com @supabase/ssr

## Estado atual
- Protótipo visual completo em `src/components/App.jsx` com mock data
- Supabase com tabelas criadas e triggers funcionando
- Próximo passo: integrar frontend com Supabase real (substituir mocks)
