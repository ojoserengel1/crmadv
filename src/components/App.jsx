import { useState, useEffect } from "react";

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_USERS = {
  "admin@plusstech.com.br": { senha: "admin123", role: "admin", nome: "Mateus Admin" },
  "jose@rengel.com.br": { senha: "cliente123", role: "cliente", nome: "Dr. José Rengel", cliente_id: "c1" },
};

const MOCK_CLIENTES = [
  { id: "c1", nome_cliente: "Rengel Advocacia", email: "jose@rengel.com.br", ativo: true },
];

const MOCK_AGENTES = [
  {
    id: "a1", cliente_id: "c1", nome: "BPC/LOAS", nicho: "BPC/LOAS",
    instancia_wpp: "[José] Automações Internas", webhook_path: "receber-msg-rengel-bpc",
    url_planilha: "https://docs.google.com/spreadsheets/d/1BE21O93...",
    url_audio: "https://pktodizycnapmevqvjtf.supabase.co/storage/...",
    frase_gatilho: "quero mais informações sobre o benefício",
    frase_saudacao: "Tudo bem? Sou o Dr José Rengel, responsável pelo escritório Rengel Advocacia.\n\nVou te fazer algumas perguntas para entender melhor a sua situação.\n\nQual seu nome e tem quantos anos?",
    frase_encerramento: "Muito obrigado pela confiança e por me passar todas essas informações.",
    prompt_agente: "## Identidade e Papel\n\nVocê é o **Dr. José Rengel**...",
    prompt_resumo: "Você é um assistente interno do escritório Rengel Advocacia...",
    ativo: true, ia_ativa: true,
  },
  {
    id: "a2", cliente_id: "c1", nome: "Trabalhista", nicho: "Trabalhista",
    instancia_wpp: "[José] Trabalhista", webhook_path: "receber-msg-rengel-trab",
    url_planilha: "", url_audio: "",
    frase_gatilho: "quero informações sobre direitos trabalhistas",
    frase_saudacao: "Olá! Sou o Dr José Rengel. Vou te ajudar com sua questão trabalhista.",
    frase_encerramento: "Obrigado pelas informações. Vou analisar seu caso.",
    prompt_agente: "", prompt_resumo: "",
    ativo: true, ia_ativa: false,
  },
];

const MOCK_PERGUNTAS = {
  a1: [
    { id: "p1", ordem: 1, pergunta: "Você possui alguma deficiência ou doença que impeça ou dificulte de trabalhar?", ativa: true },
    { id: "p2", ordem: 2, pergunta: "Quantas pessoas moram com você?", ativa: true },
    { id: "p3", ordem: 3, pergunta: "Dessas pessoas, alguém trabalha ou recebe algum benefício?", ativa: true },
    { id: "p4", ordem: 4, pergunta: "Qual a renda total da família?", ativa: true },
    { id: "p5", ordem: 5, pergunta: "Você já tem cadastro no CadÚnico?", ativa: true },
  ],
  a2: [
    { id: "p6", ordem: 1, pergunta: "Qual era o seu cargo na empresa?", ativa: true },
    { id: "p7", ordem: 2, pergunta: "Quanto tempo trabalhou lá?", ativa: true },
    { id: "p8", ordem: 3, pergunta: "Foi demitido ou pediu demissão?", ativa: true },
    { id: "p9", ordem: 4, pergunta: "Recebeu todas as verbas rescisórias?", ativa: false },
    { id: "p10", ordem: 5, pergunta: "Tem algum documento ou comprovante do vínculo?", ativa: false },
  ],
};

const MOCK_ETAPAS = [
  { id: "e1", agente_id: "a1", nome: "Atendimento (IA)", cor: "#3B82F6", ordem: 1 },
  { id: "e2", agente_id: "a1", nome: "Qualificado", cor: "#F59E0B", ordem: 2 },
  { id: "e3", agente_id: "a1", nome: "Em Análise", cor: "#8B5CF6", ordem: 3 },
  { id: "e4", agente_id: "a1", nome: "Aprovado", cor: "#10B981", ordem: 4 },
  { id: "e5", agente_id: "a1", nome: "Não Qualificado", cor: "#EF4444", ordem: 5 },
  { id: "e6", agente_id: "a2", nome: "Novo Lead", cor: "#3B82F6", ordem: 1 },
  { id: "e7", agente_id: "a2", nome: "Documentação", cor: "#F59E0B", ordem: 2 },
  { id: "e8", agente_id: "a2", nome: "Em Andamento", cor: "#8B5CF6", ordem: 3 },
  { id: "e9", agente_id: "a2", nome: "Concluído", cor: "#10B981", ordem: 4 },
  { id: "e10", agente_id: "a2", nome: "Arquivado", cor: "#EF4444", ordem: 5 },
];

