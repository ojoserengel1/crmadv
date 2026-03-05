-- ============================================================
-- MIGRAÇÃO COMPLETA - SUPABASE v3
-- Estrutura: profiles → clientes → agentes → (perguntas, etapas, leads)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- PASSO 1: Limpar tudo (exceto chat_memory)
-- ============================================================
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS etapas_funil CASCADE;
DROP TABLE IF EXISTS perguntas_qualificacao CASCADE;
DROP TABLE IF EXISTS agentes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Limpar colunas de config que migraram para agentes
ALTER TABLE clientes DROP COLUMN IF EXISTS instancia_wpp;
ALTER TABLE clientes DROP COLUMN IF EXISTS webhook_path;
ALTER TABLE clientes DROP COLUMN IF EXISTS url_planilha;
ALTER TABLE clientes DROP COLUMN IF EXISTS url_audio;
ALTER TABLE clientes DROP COLUMN IF EXISTS frase_gatilho;
ALTER TABLE clientes DROP COLUMN IF EXISTS frase_encerramento;
ALTER TABLE clientes DROP COLUMN IF EXISTS prompt_agente;
ALTER TABLE clientes DROP COLUMN IF EXISTS prompt_resumo;
ALTER TABLE clientes DROP COLUMN IF EXISTS bot_ativo;
ALTER TABLE clientes DROP COLUMN IF EXISTS slug;

-- Adicionar coluna nome_cliente se não existir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'nome_cliente') THEN
    ALTER TABLE clientes ADD COLUMN nome_cliente text;
  END IF;
END $$;

-- Renomear nome_escritorio para nome_cliente se existir
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'nome_escritorio') THEN
    UPDATE clientes SET nome_cliente = nome_escritorio WHERE nome_cliente IS NULL;
    ALTER TABLE clientes DROP COLUMN nome_escritorio;
  END IF;
END $$;

-- ============================================================
-- PASSO 2: Tabela AGENTES (cada IA de cada cliente)
-- ============================================================
CREATE TABLE agentes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Vínculo
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  nome text NOT NULL,                         -- "BPC/LOAS", "Trabalhista"
  nicho text NOT NULL,                        -- tag que aparece no lead
  
  -- Configs do Workflow
  instancia_wpp text,
  webhook_path text UNIQUE,
  url_planilha text,
  url_audio text,
  frase_gatilho text DEFAULT 'quero mais informações sobre o benefício',
  frase_saudacao text,
  frase_encerramento text DEFAULT 'Muito obrigado pela confiança e por me passar todas essas informações.',
  prompt_agente text,
  prompt_resumo text,
  
  -- Status
  ativo boolean DEFAULT true,
  ia_ativa boolean DEFAULT false
);

CREATE INDEX idx_agentes_cliente ON agentes(cliente_id);
CREATE INDEX idx_agentes_instancia ON agentes(instancia_wpp);

-- ============================================================
-- PASSO 3: Tabela PERGUNTAS_QUALIFICACAO (por agente)
-- ============================================================
CREATE TABLE perguntas_qualificacao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  
  -- Vínculo
  agente_id uuid REFERENCES agentes(id) ON DELETE CASCADE NOT NULL,
  
  -- Pergunta
  ordem int NOT NULL CHECK (ordem >= 1 AND ordem <= 5),
  pergunta text NOT NULL,
  ativa boolean DEFAULT true,
  
  UNIQUE(agente_id, ordem)
);

CREATE INDEX idx_perguntas_agente ON perguntas_qualificacao(agente_id);

-- ============================================================
-- PASSO 4: Tabela ETAPAS_FUNIL (por agente)
-- ============================================================
CREATE TABLE etapas_funil (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  
  -- Vínculo
  agente_id uuid REFERENCES agentes(id) ON DELETE CASCADE NOT NULL,
  
  -- Etapa
  nome text NOT NULL,
  cor text DEFAULT '#3B82F6',
  ordem int NOT NULL,
  
  UNIQUE(agente_id, ordem)
);

CREATE INDEX idx_etapas_agente ON etapas_funil(agente_id);

-- ============================================================
-- PASSO 5: Tabela LEADS (por agente, respostas genéricas)
-- ============================================================
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Vínculo
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  agente_id uuid REFERENCES agentes(id) ON DELETE CASCADE NOT NULL,
  etapa_id uuid REFERENCES etapas_funil(id) ON DELETE SET NULL,
  
  -- Dados do lead
  nome text,
  telefone text NOT NULL,
  nicho text,
  
  -- Respostas genéricas (até 5 perguntas)
  resposta_1 text,
  resposta_2 text,
  resposta_3 text,
  resposta_4 text,
  resposta_5 text,
  
  -- Resumo gerado pela IA
  resumo text,
  
  -- Status
  status text DEFAULT 'Atendimento (IA)',
  
  -- Não duplicar lead por agente
  UNIQUE(agente_id, telefone)
);

