'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

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
}

// ============================================================
// PRIMITIVES
// ============================================================
function Badge({ children, color = "primary" }) {
  const map = { primary: [co.primaryBg, co.primary], success: [co.successBg, co.success], warning: [co.warningBg, co.warning], danger: [co.dangerBg, co.danger], purple: [co.purpleBg, co.purple] }
  const [bg, fg] = map[color] || map.primary
  return <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{children}</span>
}

function Input({ label, value, onChange, type = "text", placeholder, textarea, disabled }) {
  const Tag = textarea ? "textarea" : "input"
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500, letterSpacing: "0.03em" }}>{label}</label>}
      <Tag type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} rows={textarea ? 4 : undefined}
        style={{ width: "100%", padding: textarea ? "10px 14px" : "9px 14px", background: disabled ? co.bg : co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 14, outline: "none", resize: textarea ? "vertical" : "none", fontFamily: "inherit", opacity: disabled ? 0.5 : 1, boxSizing: "border-box" }}
        onFocus={(e) => { if (!disabled) e.target.style.borderColor = co.borderFocus }} onBlur={(e) => { e.target.style.borderColor = co.border }}
      />
    </div>
  )
}

function Btn({ children, onClick, variant = "primary", size = "md", style, disabled }) {
  const v = { primary: [co.primary, co.primaryHover, "#fff", "none"], ghost: ["transparent", co.bgHover, co.textMuted, `1px solid ${co.border}`], danger: [co.dangerBg, "rgba(239,68,68,0.2)", co.danger, "none"], success: [co.successBg, "rgba(16,185,129,0.2)", co.success, "none"] }
  const [bg, hv, fg, bd] = v[variant] || v.primary
  const s = { sm: [12, 6, 12], md: [18, 9, 13], lg: [24, 12, 14] }[size]
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: `${s[1]}px ${s[0]}px`, background: hover && !disabled ? hv : bg, color: fg, border: bd, borderRadius: 8, fontSize: s[2], fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: disabled ? 0.5 : 1, fontFamily: "inherit", ...style }}>
      {children}
    </button>
  )
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
  )
}

function Loading() {
  return (
    <div style={{ padding: 40, color: co.textMuted, fontSize: 14 }}>Carregando...</div>
  )
}

// ============================================================
// LOGIN
// ============================================================
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const go = async () => {
    setLoading(true)
    setError("")

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', data.user.id)
      .single()

    if (!profile) { setError('Perfil não encontrado. Contate o administrador.'); setLoading(false); return }

    let cliente_id = null
    if (profile.role === 'cliente') {
      const { data: cl } = await supabase
        .from('clientes')
        .select('id')
        .eq('profile_id', data.user.id)
        .single()
      cliente_id = cl?.id
    }

    onLogin({ email: data.user.email, nome: profile.nome, role: profile.role, cliente_id })
    setLoading(false)
  }

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
      </div>
    </div>
  )
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ user, activeTab, onTabChange, onLogout }) {
  const isAdmin = user.role === "admin"
  const tabs = isAdmin
    ? [{ id: "clientes", label: "Clientes", icon: "◷" }]
    : [{ id: "kanban", label: "Leads", icon: "◫" }, { id: "chat", label: "Chat", icon: "💬" }, { id: "config", label: "Configurações", icon: "⚙" }]
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
  )
}