const MOCK_LEADS = [
  { id: "l1", cliente_id: "c1", agente_id: "a1", etapa_id: "e1", nome: "Maria Silva", telefone: "5547999001122", nicho: "BPC/LOAS", status: "Atendimento (IA)", resumo: null, created_at: "2026-03-04" },
  { id: "l2", cliente_id: "c1", agente_id: "a1", etapa_id: "e1", nome: "João Santos", telefone: "5547999003344", nicho: "BPC/LOAS", status: "Atendimento (IA)", resumo: null, created_at: "2026-03-04" },
  { id: "l3", cliente_id: "c1", agente_id: "a2", etapa_id: "e6", nome: "Ana Costa", telefone: "5547999005566", nicho: "Trabalhista", status: "Novo Lead", resumo: null, created_at: "2026-03-03" },
  { id: "l4", cliente_id: "c1", agente_id: "a1", etapa_id: "e2", nome: "Pedro Oliveira", telefone: "5547999007788", nicho: "BPC/LOAS", status: "Qualificado", resumo: "Idade: 52\nDeficiência: Diabetes tipo 2\nPessoas: 2\nRenda: R$ 1.200\nCadÚnico: Não", created_at: "2026-03-03" },
  { id: "l5", cliente_id: "c1", agente_id: "a1", etapa_id: "e3", nome: "Lúcia Ferreira", telefone: "5547999009900", nicho: "BPC/LOAS", status: "Em Análise", resumo: "Idade: 38\nDeficiência: Depressão severa\nPessoas: 4\nRenda: R$ 600\nCadÚnico: Sim", created_at: "2026-03-02" },
  { id: "l6", cliente_id: "c1", agente_id: "a1", etapa_id: "e4", nome: "Carlos Lima", telefone: "5547999011122", nicho: "BPC/LOAS", status: "Aprovado", resumo: "Idade: 61\nDeficiência: Artrose\nPessoas: 1\nRenda: R$ 400\nCadÚnico: Sim", created_at: "2026-03-01" },
  { id: "l7", cliente_id: "c1", agente_id: "a2", etapa_id: "e7", nome: "Roberto Souza", telefone: "5547999013344", nicho: "Trabalhista", status: "Documentação", resumo: "Cargo: Operador de máquinas\nTempo: 5 anos\nDemissão: Sem justa causa", created_at: "2026-03-02" },
];

// ============================================================
// THEME
// ============================================================
const co = {
  bg: "#0A0A0F", bgCard: "#12121A", bgHover: "#1A1A25", bgInput: "#16161F",
  border: "#2A2A35", borderFocus: "#6366F1",
  text: "#E8E8ED", textMuted: "#8888A0", textDim: "#55556A",
  primary: "#6366F1", primaryHover: "#5558E6", primaryBg: "rgba(99,102,241,0.1)",
  success: "#10B981", successBg: "rgba(16,185,129,0.1)",
  warning: "#F59E0B", warningBg: "rgba(245,158,11,0.1)",
  danger: "#EF4444", dangerBg: "rgba(239,68,68,0.1)",
  purple: "#8B5CF6", purpleBg: "rgba(139,92,246,0.1)",
};

// ============================================================
// PRIMITIVES
// ============================================================
function Badge({ children, color = "primary" }) {
  const map = { primary: [co.primaryBg, co.primary], success: [co.successBg, co.success], warning: [co.warningBg, co.warning], danger: [co.dangerBg, co.danger], purple: [co.purpleBg, co.purple] };
  const [bg, fg] = map[color] || map.primary;
  return <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{children}</span>;
}