CREATE INDEX idx_leads_cliente ON leads(cliente_id);
CREATE INDEX idx_leads_agente ON leads(agente_id);
CREATE INDEX idx_leads_telefone ON leads(telefone);
CREATE INDEX idx_leads_etapa ON leads(etapa_id);

-- ============================================================
-- PASSO 6: Triggers automáticos
-- ============================================================

-- Ao criar agente → criar 5 perguntas padrão
CREATE OR REPLACE FUNCTION public.criar_perguntas_padrao_agente()
RETURNS trigger AS $$
BEGIN
  INSERT INTO perguntas_qualificacao (agente_id, pergunta, ordem) VALUES
    (NEW.id, 'Pergunta 1 - edite aqui', 1),
    (NEW.id, 'Pergunta 2 - edite aqui', 2),
    (NEW.id, 'Pergunta 3 - edite aqui', 3),
    (NEW.id, 'Pergunta 4 - edite aqui', 4),
    (NEW.id, 'Pergunta 5 - edite aqui', 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agente_created_perguntas ON agentes;
CREATE TRIGGER on_agente_created_perguntas
  AFTER INSERT ON agentes
  FOR EACH ROW EXECUTE FUNCTION public.criar_perguntas_padrao_agente();

-- Ao criar agente → criar 5 etapas padrão
CREATE OR REPLACE FUNCTION public.criar_etapas_padrao_agente()
RETURNS trigger AS $$
BEGIN
  INSERT INTO etapas_funil (agente_id, nome, cor, ordem) VALUES
    (NEW.id, 'Atendimento (IA)', '#3B82F6', 1),
    (NEW.id, 'Qualificado', '#F59E0B', 2),
    (NEW.id, 'Em Análise', '#8B5CF6', 3),
    (NEW.id, 'Aprovado', '#10B981', 4),
    (NEW.id, 'Não Qualificado', '#EF4444', 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agente_created_etapas ON agentes;
CREATE TRIGGER on_agente_created_etapas
  AFTER INSERT ON agentes
  FOR EACH ROW EXECUTE FUNCTION public.criar_etapas_padrao_agente();

-- Remover triggers antigos que apontavam para clientes
DROP TRIGGER IF EXISTS on_cliente_created ON clientes;
DROP TRIGGER IF EXISTS on_cliente_created_perguntas ON clientes;
DROP FUNCTION IF EXISTS public.criar_etapas_padrao();
DROP FUNCTION IF EXISTS public.criar_perguntas_padrao();

-- ============================================================
-- PASSO 7: RLS (Row Level Security)
-- ============================================================

-- AGENTES
ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client view own agentes" ON agentes FOR SELECT
  USING (cliente_id IN (SELECT id FROM clientes WHERE profile_id = auth.uid()));

CREATE POLICY "Client update own agentes" ON agentes FOR UPDATE
  USING (cliente_id IN (SELECT id FROM clientes WHERE profile_id = auth.uid()));

CREATE POLICY "Admin full agentes" ON agentes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- PERGUNTAS
ALTER TABLE perguntas_qualificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client manage own perguntas" ON perguntas_qualificacao FOR ALL
  USING (agente_id IN (
    SELECT a.id FROM agentes a 
    JOIN clientes c ON a.cliente_id = c.id 
    WHERE c.profile_id = auth.uid()
  ));

CREATE POLICY "Admin full perguntas" ON perguntas_qualificacao FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ETAPAS
ALTER TABLE etapas_funil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client manage own etapas" ON etapas_funil FOR ALL
  USING (agente_id IN (
    SELECT a.id FROM agentes a 
    JOIN clientes c ON a.cliente_id = c.id 
    WHERE c.profile_id = auth.uid()
  ));

CREATE POLICY "Admin full etapas" ON etapas_funil FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- LEADS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client view own leads" ON leads FOR SELECT
  USING (cliente_id IN (SELECT id FROM clientes WHERE profile_id = auth.uid()));

CREATE POLICY "Client update own leads" ON leads FOR UPDATE
  USING (cliente_id IN (SELECT id FROM clientes WHERE profile_id = auth.uid()));

CREATE POLICY "Admin full leads" ON leads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- ESTRUTURA FINAL
-- ============================================================
-- profiles       → login (auth.users)
-- clientes       → firma (nome_cliente, email, ativo)
--   └── agentes  → cada IA
--         ├── perguntas_qualificacao (5 por agente)
--         ├── etapas_funil (5 por agente)
--         └── leads (leads daquela IA)
-- chat_memory    → N8N gerencia (não mexer)
-- ============================================================