// ============================================================
// KANBAN (Cliente)
// ============================================================
function KanbanView({ clienteId }) {
  const [agentes, setAgentes] = useState([])
  const [etapas, setEtapas] = useState([])
  const [leads, setLeads] = useState([])
  const [activeAgente, setActiveAgente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [editingLead, setEditingLead] = useState(null)
  const [savingLead, setSavingLead] = useState(false)
  const [dragItem, setDragItem] = useState(null)
  const [showGerenciar, setShowGerenciar] = useState(false)
  const [etapasEdit, setEtapasEdit] = useState([])
  const [savingEtapas, setSavingEtapas] = useState(false)

  // Carrega agentes do cliente
  useEffect(() => {
    if (!clienteId) return
    supabase
      .from('agentes')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('ativo', true)
      .order('created_at')
      .then(({ data }) => {
        if (data?.length) { setAgentes(data); setActiveAgente(data[0].id) }
        setLoading(false)
      })
  }, [clienteId])

  // Carrega etapas + leads quando agente muda
  useEffect(() => {
    if (!activeAgente) return
    Promise.all([
      supabase.from('etapas_funil').select('*').eq('agente_id', activeAgente).order('ordem'),
      supabase.from('leads').select('*').eq('agente_id', activeAgente).order('created_at', { ascending: false }),
    ]).then(([{ data: et }, { data: ld }]) => {
      setEtapas(et || [])
      setLeads(ld || [])
    })
  }, [activeAgente])

  const handleDrop = async (etapaId) => {
    if (!dragItem) return
    // Atualização otimista
    setLeads(prev => prev.map(l => l.id === dragItem ? { ...l, etapa_id: etapaId } : l))
    setDragItem(null)
    await supabase.from('leads').update({ etapa_id: etapaId }).eq('id', dragItem)
  }

  const activeAgenteObj = agentes.find(a => a.id === activeAgente)
  const corOpts = ["#3B82F6", "#F59E0B", "#8B5CF6", "#10B981", "#EF4444", "#EC4899", "#06B6D4", "#F97316"]

  const openGerenciar = () => {
    setEtapasEdit([...etapas])
    setShowGerenciar(true)
  }

  const addEtapaEdit = () => {
    const mx = Math.max(0, ...etapasEdit.map(e => e.ordem))
    setEtapasEdit(prev => [...prev, { id: 'et_' + Date.now(), agente_id: activeAgente, nome: 'Nova Etapa', cor: '#6366F1', ordem: mx + 1 }])
  }

  const updateEtapaEdit = (id, f, v) => setEtapasEdit(prev => prev.map(e => e.id === id ? { ...e, [f]: v } : e))
  const removeEtapaEdit = (id) => { if (etapasEdit.length > 1) setEtapasEdit(prev => prev.filter(e => e.id !== id)) }

  const saveEtapas = async () => {
    setSavingEtapas(true)
    const originalIds = etapas.map(e => e.id)
    const currentIds = etapasEdit.filter(e => !e.id.startsWith('et_')).map(e => e.id)
    const deletedIds = originalIds.filter(id => !currentIds.includes(id))

    if (deletedIds.length) {
      await supabase.from('etapas_funil').delete().in('id', deletedIds)
    }
    for (const et of etapasEdit) {
      if (et.id.startsWith('et_')) {
        await supabase.from('etapas_funil').insert({ agente_id: activeAgente, nome: et.nome, cor: et.cor, ordem: et.ordem })
      } else {
        await supabase.from('etapas_funil').update({ nome: et.nome, cor: et.cor }).eq('id', et.id)
      }
    }

    const { data } = await supabase.from('etapas_funil').select('*').eq('agente_id', activeAgente).order('ordem')
    setEtapas(data || [])
    setSavingEtapas(false)
    setShowGerenciar(false)
  }

  const updateLead = async () => {
    setSavingLead(true)
    const { data } = await supabase
      .from('leads')
      .update({
        nome: editingLead.nome,
        telefone: editingLead.telefone,
        nicho: editingLead.nicho,
        etapa_id: editingLead.etapa_id,
        resumo: editingLead.resumo,
      })
      .eq('id', editingLead.id)
      .select()
      .single()
    if (data) {
      setLeads(prev => prev.map(l => l.id === data.id ? data : l))
      setSelectedLead(data)
    }
    setSavingLead(false)
    setEditingLead(null)
  }

  if (loading) return <Loading />

  return (
    <div style={{ padding: 28, height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Leads</h2>
          <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>{leads.length} leads no funil</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={openGerenciar}>⚙ Gerenciar Etapas</Btn>
      </div>

      {agentes.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {agentes.map(a => (
            <button key={a.id} onClick={() => setActiveAgente(a.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${activeAgente === a.id ? co.primary : co.border}`, background: activeAgente === a.id ? co.primary : co.bgCard, color: activeAgente === a.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
              {a.nicho}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flex: 1, overflowX: "auto", paddingBottom: 16 }}>
        {etapas.sort((a, b) => a.ordem - b.ordem).map(etapa => {
          const el = leads.filter(l => l.etapa_id === etapa.id)
          return (
            <div key={etapa.id} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(etapa.id)}
              style={{ minWidth: 280, width: 280, display: "flex", flexDirection: "column", background: co.bg, borderRadius: 12, border: `1px solid ${co.border}`, overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${co.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: etapa.cor }} />
                  <span style={{ color: co.text, fontSize: 13, fontWeight: 600 }}>{etapa.nome}</span>
                </div>
                <span style={{ background: co.bgHover, color: co.textMuted, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{el.length}</span>
              </div>
              <div style={{ flex: 1, padding: 10, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {el.map(lead => (
                  <div key={lead.id} draggable onDragStart={() => setDragItem(lead.id)} onClick={() => setSelectedLead(lead)}
                    style={{ padding: 14, background: co.bgCard, borderRadius: 10, border: `1px solid ${co.border}`, cursor: "grab", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = co.borderFocus; e.currentTarget.style.transform = "translateY(-1px)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = co.border; e.currentTarget.style.transform = "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                      <span style={{ color: co.text, fontSize: 13, fontWeight: 600 }}>{lead.nome || lead.telefone}</span>
                      {lead.nicho && <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, background: co.purpleBg, color: co.purple, whiteSpace: "nowrap" }}>{lead.nicho}</span>}
                    </div>
                    <div style={{ color: co.textMuted, fontSize: 11, marginBottom: 6 }}>📱 {lead.telefone?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")}</div>
                    <div style={{ color: co.textDim, fontSize: 10 }}>{lead.created_at?.slice(0, 10)}</div>
                  </div>
                ))}
                {el.length === 0 && <div style={{ padding: 20, textAlign: "center", color: co.textDim, fontSize: 12 }}>Arraste leads para cá</div>}
              </div>
            </div>
          )
        })}
        {etapas.length === 0 && <div style={{ color: co.textMuted, fontSize: 14 }}>Nenhuma etapa configurada para este agente.</div>}
      </div>

      {/* MODAL — DETALHE DO LEAD */}
      {selectedLead && (
        <div onClick={() => setSelectedLead(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 500, maxHeight: "80vh", overflow: "auto", background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
              <div>
                <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedLead.nome || selectedLead.telefone}</h3>
                <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>{selectedLead.telefone?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")}</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Btn size="sm" variant="ghost" onClick={() => { setEditingLead({ ...selectedLead }); setSelectedLead(null) }}>✎ Editar</Btn>
                <button onClick={() => setSelectedLead(null)} style={{ background: "none", border: "none", color: co.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <Badge color="primary">{selectedLead.status}</Badge>
              {selectedLead.nicho && <Badge color="purple">{selectedLead.nicho}</Badge>}
              <Badge color="purple">{selectedLead.created_at?.slice(0, 10)}</Badge>
            </div>
            {selectedLead.resumo ? (
              <div style={{ background: co.bg, borderRadius: 10, padding: 16, border: `1px solid ${co.border}` }}>
                <div style={{ color: co.textDim, fontSize: 11, fontWeight: 600, marginBottom: 10 }}>RESUMO DA QUALIFICAÇÃO</div>
                <p style={{ color: co.text, fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{selectedLead.resumo}</p>
              </div>
            ) : (
              <div style={{ background: co.bg, borderRadius: 10, padding: 20, textAlign: "center", border: `1px solid ${co.border}` }}>
                <p style={{ color: co.textMuted, fontSize: 13, margin: 0 }}>Qualificação em andamento...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL — EDITAR LEAD */}
      {editingLead && (
        <div onClick={() => setEditingLead(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 520, maxHeight: "85vh", overflow: "auto", background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Editar Lead</h3>
                <p style={{ color: co.textMuted, fontSize: 12, margin: "4px 0 0" }}>Atualize as informações do lead</p>
              </div>
              <button onClick={() => setEditingLead(null)} style={{ background: "none", border: "none", color: co.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>NOME</label>
                <input value={editingLead.nome || ''} onChange={e => setEditingLead(p => ({ ...p, nome: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>TELEFONE</label>
                <input value={editingLead.telefone || ''} onChange={e => setEditingLead(p => ({ ...p, telefone: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>NICHO / TIPO</label>
                <input value={editingLead.nicho || ''} onChange={e => setEditingLead(p => ({ ...p, nicho: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>ETAPA DO FUNIL</label>
                <select value={editingLead.etapa_id || ''} onChange={e => setEditingLead(p => ({ ...p, etapa_id: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", cursor: "pointer" }}>
                  {etapas.map(et => <option key={et.id} value={et.id}>{et.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>RESUMO DA QUALIFICAÇÃO</label>
                <textarea value={editingLead.resumo || ''} onChange={e => setEditingLead(p => ({ ...p, resumo: e.target.value }))} rows={6}
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <Btn variant="ghost" onClick={() => setEditingLead(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn onClick={updateLead} disabled={savingLead} style={{ flex: 2 }}>{savingLead ? "Salvando..." : "Atualizar Lead"}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — GERENCIAR ETAPAS */}
      {showGerenciar && (
        <div onClick={() => setShowGerenciar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 560, maxHeight: "85vh", overflow: "auto", background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Gerenciar Etapas — {activeAgenteObj?.nicho}</h3>
                <p style={{ color: co.textMuted, fontSize: 12, margin: "4px 0 0" }}>Edite as etapas do funil desta I.A</p>
              </div>
              <button onClick={() => setShowGerenciar(false)} style={{ background: "none", border: "none", color: co.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {etapasEdit.sort((a, b) => a.ordem - b.ordem).map(et => (
                <div key={et.id} style={{ display: "flex", alignItems: "center", gap: 10, background: co.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${co.border}` }}>
                  <span style={{ color: co.textDim, fontSize: 12, fontWeight: 700, width: 20, textAlign: "center" }}>{et.ordem}</span>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {corOpts.map(cor => <div key={cor} onClick={() => updateEtapaEdit(et.id, "cor", cor)} style={{ width: 16, height: 16, borderRadius: 4, background: cor, cursor: "pointer", border: et.cor === cor ? "2px solid #fff" : "2px solid transparent" }} />)}
                  </div>
                  <input value={et.nome} onChange={e => updateEtapaEdit(et.id, "nome", e.target.value)}
                    style={{ flex: 1, padding: "6px 10px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 6, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={() => removeEtapaEdit(et.id)} disabled={etapasEdit.length <= 1}
                    style={{ background: "none", border: "none", color: co.textDim, cursor: etapasEdit.length <= 1 ? "not-allowed" : "pointer", fontSize: 16, opacity: etapasEdit.length <= 1 ? 0.3 : 1, padding: "2px 6px" }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" size="sm" onClick={addEtapaEdit} style={{ flex: 1 }}>+ Adicionar Etapa</Btn>
              <Btn size="sm" onClick={saveEtapas} disabled={savingEtapas} style={{ flex: 1 }}>{savingEtapas ? "Salvando..." : "Salvar"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// CONFIG (Cliente)
// ============================================================
function ConfigView({ clienteId }) {
  const [agentes, setAgentes] = useState([])
  const [activeAgente, setActiveAgente] = useState(null)
  const [agenteConfigs, setAgenteConfigs] = useState({})
  const [perguntas, setPerguntas] = useState([])
  const [activeSection, setActiveSection] = useState("whatsapp")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // WhatsApp / UazAPI states
  const [wppPhase, setWppPhase] = useState('idle') // 'idle' | 'connecting' | 'scanning' | 'disconnected'
  const [wppQr, setWppQr] = useState(null)
  const [wppError, setWppError] = useState(null)
  const [wppDisconnecting, setWppDisconnecting] = useState(false)
  const [wppRealConnected, setWppRealConnected] = useState(null) // null=checking | true | false
  const wppPollRef = useRef(null)

  useEffect(() => {
    if (!clienteId) return
    supabase.from('agentes').select('*').eq('cliente_id', clienteId).order('created_at')
      .then(({ data }) => {
        if (data?.length) {
          setAgentes(data)
          setActiveAgente(data[0].id)
          setAgenteConfigs(Object.fromEntries(data.map(a => [a.id, { ...a }])))
        }
      })
  }, [clienteId])

  useEffect(() => {
    if (!activeAgente) return
    supabase.from('perguntas_qualificacao').select('*').eq('agente_id', activeAgente).order('ordem')
      .then(({ data }) => setPerguntas(data || []))
  }, [activeAgente])

  const agente = agenteConfigs[activeAgente] || {}
  const ativas = perguntas.filter(p => p.ativa).length

  const updateAgente = (f, v) => setAgenteConfigs(prev => ({ ...prev, [activeAgente]: { ...prev[activeAgente], [f]: v } }))
  const updatePergunta = (id, v) => setPerguntas(prev => prev.map(p => p.id === id ? { ...p, pergunta: v } : p))
  const togglePergunta = (id) => setPerguntas(prev => prev.map(p => p.id === id ? { ...p, ativa: !p.ativa } : p))

  const handleSave = async () => {
    setSaving(true)
    const cfg = agenteConfigs[activeAgente]
    await supabase.from('agentes').update({
      ia_ativa: cfg.ia_ativa,
      frase_saudacao: cfg.frase_saudacao,
      frase_encerramento: cfg.frase_encerramento,
    }).eq('id', activeAgente)

    for (const p of perguntas) {
      await supabase.from('perguntas_qualificacao').update({ pergunta: p.pergunta, ativa: p.ativa }).eq('id', p.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Quando muda de agente, resetar e verificar status real com UazAPI
  useEffect(() => {
    setWppPhase('idle')
    setWppQr(null)
    setWppError(null)
    setWppRealConnected(null)
    if (wppPollRef.current) { clearInterval(wppPollRef.current); wppPollRef.current = null }

    if (!activeAgente) return
    const a = agenteConfigs[activeAgente]
    if (!a?.uazapi_instance_id) return

    // Tem instância — verificar se realmente conectado
    setWppRealConnected(null) // checking
    fetch(`/api/whatsapp/status?agenteId=${activeAgente}`)
      .then(r => r.json())
      .then(d => setWppRealConnected(d.connected === true))
      .catch(() => setWppRealConnected(false))
  }, [activeAgente])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => { if (wppPollRef.current) clearInterval(wppPollRef.current) }
  }, [])

  const startWppPoll = (agenteId) => {
    if (wppPollRef.current) clearInterval(wppPollRef.current)
    wppPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/qrcode?agenteId=${agenteId}`)
        const data = await res.json()
        if (data.connected) {
          clearInterval(wppPollRef.current)
          wppPollRef.current = null
          setWppPhase('idle')
          setWppQr(null)
          setWppRealConnected(true)
          // Recarregar dados do agente
          const { data: updated } = await supabase.from('agentes').select('*').eq('id', agenteId).single()
          if (updated) setAgenteConfigs(prev => ({ ...prev, [agenteId]: updated }))
        } else if (data.qrCode) {
          setWppQr(data.qrCode)
        }
      } catch (_) {}
    }, 5000)
  }

  const conectarWhatsApp = async () => {
    setWppPhase('connecting')
    setWppError(null)
    const nomeSanitizado = (agente.nome || 'agente').toLowerCase().replace(/[^a-z0-9]/g, '-')
    const nomeInstancia = `ia-${nomeSanitizado}-${activeAgente.substring(0, 6)}`
    try {
      const res = await fetch('/api/whatsapp/conectar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId: activeAgente, nomeInstancia }),
      })
      const data = await res.json()
      if (!res.ok) { setWppError(data.error || 'Erro ao conectar'); setWppPhase('idle'); return }
      if (data.qrCode) setWppQr(data.qrCode)
      setWppPhase('scanning')
      startWppPoll(activeAgente)
    } catch (err) {
      setWppError('Erro de conexão com o servidor')
      setWppPhase('idle')
    }
  }

  const reconectarWhatsApp = async () => {
    setWppPhase('scanning')
    setWppQr(null)
    setWppError(null)
    // Usa instância existente — chama /qrcode que aciona /instance/connect internamente
    startWppPoll(activeAgente)
    // Buscar QR imediato
    try {
      const res = await fetch(`/api/whatsapp/qrcode?agenteId=${activeAgente}`)
      const data = await res.json()
      if (data.connected) {
        setWppPhase('idle')
        setWppRealConnected(true)
      } else if (data.qrCode) {
        setWppQr(data.qrCode)
      }
    } catch (_) {}
  }

  const desconectarWhatsApp = async () => {
    setWppDisconnecting(true)
    try {
      await fetch('/api/whatsapp/desconectar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId: activeAgente }),
      })
      setAgenteConfigs(prev => ({ ...prev, [activeAgente]: { ...prev[activeAgente], uazapi_instance_id: null, uazapi_token: null, instancia_wpp: null } }))
      setWppPhase('idle')
      setWppRealConnected(null)
    } catch (_) {
      setWppError('Erro ao desconectar')
    }
    setWppDisconnecting(false)
  }

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Configurações</h2>
        <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>Gerencie suas IAs de qualificação</p>
      </div>

      {agentes.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 8, fontWeight: 500 }}>SELECIONE A I.A</label>
          <div style={{ display: "flex", gap: 8 }}>
            {agentes.map(a => (
              <button key={a.id} onClick={() => setActiveAgente(a.id)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${activeAgente === a.id ? co.primary : co.border}`, background: activeAgente === a.id ? co.primary : co.bgCard, color: activeAgente === a.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                {a.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[{ id: "whatsapp", label: "WhatsApp" }, { id: "qualificacao", label: "Qualificação" }].map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${activeSection === s.id ? co.primary : co.border}`, background: activeSection === s.id ? co.primary : co.bgCard, color: activeSection === s.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>{s.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 700 }}>
        {activeSection === "whatsapp" && (() => {
          const hasInstance = !!agente.uazapi_instance_id
          const isConnected = hasInstance && wppRealConnected === true
          const isDisconnected = hasInstance && wppRealConnected === false && wppPhase === 'idle'
          const isChecking = hasInstance && wppRealConnected === null && wppPhase === 'idle'

          // Verificando status
          if (isChecking) return (
            <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 40, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: co.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>⏳</div>
              <h3 style={{ color: co.text, fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Verificando conexão...</h3>
            </div>
          )

          // Conectado
          if (isConnected) return (
            <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 28, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: co.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>✓</div>
              <h3 style={{ color: co.success, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>WhatsApp Conectado</h3>
              <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 4px" }}>Instância: <strong style={{ color: co.text }}>{agente.instancia_wpp}</strong></p>
              <p style={{ color: co.textDim, fontSize: 12, margin: "0 0 24px" }}>I.A: {agente.nome}</p>
              <Btn variant="danger" size="sm" onClick={desconectarWhatsApp} disabled={wppDisconnecting}>
                {wppDisconnecting ? "Desconectando..." : "Desconectar"}
              </Btn>
            </div>
          )

          // Desconectado (tem instância mas WPP desconectado)
          if (isDisconnected) return (
            <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 40, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: co.warningBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>⚠</div>
              <h3 style={{ color: co.warning, fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>WhatsApp Desconectado</h3>
              <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 4px" }}>Instância: <strong style={{ color: co.text }}>{agente.instancia_wpp}</strong></p>
              <p style={{ color: co.textDim, fontSize: 12, margin: "0 0 24px" }}>Escaneie novamente para reconectar</p>
              {wppError && <p style={{ color: co.danger, fontSize: 13, margin: "0 0 16px", padding: "8px 16px", background: co.dangerBg, borderRadius: 8 }}>{wppError}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Btn onClick={reconectarWhatsApp}>Reconectar</Btn>
                <Btn variant="ghost" size="sm" onClick={desconectarWhatsApp} disabled={wppDisconnecting}>
                  {wppDisconnecting ? "..." : "Desconectar"}
                </Btn>
              </div>
            </div>
          )

          if (wppPhase === 'connecting') return (
            <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 40, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: co.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>⏳</div>
              <h3 style={{ color: co.text, fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Criando instância...</h3>
              <p style={{ color: co.textMuted, fontSize: 13 }}>Aguarde um momento</p>
            </div>
          )

          if (wppPhase === 'scanning') return (
            <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 28, textAlign: "center" }}>
              {wppQr ? (
                <img src={wppQr} alt="QR Code WhatsApp" style={{ width: 220, height: 220, borderRadius: 12, margin: "0 auto 20px", display: "block", border: `4px solid ${co.border}` }} />
              ) : (
                <div style={{ width: 220, height: 220, background: co.bg, borderRadius: 12, border: `1px solid ${co.border}`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: co.textDim, fontSize: 13 }}>Gerando QR Code...</div>
              )}
              <h3 style={{ color: co.text, fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Escaneie o QR Code</h3>
              <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 4px" }}>Abra o WhatsApp → Aparelhos conectados → Conectar aparelho</p>
              <p style={{ color: co.textDim, fontSize: 12, margin: "0 0 20px" }}>Verificando a cada 5 segundos...</p>
              <Btn variant="ghost" size="sm" onClick={() => { if (wppPollRef.current) { clearInterval(wppPollRef.current); wppPollRef.current = null } setWppPhase('idle'); setWppQr(null) }}>Cancelar</Btn>
            </div>
          )

          return (
            <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 40, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: co.bgHover, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 34 }}>📱</div>
              <h3 style={{ color: co.text, fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Conectar WhatsApp</h3>
              <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 8px" }}>Conecte o WhatsApp da sua I.A de qualificação</p>
              <p style={{ color: co.textDim, fontSize: 12, margin: "0 0 24px" }}>Um QR Code será gerado para escanear com o celular</p>
              {wppError && <p style={{ color: co.danger, fontSize: 13, margin: "0 0 16px", padding: "8px 16px", background: co.dangerBg, borderRadius: 8 }}>{wppError}</p>}
              <Btn onClick={conectarWhatsApp}>Conectar WhatsApp</Btn>
            </div>
          )
        })()}

        {activeSection === "qualificacao" && (<>
          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Status da I.A — {agente.nome}</h3>
            <Toggle value={agente.ia_ativa ?? false} onChange={async v => { updateAgente("ia_ativa", v); await supabase.from('agentes').update({ ia_ativa: v }).eq('id', activeAgente) }} label={`I.A ${agente.ia_ativa ? "Ativa" : "Desativada"}`} />
          </div>

          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Mensagem de Saudação</h3>
            <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 14px" }}>Primeira mensagem enviada ao lead</p>
            <Input label="FRASE DE SAUDAÇÃO" value={agente.frase_saudacao || ""} onChange={v => updateAgente("frase_saudacao", v)} textarea placeholder="Ex: Tudo bem? Sou o Dr. José..." />
          </div>

          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: 0 }}>Perguntas de Qualificação</h3>
              <span style={{ color: co.textMuted, fontSize: 12 }}>{ativas} de {perguntas.length} ativas</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {perguntas.map(p => (
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
                  <textarea value={p.pergunta} onChange={e => updatePergunta(p.id, e.target.value)} disabled={!p.ativa} rows={2}
                    style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 14, resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24, marginBottom: 20 }}>
            <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 20px" }}>Mensagem de Encerramento</h3>
            <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 14px" }}>Mensagem enviada após todas as perguntas</p>
            <Input label="FRASE DE ENCERRAMENTO" value={agente.frase_encerramento || ""} onChange={v => updateAgente("frase_encerramento", v)} textarea />
          </div>

          <Btn onClick={handleSave} size="lg" disabled={saving} style={{ width: "100%" }}>
            {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Configurações"}
          </Btn>
        </>)}
      </div>
    </div>
  )
}

// ============================================================
// ADMIN — LISTA DE CLIENTES
// ============================================================
// ============================================================
// CHAT (Cliente)
// ============================================================
function ChatView({ clienteId }) {
  const [conversations, setConversations] = useState([])
  const [leads, setLeads] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  // Refs persistem entre re-renders sem causar re-renders desnecessários
  const leadsRef = useRef([])
  const agenteIdsRef = useRef([])

  // Carrega agentes + leads na inicialização
  useEffect(() => {
    const init = async () => {
      const { data: ags } = await supabase
        .from('agentes')
        .select('id, uazapi_token')
        .eq('cliente_id', clienteId)

      if (!ags?.length) { setLoading(false); return }

      agenteIdsRef.current = ags.map(a => a.id)

      // Leads enriquecem o sidebar com nome/nicho, mas não são obrigatórios
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, telefone, nome, nicho, agente_id')
        .in('agente_id', agenteIdsRef.current)

      leadsRef.current = leadsData || []
      setLeads(leadsData || [])

      await refreshConversas()
      setLoading(false)
    }
    init()
  }, [clienteId])

  // Polling do sidebar a cada 5s — detecta novas mensagens/conversas via webhook
  useEffect(() => {
    if (loading) return
    const interval = setInterval(refreshConversas, 5000)
    return () => clearInterval(interval)
  }, [loading])

  // Sidebar: apenas leads cadastrados (quem usou a frase gatilho no WhatsApp)
  // Enriquece com última mensagem de cada conversa para o preview
  const refreshConversas = async () => {
    const leadsData = leadsRef.current
    if (!leadsData.length) { setConversations([]); return }

    const telefones = leadsData.map(l => l.telefone).filter(Boolean)
    if (!telefones.length) { setConversations([]); return }

    // Pega última mensagem de cada lead para o preview do sidebar
    const { data: chatData } = await supabase
      .from('chat_messages')
      .select('id, session_id, type, content')
      .in('session_id', telefones)
      .order('id', { ascending: false })

    const lastMsgMap = {}
    for (const msg of (chatData || [])) {
      if (!lastMsgMap[msg.session_id]) lastMsgMap[msg.session_id] = msg
    }

    const convs = leadsData
      .filter(l => l.telefone)
      .map(lead => ({
        session_id: lead.telefone,
        agente_id: lead.agente_id,
        lead,
        lastMessage: lastMsgMap[lead.telefone]
          ? { content: lastMsgMap[lead.telefone].content, type: lastMsgMap[lead.telefone].type }
          : null,
        lastId: lastMsgMap[lead.telefone]?.id || 0,
      }))
      .sort((a, b) => b.lastId - a.lastId)

    setConversations(convs)
  }

  // Polling de mensagens da conversa selecionada (2s)
  useEffect(() => {
    if (!selectedSession) return
    let cancelled = false

    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/chat/historico?telefone=${selectedSession}`)
        if (!res.ok || cancelled) return
        const { messages: newMsgs } = await res.json()
        if (cancelled || !newMsgs?.length) return

        setMessages(prev => {
          const prevIds = new Set(prev.filter(m => !String(m.id).startsWith('temp_')).map(m => m.id))
          const hasNew = newMsgs.some(m => !prevIds.has(m.id))
          if (!hasNew) return prev
          const pendingTemps = prev.filter(m =>
            String(m.id).startsWith('temp_') && !newMsgs.some(n => n.content === m.content)
          )
          return [...newMsgs, ...pendingTemps]
        })

        // Atualiza preview do sidebar
        const last = newMsgs[newMsgs.length - 1]
        setConversations(prev => prev.map(c =>
          c.session_id === selectedSession
            ? { ...c, lastMessage: { content: last.content, type: last.type }, lastId: last.timestamp }
            : c
        ))
      } catch (e) {
        console.error('[chat poll] erro:', e)
      }
    }

    fetchMsgs()
    const interval = setInterval(fetchMsgs, 2000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [selectedSession])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // selectedLead e selectedConv para enriquecer header e obter agente_id
  const selectedLead = leads.find(l => l.telefone === selectedSession)
  const selectedConv = conversations.find(c => c.session_id === selectedSession)
  const getAgenteId = () => selectedLead?.agente_id || selectedConv?.agente_id || null

  const displayName = selectedLead?.nome || selectedConv?.lead?.nome || selectedSession?.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4') || '?'

  const sendMessage = async (tipo, conteudo) => {
    const agenteId = getAgenteId()
    if (!agenteId || !selectedSession || !conteudo) return

    const tempId = `temp_${Date.now()}`
    setMessages(prev => [...prev, { id: tempId, type: 'agent', content: conteudo, mediaUrl: tipo !== 'text' ? conteudo : null, mediaType: tipo !== 'text' ? tipo : null }])

    setSending(true)
    try {
      const res = await fetch('/api/chat/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId, telefone: selectedSession, tipo, conteudo }),
      })
      if (!res.ok) setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const sendText = async () => {
    const text = inputText.trim()
    if (!text || sending) return
    setInputText('')
    await sendMessage('text', text)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch {
      alert('Permissão de microfone negada.')
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return
    setRecording(false)
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop())
    await new Promise(r => { mediaRecorderRef.current.onstop = r })
    const blob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' })
    const fileName = `ptt_${Date.now()}.ogg`
    const { error } = await supabase.storage.from('chat-media').upload(fileName, blob, { contentType: 'audio/ogg' })
    if (error) { console.error('Upload áudio:', error); return }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendMessage('ptt', pub.publicUrl)
  }

  const sendMedia = async (file) => {
    const tipo = file.type.startsWith('image/') ? 'image' : 'document'
    const fileName = `${tipo}_${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('chat-media').upload(fileName, file, { contentType: file.type })
    if (error) { console.error('Upload mídia:', error); return }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendMessage(tipo, pub.publicUrl)
  }

  const filtered = conversations.filter(c =>
    (c.lead?.nome || c.session_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <Loading />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* LISTA DE CONVERSAS */}
      <div style={{ width: 300, borderRight: `1px solid ${co.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${co.border}` }}>
          <h2 style={{ color: co.text, fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Chat</h2>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar conversas..."
            style={{ width: '100%', padding: '8px 12px', background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(conv => {
            const name = conv.lead?.nome || conv.session_id?.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4') || conv.session_id
            const isSelected = selectedSession === conv.session_id
            return (
              <div key={conv.session_id} onClick={() => { setMessages([]); setSelectedSession(conv.session_id) }}
                style={{ padding: '14px 16px', cursor: 'pointer', background: isSelected ? co.primaryBg : 'transparent', borderBottom: `1px solid ${co.border}`, transition: 'background 0.1s', borderLeft: isSelected ? `3px solid ${co.primary}` : '3px solid transparent' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = co.bgHover }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ color: co.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{name}</span>
                  {conv.lead?.nicho && <span style={{ fontSize: 10, color: co.purple, fontWeight: 600, flexShrink: 0 }}>{conv.lead.nicho}</span>}
                </div>
                <p style={{ color: co.textMuted, fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage
                    ? `${conv.lastMessage.type === 'human' ? '' : '→ '}${conv.lastMessage.content?.slice(0, 40) || ''}${(conv.lastMessage.content?.length || 0) > 40 ? '...' : ''}`
                    : <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Nenhuma mensagem</span>}
                </p>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: co.textMuted, fontSize: 13 }}>
              {conversations.length === 0 ? 'Aguardando mensagens via WhatsApp...' : 'Nenhum resultado'}
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE MENSAGENS */}
      {selectedSession ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* HEADER */}
          <div style={{ padding: '14px 24px', borderBottom: `1px solid ${co.border}`, display: 'flex', alignItems: 'center', gap: 12, background: co.bgCard, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${co.primary}, ${co.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {displayName[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: co.text, fontWeight: 600, fontSize: 15 }}>{displayName}</div>
              <div style={{ color: co.textMuted, fontSize: 11 }}>{selectedSession?.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4')}</div>
            </div>
            {(selectedLead?.nicho || selectedConv?.lead?.nicho) && (
              <Badge color="purple">{selectedLead?.nicho || selectedConv?.lead?.nicho}</Badge>
            )}
          </div>

          {/* MENSAGENS */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 10, background: co.bg }}>
            {messages.map((msg) => {
              const type = msg.type || 'human'
              const content = msg.content || ''
              const mediaUrl = msg.mediaUrl || null
              const mediaType = msg.mediaType || null
              const isRight = type === 'ai' || type === 'agent'
              const bubbleBg = type === 'agent' ? co.success : type === 'ai' ? co.primary : co.bgCard
              const bubbleColor = isRight ? '#fff' : co.text
              const bubbleRadius = isRight ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '68%', padding: '10px 14px', borderRadius: bubbleRadius, background: bubbleBg, border: isRight ? 'none' : `1px solid ${co.border}`, color: bubbleColor, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {mediaUrl && (mediaType === 'ptt' || mediaType === 'audio') ? (
                      <audio controls src={mediaUrl} style={{ maxWidth: 260, height: 36, display: 'block' }} />
                    ) : mediaUrl && mediaType === 'image' ? (
                      <img src={mediaUrl} alt="imagem" style={{ maxWidth: 240, maxHeight: 240, borderRadius: 8, display: 'block', cursor: 'pointer' }} onClick={() => window.open(mediaUrl, '_blank')} />
                    ) : mediaUrl ? (
                      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📎</span><span>{content || 'Arquivo'}</span>
                      </a>
                    ) : content}
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: co.textMuted, fontSize: 13, marginTop: 40, lineHeight: 1.8 }}>
                Nenhuma mensagem ainda.<br />
                <span style={{ fontSize: 11, opacity: 0.6 }}>As mensagens aparecem em tempo real via webhook.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { sendMedia(e.target.files[0]); e.target.value = '' } }} />
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${co.border}`, display: 'flex', gap: 8, alignItems: 'center', background: co.bgCard, flexShrink: 0 }}>
            <button onClick={() => fileInputRef.current?.click()} title="Enviar arquivo" disabled={sending || recording}
              style={{ width: 38, height: 38, borderRadius: 8, background: co.bgInput, border: `1px solid ${co.border}`, color: co.textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || recording) ? 0.4 : 1 }}>
              📎
            </button>
            <input
              value={recording ? '' : inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() } }}
              placeholder={recording ? '● Gravando...' : 'Digite uma mensagem...'}
              disabled={sending || recording}
              style={{ flex: 1, padding: '10px 16px', background: co.bgInput, border: `1px solid ${recording ? co.danger : co.border}`, borderRadius: 24, color: recording ? co.danger : co.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: recording ? 'default' : 'text' }}
            />
            <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
              title="Segurar para gravar áudio" disabled={sending}
              style={{ width: 38, height: 38, borderRadius: '50%', background: recording ? co.dangerBg : co.bgInput, border: `1px solid ${recording ? co.danger : co.border}`, color: recording ? co.danger : co.textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', opacity: sending ? 0.4 : 1 }}>
              🎤
            </button>
            <button onClick={sendText} disabled={sending || recording || !inputText.trim()}
              style={{ width: 38, height: 38, borderRadius: '50%', background: co.primary, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || recording || !inputText.trim()) ? 0.4 : 1, transition: 'opacity 0.15s' }}>
              {sending ? '⋯' : '→'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: co.bg }}>
          <div style={{ fontSize: 56, opacity: 0.3 }}>💬</div>
          <p style={{ color: co.textMuted, fontSize: 14, margin: 0 }}>Selecione uma conversa</p>
        </div>
      )}
    </div>
  )
}

function AdminClientesView({ onSelectCliente }) {
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', nome_cliente: '', email: '', senha: '' })
  const [criando, setCriando] = useState(false)
  const [erroNovo, setErroNovo] = useState('')
  const [editingCliente, setEditingCliente] = useState(null)
  const [savingCliente, setSavingCliente] = useState(false)
  const [erroEdit, setErroEdit] = useState('')

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('*, agentes(id, nome, ativo, ia_ativa)')
    setClientes(data || [])
    setLoading(false)
  }

  const openEditCliente = async (cl) => {
    const { data: profile } = await supabase.from('profiles').select('nome, email').eq('id', cl.profile_id).single()
    setEditingCliente({ id: cl.id, profile_id: cl.profile_id, nome_cliente: cl.nome_cliente, nome: profile?.nome || '', email: profile?.email || '' })
    setErroEdit('')
  }

  const atualizarCliente = async () => {
    if (!editingCliente.nome_cliente || !editingCliente.nome) { setErroEdit('Preencha todos os campos'); return }
    setSavingCliente(true)
    setErroEdit('')
    const res = await fetch('/api/admin/atualizar-cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCliente),
    })
    const data = await res.json()
    if (!res.ok) { setErroEdit(data.error || 'Erro ao atualizar'); setSavingCliente(false); return }
    await fetchClientes()
    setEditingCliente(null)
    setSavingCliente(false)
  }

  useEffect(() => { fetchClientes() }, [])

  const criarCliente = async () => {
    if (!novoForm.email || !novoForm.nome || !novoForm.nome_cliente || !novoForm.senha) {
      setErroNovo('Preencha todos os campos')
      return
    }
    setCriando(true)
    setErroNovo('')
    const res = await fetch('/api/admin/criar-cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoForm),
    })
    const data = await res.json()
    if (!res.ok) { setErroNovo(data.error || 'Erro ao criar cliente'); setCriando(false); return }
    await fetchClientes()
    setShowNovoCliente(false)
    setNovoForm({ nome: '', nome_cliente: '', email: '', senha: '' })
    setCriando(false)
  }

  if (loading) return <Loading />

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Clientes</h2><p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>{clientes.filter(c => { const at = (c.agentes||[]).some(a=>a.ativo); return filtro==='todos'||(filtro==='ativo'?at:!at) }).length} cliente(s)</p></div>
        <Btn size="md" onClick={() => setShowNovoCliente(true)}>+ Novo Cliente</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {['todos', 'ativo', 'desativado'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{ padding: "6px 16px", borderRadius: 8, border: `1px solid ${filtro === f ? co.primary : co.border}`, background: filtro === f ? co.primary : co.bgCard, color: filtro === f ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", textTransform: "capitalize" }}>
            {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Desativados'}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {clientes.filter(c => {
          const ativo = (c.agentes || []).some(a => a.ativo)
          return filtro === 'todos' || (filtro === 'ativo' ? ativo : !ativo)
        }).map(cl => {
          const ags = cl.agentes || []
          const clienteAtivo = ags.some(a => a.ativo)
          return (
            <div key={cl.id} onClick={() => onSelectCliente(cl)} style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 20, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = co.borderFocus }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = co.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{cl.nome_cliente}</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge color={clienteAtivo ? "success" : "danger"}>{clienteAtivo ? "Ativo" : "Desativado"}</Badge>
                    {ags.map(a => <Badge key={a.id} color={!a.ativo ? "danger" : a.ia_ativa ? "purple" : "warning"}>{a.nome} {!a.ativo ? "DESATIVADO" : a.ia_ativa ? "ON" : "OFF"}</Badge>)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openEditCliente(cl) }}>✎ Editar</Btn>
                  <span style={{ color: co.textDim, fontSize: 18 }}>→</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editingCliente && (
        <div onClick={() => setEditingCliente(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Editar Cliente</h3>
            <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 20px" }}>Atualize as informações do escritório.</p>
            <Input label="NOME DO RESPONSÁVEL" value={editingCliente.nome} onChange={v => setEditingCliente(p => ({ ...p, nome: v }))} placeholder="Dr. João Silva" />
            <Input label="NOME DO ESCRITÓRIO" value={editingCliente.nome_cliente} onChange={v => setEditingCliente(p => ({ ...p, nome_cliente: v }))} placeholder="Silva Advocacia" />
            <div style={{ marginBottom: 16, padding: "10px 14px", background: co.bg, borderRadius: 8, border: `1px solid ${co.border}` }}>
              <span style={{ fontSize: 11, color: co.textDim, fontWeight: 500 }}>EMAIL (não editável): </span>
              <span style={{ fontSize: 13, color: co.textMuted }}>{editingCliente.email}</span>
            </div>
            {erroEdit && <p style={{ color: co.danger, fontSize: 13, margin: "0 0 16px", padding: "8px 12px", background: co.dangerBg, borderRadius: 8 }}>{erroEdit}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn variant="ghost" size="md" onClick={() => setEditingCliente(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn size="md" onClick={atualizarCliente} disabled={savingCliente} style={{ flex: 1 }}>{savingCliente ? "Salvando..." : "Atualizar Cliente"}</Btn>
            </div>
          </div>
        </div>
      )}

      {showNovoCliente && (
        <div onClick={() => setShowNovoCliente(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Novo Cliente</h3>
            <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 20px" }}>Cria o usuário e o escritório no sistema.</p>
            <Input label="NOME DO RESPONSÁVEL" value={novoForm.nome} onChange={v => setNovoForm(p => ({ ...p, nome: v }))} placeholder="Dr. João Silva" />
            <Input label="NOME DO ESCRITÓRIO" value={novoForm.nome_cliente} onChange={v => setNovoForm(p => ({ ...p, nome_cliente: v }))} placeholder="Silva Advocacia" />
            <Input label="EMAIL" value={novoForm.email} onChange={v => setNovoForm(p => ({ ...p, email: v }))} placeholder="joao@escritorio.com" />
            <Input label="SENHA TEMPORÁRIA" value={novoForm.senha} onChange={v => setNovoForm(p => ({ ...p, senha: v }))} type="password" placeholder="mínimo 6 caracteres" />
            {erroNovo && <p style={{ color: co.danger, fontSize: 13, margin: "0 0 16px", padding: "8px 12px", background: co.dangerBg, borderRadius: 8 }}>{erroNovo}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn variant="ghost" size="md" onClick={() => setShowNovoCliente(false)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn size="md" onClick={criarCliente} disabled={criando} style={{ flex: 1 }}>{criando ? "Criando..." : "Criar Cliente"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// ADMIN — EDITOR DE CLIENTE
// ============================================================
function AdminEditorView({ cliente: initialCliente }) {
  const [agentes, setAgentes] = useState([])
  const [activeAgente, setActiveAgente] = useState(null)
  const [agenteConfigs, setAgenteConfigs] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showNovaIA, setShowNovaIA] = useState(false)
  const [novaIANome, setNovaIANome] = useState("")
  const [criandoIA, setCriandoIA] = useState(false)

  const fetchAgentes = async () => {
    const { data } = await supabase.from('agentes').select('*').eq('cliente_id', initialCliente.id).order('created_at')
    if (data?.length) {
      setAgentes(data)
      setActiveAgente(prev => prev || data[0].id)
      setAgenteConfigs(prev => {
        const next = Object.fromEntries(data.map(a => [a.id, prev[a.id] || { ...a }]))
        return next
      })
    }
  }

  useEffect(() => { fetchAgentes() }, [initialCliente.id])

  const agente = agenteConfigs[activeAgente] || {}
  const updateAgente = (f, v) => setAgenteConfigs(prev => ({ ...prev, [activeAgente]: { ...prev[activeAgente], [f]: v } }))

  const handleSave = async () => {
    setSaving(true)
    const cfg = agenteConfigs[activeAgente]
    await supabase.from('agentes').update({
      nome: cfg.nome,
      nicho: cfg.nicho || cfg.nome,
      webhook_path: cfg.webhook_path,
      ativo: cfg.ativo,
      ia_ativa: cfg.ia_ativa,
      url_planilha: cfg.url_planilha,
      url_audio: cfg.url_audio,
      frase_gatilho: cfg.frase_gatilho,
      prompt_agente: cfg.prompt_agente,
      prompt_resumo: cfg.prompt_resumo,
    }).eq('id', activeAgente)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addIA = async () => {
    if (!novaIANome.trim()) return
    setCriandoIA(true)
    const { data } = await supabase.from('agentes').insert({
      cliente_id: initialCliente.id,
      nome: novaIANome.trim(),
      nicho: novaIANome.trim(),
      ativo: true,
      ia_ativa: false,
      frase_gatilho: 'quero mais informações',
    }).select().single()
    if (data) {
      await fetchAgentes()
      setActiveAgente(data.id)
    }
    setNovaIANome("")
    setShowNovaIA(false)
    setCriandoIA(false)
  }

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Editor — {initialCliente.nome_cliente}</h2>
        <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>Configuração completa do cliente</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
        {agentes.map(a => (
          <button key={a.id} onClick={() => setActiveAgente(a.id)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${activeAgente === a.id ? co.primary : co.border}`, background: activeAgente === a.id ? co.primary : co.bgCard, color: activeAgente === a.id ? "#fff" : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            {a.nome || "Nova I.A"}
          </button>
        ))}
        <Btn variant="ghost" size="sm" onClick={() => setShowNovaIA(true)}>+ Nova I.A</Btn>
      </div>

      {activeAgente && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${co.border}`, padding: 24 }}>
            <Input label="NOME DA I.A / NICHO" value={agente.nome || ""} onChange={v => { updateAgente("nome", v); updateAgente("nicho", v) }} />

            {/* Seção WhatsApp — auto-gerenciada pela conexão do cliente */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 8, fontWeight: 500, letterSpacing: "0.03em" }}>WHATSAPP / UAZAPI</label>
              {agente.instancia_wpp ? (
                <div style={{ background: co.bg, borderRadius: 8, border: `1px solid ${co.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid ${co.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: co.textDim, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 3 }}>INSTÂNCIA (webhook N8N)</div>
                      <div style={{ fontSize: 13, color: co.text, fontFamily: "monospace" }}>{agente.instancia_wpp}</div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(agente.instancia_wpp)} style={{ fontSize: 11, color: co.textMuted, background: co.bgCard, border: `1px solid ${co.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>Copiar</button>
                  </div>
                  <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: co.textDim, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 3 }}>TOKEN (API / envio de mensagens)</div>
                      <div style={{ fontSize: 13, color: co.text, fontFamily: "monospace", wordBreak: "break-all" }}>{agente.uazapi_token || "—"}</div>
                    </div>
                    {agente.uazapi_token && <button onClick={() => navigator.clipboard.writeText(agente.uazapi_token)} style={{ fontSize: 11, color: co.textMuted, background: co.bgCard, border: `1px solid ${co.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginLeft: 12 }}>Copiar</button>}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "12px 14px", background: co.bg, borderRadius: 8, border: `1px solid ${co.border}`, color: co.textDim, fontSize: 13 }}>
                  WhatsApp não conectado — o cliente deve conectar em <strong style={{ color: co.textMuted }}>Configurações → WhatsApp</strong>
                </div>
              )}
            </div>

            <Input label="WEBHOOK PATH" value={agente.webhook_path || ""} onChange={v => updateAgente("webhook_path", v)} />

            <div style={{ display: "flex", gap: 20, margin: "16px 0" }}>
              <Toggle value={agente.ativo ?? true} onChange={async v => { updateAgente("ativo", v); await supabase.from('agentes').update({ ativo: v }).eq('id', activeAgente) }} label="Cliente ativo" />
              <Toggle value={agente.ia_ativa ?? false} onChange={async v => { updateAgente("ia_ativa", v); await supabase.from('agentes').update({ ia_ativa: v }).eq('id', activeAgente) }} label="I.A ativa" />
            </div>

            <div style={{ height: 1, background: co.border, margin: "20px 0" }} />

            <Input label="URL DA PLANILHA (Google Sheets)" value={agente.url_planilha || ""} onChange={v => updateAgente("url_planilha", v)} />
            <Input label="URL DO ÁUDIO (Boas-vindas)" value={agente.url_audio || ""} onChange={v => updateAgente("url_audio", v)} />
            <Input label="FRASE GATILHO" value={agente.frase_gatilho || ""} onChange={v => updateAgente("frase_gatilho", v)} />

            <div style={{ height: 1, background: co.border, margin: "20px 0" }} />

            <Input label="PROMPT DO AGENTE (System Message)" value={agente.prompt_agente || ""} onChange={v => updateAgente("prompt_agente", v)} textarea />
            <Input label="PROMPT DO RESUMO (AI Agent1)" value={agente.prompt_resumo || ""} onChange={v => updateAgente("prompt_resumo", v)} textarea />
          </div>

          <div style={{ marginTop: 20 }}>
            <Btn onClick={handleSave} size="lg" disabled={saving} style={{ width: "100%" }}>
              {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Alterações"}
            </Btn>
          </div>
        </div>
      )}

      {showNovaIA && (
        <div onClick={() => setShowNovaIA(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Nova I.A</h3>
            <p style={{ color: co.textMuted, fontSize: 13, margin: "0 0 20px" }}>Crie uma nova IA de qualificação para este cliente.</p>
            <Input label="NOME / NICHO" value={novaIANome} onChange={setNovaIANome} placeholder="Ex: BPC/LOAS, Trabalhista..." />
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn variant="ghost" size="md" onClick={() => setShowNovaIA(false)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn size="md" onClick={addIA} disabled={!novaIANome.trim() || criandoIA} style={{ flex: 1 }}>{criandoIA ? "Criando..." : "Criar I.A"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(null)
  const [selectedCliente, setSelectedCliente] = useState(null)

  const loadUser = async (authUser) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', authUser.id)
      .single()
    if (!profile) return

    let cliente_id = null
    if (profile.role === 'cliente') {
      const { data: cl } = await supabase
        .from('clientes')
        .select('id')
        .eq('profile_id', authUser.id)
        .single()
      cliente_id = cl?.id
    }

    const u = { email: authUser.email, nome: profile.nome, role: profile.role, cliente_id }
    setUser(u)
    setActiveTab(profile.role === 'admin' ? 'clientes' : 'kanban')
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await loadUser(session.user)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setActiveTab(null)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setActiveTab(userData.role === 'admin' ? 'clientes' : 'kanban')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setActiveTab(null)
    setSelectedCliente(null)
  }

  const handleSelectCliente = (cl) => {
    setSelectedCliente(cl)
    setActiveTab("editor")
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: co.bg, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${co.primary}, ${co.purple})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 16, fontWeight: 800, color: "#fff" }}>IA</div>
          <p style={{ margin: 0, fontSize: 14, color: co.textMuted }}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage onLogin={handleLogin} />

  const clienteId = user.role === 'cliente' ? user.cliente_id : selectedCliente?.id

  const renderContent = () => {
    if (user.role === 'admin') {
      if (activeTab === 'clientes') return <AdminClientesView onSelectCliente={handleSelectCliente} />
      if (activeTab === 'editor') return <AdminEditorView cliente={selectedCliente} />
    } else {
      if (activeTab === 'kanban') return <KanbanView clienteId={clienteId} />
      if (activeTab === 'chat') return <ChatView clienteId={clienteId} />
      if (activeTab === 'config') return <ConfigView clienteId={clienteId} />
    }
    return null
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: co.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: co.text }}>
      <Sidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <div style={{ flex: 1, overflow: "hidden" }}>{renderContent()}</div>
    </div>
  )
}