function Input({ label, value, onChange, type = "text", placeholder, textarea, disabled }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500, letterSpacing: "0.03em" }}>{label}</label>}
      <Tag type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} rows={textarea ? 4 : undefined}
        style={{ width: "100%", padding: textarea ? "10px 14px" : "9px 14px", background: disabled ? co.bg : co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 14, outline: "none", resize: textarea ? "vertical" : "none", fontFamily: "inherit", opacity: disabled ? 0.5 : 1, boxSizing: "border-box" }}
        onFocus={(e) => { if (!disabled) e.target.style.borderColor = co.borderFocus; }} onBlur={(e) => { e.target.style.borderColor = co.border; }}
      />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style, disabled }) {
  const v = { primary: [co.primary, co.primaryHover, "#fff", "none"], ghost: ["transparent", co.bgHover, co.textMuted, `1px solid ${co.border}`], danger: [co.dangerBg, "rgba(239,68,68,0.2)", co.danger, "none"], success: [co.successBg, "rgba(16,185,129,0.2)", co.success, "none"] };
  const [bg, hv, fg, bd] = v[variant] || v.primary;
  const s = { sm: [12, 6, 12], md: [18, 9, 13], lg: [24, 12, 14] }[size];
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: `${s[1]}px ${s[0]}px`, background: hover && !disabled ? hv : bg, color: fg, border: bd, borderRadius: 8, fontSize: s[2], fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: disabled ? 0.5 : 1, fontFamily: "inherit", ...style }}>
      {children}
    </button>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", background: value ? co.success : co.border, transition: "background 0.2s", position: "relative" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 21 : 3, transition: "left 0.2s" }} />
      </div>
      {label && <span style={{ color: co.text, fontSize: 13 }}>{label}</span>}
      <Badge color={value ? "success" : "danger"}>{value ? "ON" : "OFF"}</Badge>
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const go = () => { setLoading(true); setError(""); setTimeout(() => { const u = MOCK_USERS[email]; if (u && u.senha === senha) onLogin({ email, ...u }); else setError("Email ou senha inválidos"); setLoading(false); }, 500); };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${co.bg} 0%, #0D0D1A 50%, #10101F 100%)`, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: 400, padding: 40, background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${co.primary}, ${co.purple})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20, fontWeight: 800, color: "#fff" }}>IA</div>
          <h1 style={{ color: co.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Agente de Qualificação</h1>
          <p style={{ color: co.textMuted, fontSize: 13, marginTop: 6 }}>Acesse sua conta</p>
        </div>
        <Input label="EMAIL" value={email} onChange={setEmail} placeholder="seu@email.com" />
        <Input label="SENHA" value={senha} onChange={setSenha} type="password" placeholder="••••••••" />
        {error && <p style={{ color: co.danger, fontSize: 13, margin: "0 0 16px", padding: "8px 12px", background: co.dangerBg, borderRadius: 8 }}>{error}</p>}
        <Btn onClick={go} disabled={loading} size="lg" style={{ width: "100%", marginTop: 4 }}>{loading ? "Entrando..." : "Entrar"}</Btn>
        <div style={{ marginTop: 24, padding: 16, background: co.bg, borderRadius: 10, border: `1px solid ${co.border}` }}>
          <p style={{ color: co.textDim, fontSize: 11, margin: "0 0 8px", fontWeight: 600 }}>DEMO</p>
          <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 4px" }}>Admin: <span style={{ color: co.primary }}>admin@plusstech.com.br</span> / admin123</p>
          <p style={{ color: co.textMuted, fontSize: 12, margin: 0 }}>Cliente: <span style={{ color: co.primary }}>jose@rengel.com.br</span> / cliente123</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ user, activeTab, onTabChange, onLogout }) {
  const isAdmin = user.role === "admin";
  const tabs = isAdmin ? [{ id: "clientes", label: "Clientes", icon: "◷" }] : [{ id: "kanban", label: "Leads", icon: "◫" }, { id: "config", label: "Configurações", icon: "⚙" }];
  return (
    <div style={{ width: 220, height: "100vh", background: co.bgCard, borderRight: `1px solid ${co.border}`, display: "flex", flexDirection: "column", padding: "20px 12px", boxSizing: "border-box", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 32 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${co.primary}, ${co.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>IA</div>
        <div><div style={{ color: co.text, fontSize: 13, fontWeight: 600 }}>Qualificação</div><div style={{ color: co.textDim, fontSize: 10, fontWeight: 500 }}>{isAdmin ? "ADMIN" : "CLIENTE"}</div></div>
      </div>
      <div style={{ flex: 1 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onTabChange(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 2, borderRadius: 8, border: "none", background: activeTab === t.id ? co.primaryBg : "transparent", color: activeTab === t.id ? co.primary : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit", textAlign: "left" }}>
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${co.border}`, paddingTop: 16 }}>
        <div style={{ padding: "0 12px", marginBottom: 12 }}><div style={{ color: co.text, fontSize: 13, fontWeight: 500 }}>{user.nome}</div><div style={{ color: co.textDim, fontSize: 11 }}>{user.email}</div></div>
        <button onClick={onLogout} style={{ width: "100%", padding: "8px 12px", background: "transparent", border: `1px solid ${co.border}`, borderRadius: 8, color: co.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500 }}>Sair</button>
      </div>
    </div>
  );
}

// ============================================================
// KANBAN (Client)
// ============================================================
function KanbanView({ clienteId }) {
  const [leads, setLeads] = useState(MOCK_LEADS.filter((l) => l.cliente_id === clienteId));
  const [etapas, setEtapas] = useState(MOCK_ETAPAS);
  const [selectedLead, setSelectedLead] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [showGerenciar, setShowGerenciar] = useState(false);

  const agentesCliente = MOCK_AGENTES.filter((a) => a.cliente_id === clienteId);
  const [activeAgente, setActiveAgente] = useState(agentesCliente[0]?.id);

  const currentEtapas = etapas.filter((e) => e.agente_id === activeAgente);
  const currentLeads = leads.filter((l) => l.agente_id === activeAgente);
  const activeAgenteObj = agentesCliente.find((a) => a.id === activeAgente);

  const handleDrop = (etapaId) => { if (dragItem) { setLeads((p) => p.map((l) => l.id === dragItem ? { ...l, etapa_id: etapaId } : l)); setDragItem(null); } };
  const addEtapa = () => { const mx = Math.max(0, ...currentEtapas.map((e) => e.ordem)); setEtapas((p) => [...p, { id: "et_" + Date.now(), agente_id: activeAgente, nome: "Nova Etapa", cor: "#6366F1", ordem: mx + 1 }]); };
  const updateEtapa = (id, f, v) => setEtapas((p) => p.map((e) => e.id === id ? { ...e, [f]: v } : e));
  const removeEtapa = (id) => { if (currentEtapas.length > 1) setEtapas((p) => p.filter((e) => e.id !== id)); };
  const corOpts = ["#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#EF4444", "#EC4899", "#06B6D4", "#F97316"];

  return (
    <div style={{ padding: 28, height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Leads</h2>
          <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>{currentLeads.length} leads no funil</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => setShowGerenciar(true)}>⚙ Gerenciar Etapas</Btn>
      </div>

      {/* AGENTE SELECTOR */}
      {agentesCliente.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {agentesCliente.map((a) => (
            <button key={a.id} onClick={() => setActiveAgente(a.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${activeAgente === a.id ? co.primary : co.border}`, background: activeAgente === a.id ? co.primary : co.bgCard, color: activeAgente === a.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
              {a.nicho}
            </button>
          ))}
        </div>
      )}

      {/* COLUMNS */}
      <div style={{ display: "flex", gap: 16, flex: 1, overflowX: "auto", paddingBottom: 16 }}>
        {currentEtapas.sort((a, b) => a.ordem - b.ordem).map((etapa) => {
          const el = currentLeads.filter((l) => l.etapa_id === etapa.id);
          return (
            <div key={etapa.id} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(etapa.id)} style={{ minWidth: 280, width: 280, display: "flex", flexDirection: "column", background: co.bg, borderRadius: 12, border: `1px solid ${co.border}`, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${co.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: etapa.cor }} />
                  <span style={{ color: co.text, fontSize: 13, fontWeight: 600 }}>{etapa.nome}</span>
                </div>
                <span style={{ background: co.bgHover, color: co.textMuted, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{el.length}</span>
              </div>
              <div style={{ flex: 1, padding: 10, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {el.map((lead) => (
                  <div key={lead.id} draggable onDragStart={() => setDragItem(lead.id)} onClick={() => setSelectedLead(lead)}
                    style={{ padding: 14, background: co.bgCard, borderRadius: 10, border: `1px solid ${co.border}`, cursor: "grab", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = co.borderFocus; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = co.border; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                      <span style={{ color: co.text, fontSize: 13, fontWeight: 600 }}>{lead.nome}</span>
                      {lead.nicho && <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: co.purpleBg, color: co.purple, whiteSpace: "nowrap" }}>{lead.nicho}</span>}
                    </div>
                    <div style={{ color: co.textMuted, fontSize: 11, marginBottom: 6 }}>📱 {lead.telefone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")}</div>
                    <div style={{ color: co.textDim, fontSize: 10 }}>{lead.created_at}</div>
                  </div>
                ))}
                {el.length === 0 && <div style={{ padding: 20, textAlign: "center", color: co.textDim, fontSize: 12 }}>Arraste leads para cá</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAD DETAIL */}
      {selectedLead && (
        <div onClick={() => setSelectedLead(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 500, maxHeight: "80vh", overflow: "auto", background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
              <div>
                <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedLead.nome}</h3>
                <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>{selectedLead.telefone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} style={{ background: "none", border: "none", color: co.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <Badge color="primary">{selectedLead.status}</Badge>
              {selectedLead.nicho && <Badge color="purple">{selectedLead.nicho}</Badge>}
              <Badge color="purple">{selectedLead.created_at}</Badge>
            </div>
            {selectedLead.resumo ? (
              <div style={{ background: co.bg, borderRadius: 10, padding: 16, border: `1px solid ${co.border}` }}>
                <div style={{ color: co.textDim, fontSize: 11, fontWeight: 600, marginBottom: 10 }}>RESUMO DA QUALIFICAÇÃO</div>
                {selectedLead.resumo.split("\n").map((line, i) => { const [k, ...v] = line.split(":"); return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < selectedLead.resumo.split("\n").length - 1 ? `1px solid ${co.border}` : "none" }}>
                    <span style={{ color: co.textMuted, fontSize: 12 }}>{k}</span><span style={{ color: co.text, fontSize: 12, fontWeight: 500 }}>{v.join(":").trim()}</span>
                  </div>); })}
              </div>
            ) : <div style={{ background: co.bg, borderRadius: 10, padding: 20, textAlign: "center", border: `1px solid ${co.border}` }}><p style={{ color: co.textMuted, fontSize: 13, margin: 0 }}>Qualificação em andamento...</p></div>}
          </div>
        </div>
      )}

      {/* GERENCIAR ETAPAS */}
      {showGerenciar && (
        <div onClick={() => setShowGerenciar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxHeight: "85vh", overflow: "auto", background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div><h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Gerenciar Etapas — {activeAgenteObj?.nicho}</h3><p style={{ color: co.textMuted, fontSize: 12, margin: "4px 0 0" }}>Edite as etapas do funil desta I.A</p></div>
              <button onClick={() => setShowGerenciar(false)} style={{ background: "none", border: "none", color: co.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {currentEtapas.sort((a, b) => a.ordem - b.ordem).map((et) => (
                <div key={et.id} style={{ display: "flex", alignItems: "center", gap: 10, background: co.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${co.border}` }}>
                  <span style={{ color: co.textDim, fontSize: 12, fontWeight: 700, width: 20, textAlign: "center" }}>{et.ordem}</span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>{corOpts.map((cor) => <div key={cor} onClick={() => updateEtapa(et.id, "cor", cor)} style={{ width: 16, height: 16, borderRadius: 4, background: cor, cursor: "pointer", border: et.cor === cor ? "2px solid #fff" : "2px solid transparent" }} />)}</div>
                  <input value={et.nome} onChange={(e) => updateEtapa(et.id, "nome", e.target.value)} style={{ flex: 1, padding: "6px 10px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 6, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={() => removeEtapa(et.id)} disabled={currentEtapas.length <= 1} style={{ background: "none", border: "none", color: co.textDim, cursor: currentEtapas.length <= 1 ? "not-allowed" : "pointer", fontSize: 16, opacity: currentEtapas.length <= 1 ? 0.3 : 1, padding: "2px 6px" }}>✕</button>
                </div>
              ))}
            </div>
            <Btn variant="ghost" size="sm" onClick={addEtapa} style={{ width: "100%" }}>+ Adicionar Etapa</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CONFIG (Client) — per agente
// ============================================================
function ConfigView({ clienteId }) {
  const agentes = MOCK_AGENTES.filter((a) => a.cliente_id === clienteId);
  const [activeAgente, setActiveAgente] = useState(agentes[0]?.id);
  const [agenteConfigs, setAgenteConfigs] = useState(Object.fromEntries(agentes.map((a) => [a.id, { ...a }])));
  const [perguntasMap, setPerguntasMap] = useState({ ...MOCK_PERGUNTAS });
  const [activeSection, setActiveSection] = useState("whatsapp");
  const [saved, setSaved] = useState(false);

  const agente = agenteConfigs[activeAgente] || {};
  const perguntas = perguntasMap[activeAgente] || [];
  const ativas = perguntas.filter((p) => p.ativa).length;

  const updateAgente = (f, v) => setAgenteConfigs((p) => ({ ...p, [activeAgente]: { ...p[activeAgente], [f]: v } }));
  const updatePergunta = (id, v) => setPerguntasMap((p) => ({ ...p, [activeAgente]: p[activeAgente].map((q) => q.id === id ? { ...q, pergunta: v } : q) }));
  const togglePergunta = (id) => setPerguntasMap((p) => ({ ...p, [activeAgente]: p[activeAgente].map((q) => q.id === id ? { ...q, ativa: !q.ativa } : q) }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Configurações</h2>
        <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>Gerencie suas IAs de qualificação</p>
      </div>

      {/* AGENTE SELECTOR */}
      {agentes.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 8, fontWeight: 500 }}>SELECIONE A I.A</label>
          <div style={{ display: "flex", gap: 8 }}>
            {agentes.map((a) => (
              <button key={a.id} onClick={() => setActiveAgente(a.id)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${activeAgente === a.id ? co.primary : co.border}`, background: activeAgente === a.id ? co.primary : co.bgCard, color: activeAgente === a.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                {a.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUB TABS */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[{ id: "whatsapp", label: "WhatsApp" }, { id: "qualificacao", label: "Qualificação" }].map((s) => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${activeSection === s.id ? co.primary : co.border}`, background: activeSection === s.id ? co.primary : co.bgCard, color: activeSection === s.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>{s.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 700 }}>
        {activeSection === "whatsapp" && (
          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 28, textAlign: "center" }}>
            {agente.instancia_wpp ? (<>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: co.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
              <h3 style={{ color: co.success, fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>Conectado</h3>
              <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 4px" }}>Instância: {agente.instancia_wpp}</p>
              <p style={{ color: co.textDim, fontSize: 12, margin: "0 0 20px" }}>I.A: {agente.nome}</p>
              <Btn variant="danger" size="sm">Desconectar</Btn>
            </>) : (<>
              <div style={{ width: 200, height: 200, background: co.bg, borderRadius: 12, border: `1px solid ${co.border}`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: co.textDim, fontSize: 13 }}>QR Code aqui</div>
              <h3 style={{ color: co.text, fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>Escaneie o QR Code</h3>
              <p style={{ color: co.textMuted, fontSize: 13 }}>Abra o WhatsApp e escaneie</p>
            </>)}
          </div>
        )}

        {activeSection === "qualificacao" && (<>
          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Status da I.A — {agente.nome}</h3>
            <Toggle value={agente.ia_ativa} onChange={(v) => updateAgente("ia_ativa", v)} label={`I.A ${agente.ia_ativa ? "Ativa" : "Desativada"}`} />
          </div>

          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Mensagem de Saudação</h3>
            <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 14px" }}>Primeira mensagem enviada ao lead</p>
            <Input label="FRASE DE SAUDAÇÃO" value={agente.frase_saudacao || ""} onChange={(v) => updateAgente("frase_saudacao", v)} textarea placeholder="Ex: Tudo bem? Sou o Dr. José..." />
          </div>

          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: 0 }}>Perguntas de Qualificação</h3>
              <span style={{ color: co.textMuted, fontSize: 12 }}>{ativas} de {perguntas.length} ativas</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {perguntas.map((p) => (
                <div key={p.id} style={{ background: co.bg, borderRadius: 10, border: `1px solid ${co.border}`, padding: 16, opacity: p.ativa ? 1 : 0.4, transition: "opacity 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: p.ativa ? co.primaryBg : co.bgCard, color: p.ativa ? co.primary : co.textDim, fontSize: 12, fontWeight: 700 }}>{p.ordem}</span>
                      <span style={{ color: co.textMuted, fontSize: 12, fontWeight: 600 }}>PERGUNTA {p.ordem}</span>
                    </div>
                    <div onClick={() => togglePergunta(p.id)} style={{ width: 36, height: 20, borderRadius: 10, cursor: "pointer", background: p.ativa ? co.success : co.border, position: "relative" }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: p.ativa ? 19 : 3, transition: "left 0.2s" }} />
                    </div>
                  </div>
                  <textarea value={p.pergunta} onChange={(e) => updatePergunta(p.id, e.target.value)} disabled={!p.ativa} rows={2}
                    style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 14, resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Mensagem de Encerramento</h3>
            <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 14px" }}>Mensagem enviada após todas as perguntas</p>
            <Input label="FRASE DE ENCERRAMENTO" value={agente.frase_encerramento || ""} onChange={(v) => updateAgente("frase_encerramento", v)} textarea />
          </div>

          <Btn onClick={handleSave} size="lg" style={{ width: "100%" }}>{saved ? "✓ Salvo!" : "Salvar Configurações"}</Btn>
        </>)}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN — CLIENT LIST
// ============================================================
function AdminClientesView({ onSelectCliente }) {
  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Clientes</h2><p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>{MOCK_CLIENTES.length} cliente(s)</p></div>
        <Btn size="md">+ Novo Cliente</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK_CLIENTES.map((cl) => {
          const ags = MOCK_AGENTES.filter((a) => a.cliente_id === cl.id);
          return (
            <div key={cl.id} onClick={() => onSelectCliente(cl)} style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 20, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = co.borderFocus; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = co.border; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{cl.nome_cliente}</h3>
                  <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 10px" }}>{cl.email}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge color={cl.ativo ? "success" : "danger"}>{cl.ativo ? "Ativo" : "Inativo"}</Badge>
                    {ags.map((a) => <Badge key={a.id} color={a.ia_ativa ? "purple" : "warning"}>{a.nome} {a.ia_ativa ? "ON" : "OFF"}</Badge>)}
                  </div>
                </div>
                <span style={{ color: co.textDim, fontSize: 18 }}>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN — CLIENT EDITOR (all configs in one view per agente)
// ============================================================
function AdminEditorView({ cliente: initialCliente }) {
  const [cliente, setCliente] = useState(initialCliente || MOCK_CLIENTES[0]);
  const [agentes, setAgentes] = useState(MOCK_AGENTES.filter((a) => a.cliente_id === cliente.id));
  const [activeAgente, setActiveAgente] = useState(agentes[0]?.id);
  const [agenteConfigs, setAgenteConfigs] = useState(Object.fromEntries(agentes.map((a) => [a.id, { ...a }])));
  const [saved, setSaved] = useState(false);
  const [showNovaIA, setShowNovaIA] = useState(false);
  const [novaIANome, setNovaIANome] = useState("");

  const agente = agenteConfigs[activeAgente] || {};
  const updateAgente = (f, v) => setAgenteConfigs((p) => ({ ...p, [activeAgente]: { ...p[activeAgente], [f]: v } }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const addIA = () => {
    if (!novaIANome.trim()) return;
    const nid = "a_" + Date.now();
    const nova = { id: nid, cliente_id: cliente.id, nome: novaIANome.trim(), nicho: novaIANome.trim(), instancia_wpp: "", webhook_path: "", url_planilha: "", url_audio: "", frase_gatilho: "", frase_saudacao: "", frase_encerramento: "", prompt_agente: "", prompt_resumo: "", ativo: true, ia_ativa: false };
    setAgentes((p) => [...p, nova]);
    setAgenteConfigs((p) => ({ ...p, [nid]: nova }));
    setActiveAgente(nid);
    setNovaIANome("");
    setShowNovaIA(false);
  };

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Editor — {cliente.nome_cliente}</h2>
        <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>Configuração completa do cliente</p>
      </div>

      {/* AGENTE TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
        {agentes.map((a) => (
          <button key={a.id} onClick={() => setActiveAgente(a.id)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${activeAgente === a.id ? co.primary : co.border}`, background: activeAgente === a.id ? co.primary : co.bgCard, color: activeAgente === a.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            {a.nome || "Nova I.A"}
          </button>
        ))}
        <Btn variant="ghost" size="sm" onClick={() => setShowNovaIA(true)}>+ Nova I.A</Btn>
      </div>

      {activeAgente && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24 }}>
            <Input label="NOME DO CLIENTE" value={agente.nome || ""} onChange={(v) => { updateAgente("nome", v); updateAgente("nicho", v); }} />
            <Input label="INSTÂNCIA WHATSAPP" value={agente.instancia_wpp || ""} onChange={(v) => updateAgente("instancia_wpp", v)} />
            <Input label="WEBHOOK PATH" value={agente.webhook_path || ""} onChange={(v) => updateAgente("webhook_path", v)} />

            <div style={{ display: "flex", gap: 20, margin: "16px 0" }}>
              <Toggle value={agente.ativo ?? true} onChange={(v) => updateAgente("ativo", v)} label="Cliente ativo" />
              <Toggle value={agente.ia_ativa ?? false} onChange={(v) => updateAgente("ia_ativa", v)} label="I.A ativa" />
            </div>

            <div style={{ height: 1, background: co.border, margin: "20px 0" }} />

            <Input label="URL DA PLANILHA (Google Sheets)" value={agente.url_planilha || ""} onChange={(v) => updateAgente("url_planilha", v)} />
            <Input label="URL DO ÁUDIO (Boas-vindas)" value={agente.url_audio || ""} onChange={(v) => updateAgente("url_audio", v)} />
            <Input label="FRASE GATILHO" value={agente.frase_gatilho || ""} onChange={(v) => updateAgente("frase_gatilho", v)} />

            <div style={{ height: 1, background: co.border, margin: "20px 0" }} />

            <Input label="PROMPT DO AGENTE (System Message)" value={agente.prompt_agente || ""} onChange={(v) => updateAgente("prompt_agente", v)} textarea />
            <Input label="PROMPT DO RESUMO (AI Agent1)" value={agente.prompt_resumo || ""} onChange={(v) => updateAgente("prompt_resumo", v)} textarea />
          </div>

          <div style={{ marginTop: 20 }}>
            <Btn onClick={handleSave} size="lg" style={{ width: "100%" }}>{saved ? "✓ Salvo!" : "Salvar Alterações"}</Btn>
          </div>
        </div>
      )}

      {/* MODAL NOVA IA */}
      {showNovaIA && (
        <div onClick={() => setShowNovaIA(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Nova I.A</h3>
            <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 20px" }}>Crie uma nova IA de qualificação para este cliente.</p>
            <Input label="NOME / NICHO" value={novaIANome} onChange={setNovaIANome} placeholder="Ex: BPC/LOAS, Trabalhista..." />
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn variant="ghost" size="md" onClick={() => setShowNovaIA(false)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn size="md" onClick={addIA} disabled={!novaIANome.trim()} style={{ flex: 1 }}>Criar I.A</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);

  useEffect(() => { if (user) setActiveTab(user.role === "admin" ? "clientes" : "kanban"); }, [user]);

  if (!user) return <LoginPage onLogin={setUser} />;

  const handleSelectCliente = (cl) => { setSelectedCliente(cl); setActiveTab("editor"); };
  const clienteId = user.role === "cliente" ? user.cliente_id : selectedCliente?.id;

  const renderContent = () => {
    if (user.role === "admin") {
      if (activeTab === "clientes") return <AdminClientesView onSelectCliente={handleSelectCliente} />;
      if (activeTab === "editor") return <AdminEditorView cliente={selectedCliente} />;
    } else {
      if (activeTab === "kanban") return <KanbanView clienteId={clienteId} />;
      if (activeTab === "config") return <ConfigView clienteId={clienteId} />;
    }
    return null;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: co.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: co.text }}>
      <Sidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => { setUser(null); setActiveTab(null); setSelectedCliente(null); }} />
      <div style={{ flex: 1, overflow: "hidden" }}>{renderContent()}</div>
    </div>
  );
}
