'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// ============================================================
// THEME
// ============================================================
export const co = {
  bg: "#0C0C0C", bgCard: "#161616", bgHover: "#1E1E1E", bgInput: "#131313",
  border: "#2A2A2A", borderFocus: "#EE5221",
  text: "#E8E8ED", textMuted: "#8888A0", textDim: "#55556A",
  primary: "#EE5221", primaryHover: "#D4481E", primaryBg: "rgba(238,82,33,0.1)",
  success: "#10B981", successBg: "rgba(16,185,129,0.1)",
  warning: "#F59E0B", warningBg: "rgba(245,158,11,0.1)",
  danger: "#EF4444", dangerBg: "rgba(239,68,68,0.1)",
  purple: "#EE5221", purpleBg: "rgba(238,82,33,0.1)",
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
export function LoginPage({ onLogin }) {
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: co.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: 400, padding: 40, background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="Grupo ADV" style={{ width: 250, margin: "0 auto 24px", display: "block", objectFit: "contain" }} />
        </div>
        <Input label="Endereço de e-mail" value={email} onChange={setEmail} placeholder="seu@email.com" />
        <Input label="Senha" value={senha} onChange={setSenha} type="password" placeholder="••••••••" />
        {error && <p style={{ color: co.danger, fontSize: 13, margin: "0 0 16px", padding: "8px 12px", background: co.dangerBg, borderRadius: 8 }}>{error}</p>}
        <Btn onClick={go} disabled={loading} size="lg" style={{ width: "100%", marginTop: 4 }}>{loading ? "Entrando..." : "Entrar"}</Btn>
      </div>
    </div>
  )
}

// ============================================================
// SIDEBAR
// ============================================================
export function Sidebar({ user, activeTab, onTabChange, onLogout, onConfigNav }) {
  const [collapsed, setCollapsed] = useState(false)
  const [wppStatuses, setWppStatuses] = useState([]) // [{ id, nome, connected: null|true|false }]
  const isAdmin = user.role === "admin"

  useEffect(() => {
    if (isAdmin || !user.cliente_id) return
    const check = async () => {
      const { data: ags } = await supabase.from('agentes').select('id, nome, instancia_wpp').eq('cliente_id', user.cliente_id).order('created_at')
      if (!ags?.length) return
      // Inicializa com null (verificando)
      setWppStatuses(ags.map(a => ({ id: a.id, nome: a.nome, instancia_wpp: a.instancia_wpp, connected: null })))
      // Busca status de cada agente em paralelo
      await Promise.all(ags.map(async (ag) => {
        try {
          const r = await fetch(`/api/whatsapp/status?agenteId=${ag.id}`)
          const d = await r.json()
          const connected = d.noInstance ? 'none' : d.connected === true
          setWppStatuses(prev => prev.map(s => s.id === ag.id ? { ...s, connected } : s))
        } catch {
          setWppStatuses(prev => prev.map(s => s.id === ag.id ? { ...s, connected: false } : s))
        }
      }))
    }
    check()
  }, [user.cliente_id])
  const tabs = isAdmin
    ? [{ id: "clientes", label: "Clientes", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }]
    : [
        { id: "kanban", label: "Leads", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="10" rx="1"/><rect x="14" y="17" width="7" height="4" rx="1"/></svg> },
        { id: "chat", label: "Chat", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
        { id: "analytics", label: "Analytics", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
        { id: "config", label: "Configurações", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
      ]

  const w = collapsed ? 64 : 220

  return (
    <div style={{ width: w, minWidth: w, height: "100vh", background: co.bgCard, borderRight: `1px solid ${co.border}`, display: "flex", flexDirection: "column", padding: collapsed ? "20px 8px" : "20px 12px", boxSizing: "border-box", flexShrink: 0, transition: "width 0.22s ease, min-width 0.22s ease", overflow: "hidden" }}>

      {/* LOGO + TOGGLE */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", marginBottom: 32, minHeight: 36 }}>
        <div style={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
          {collapsed
            ? <img src="/logo-icon.png" alt="ADV" style={{ width: 36, height: 36, objectFit: "contain", display: "block" }} />
            : <img src="/logo.png" alt="Grupo ADV" style={{ width: 150, objectFit: "contain", display: "block" }} />
          }
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} title="Recolher menu"
            style={{ background: "none", border: `1px solid ${co.border}`, borderRadius: 6, color: co.textDim, cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>
            ‹
          </button>
        )}
      </div>

      {/* EXPAND BUTTON when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)} title="Expandir menu"
          style={{ width: "100%", marginBottom: 20, padding: "6px 0", background: "none", border: `1px solid ${co.border}`, borderRadius: 6, color: co.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
          ›
        </button>
      )}

      {/* NAV ITEMS */}
      <div style={{ flex: 1 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onTabChange(t.id)} title={collapsed ? t.label : ''}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: collapsed ? 0 : 10, padding: collapsed ? "10px 0" : "10px 12px", marginBottom: 2, borderRadius: 8, border: "none", background: activeTab === t.id ? co.primaryBg : "transparent", color: activeTab === t.id ? co.primary : co.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
            <span style={{ flexShrink: 0, display: "flex" }}>{t.icon}</span>
            {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{t.label}</span>}
          </button>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${co.border}`, paddingTop: 16 }}>

        {/* STATUS WHATSAPP — um card por agente, só para cliente */}
        {!isAdmin && wppStatuses.map(ag => {
          const isConn = ag.connected === true
          const isDisc = ag.connected === false
          const dotColor = isConn ? '#22C55E' : isDisc ? '#EF4444' : '#6B7280'
          const statusLabel = isConn ? 'Conectado' : isDisc ? 'Desconectado' : ag.connected === 'none' ? 'Não configurado' : 'Verificando...'
          return collapsed ? (
            <div key={ag.id} title={`${ag.nome}: ${statusLabel}`} onClick={() => onConfigNav?.(ag.id)} style={{ display: "flex", justifyContent: "center", marginBottom: 8, cursor: "pointer" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, boxShadow: isConn ? `0 0 6px ${dotColor}` : 'none' }} />
            </div>
          ) : (
            <div key={ag.id} onClick={() => onConfigNav?.(ag.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", marginBottom: 6, borderRadius: 8, background: co.bgHover, border: `1px solid ${co.border}`, cursor: "pointer" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: isConn ? `0 0 5px ${dotColor}` : 'none' }} />
              <div style={{ overflow: "hidden", minWidth: 0 }}>
                <div style={{ color: co.textDim, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ag.nome}</div>
                <div style={{ color: isConn ? '#22C55E' : isDisc ? '#EF4444' : co.textDim, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>{statusLabel}</div>
              </div>
            </div>
          )
        })}

        {!collapsed && (
          <div style={{ padding: "0 8px", marginBottom: 12, overflow: "hidden" }}>
            <div style={{ color: co.text, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.nome}</div>
            <div style={{ color: co.textDim, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        )}
        <button onClick={onLogout} title={collapsed ? "Sair" : ""}
          style={{ width: "100%", padding: collapsed ? "8px 0" : "8px 12px", background: "transparent", border: `1px solid ${co.border}`, borderRadius: 8, color: co.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {collapsed
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            : "Sair"}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// KANBAN (Cliente)
// ============================================================
export function KanbanView({ clienteId }) {
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
  const [refreshing, setRefreshing] = useState(false)
  const [searchLeads, setSearchLeads] = useState('')
  const [showNovoLead, setShowNovoLead] = useState(false)
  const [novoLead, setNovoLead] = useState({ nome: '', telefone: '', nicho: '', etapa_id: '', resumo: '' })
  const [savingNovoLead, setSavingNovoLead] = useState(false)
  const [erroNovoLead, setErroNovoLead] = useState('')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (editingLead) { setEditingLead(null); return }
      if (showNovoLead) { setShowNovoLead(false); return }
      if (selectedLead) { setSelectedLead(null); return }
      if (showGerenciar) { setShowGerenciar(false); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingLead, showNovoLead, selectedLead, showGerenciar])

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
  const reloadLeads = async (agenteId, showSpinner = false) => {
    if (!agenteId) return
    if (showSpinner) setRefreshing(true)
    const [{ data: et }, { data: ld }] = await Promise.all([
      supabase.from('etapas_funil').select('*').eq('agente_id', agenteId).order('ordem'),
      supabase.from('leads').select('*').eq('agente_id', agenteId).order('created_at', { ascending: false }),
    ])
    setEtapas(et || [])
    setLeads(ld || [])
    if (showSpinner) setRefreshing(false)
  }
  useEffect(() => { reloadLeads(activeAgente) }, [activeAgente])

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
    setEtapaErro(null)
    setShowGerenciar(true)
  }

  const addEtapaEdit = () => {
    const mx = Math.max(0, ...etapasEdit.map(e => e.ordem))
    setEtapasEdit(prev => [...prev, { id: 'et_' + Date.now(), agente_id: activeAgente, nome: 'Nova Etapa', cor: '#6366F1', ordem: mx + 1 }])
  }

  const ETAPAS_FIXAS = ['Atendimento (IA)', 'Qualificado']
  const isEtapaFixa = (et) => ETAPAS_FIXAS.includes(et.nome)

  const updateEtapaEdit = (id, f, v) => {
    const et = etapasEdit.find(e => e.id === id)
    if (et && isEtapaFixa(et) && (f === 'nome' || f === 'cor')) return
    setEtapasEdit(prev => prev.map(e => e.id === id ? { ...e, [f]: v } : e))
  }
  const [etapaErro, setEtapaErro] = useState(null)

  const removeEtapaEdit = (id) => {
    const et = etapasEdit.find(e => e.id === id)
    if (!et || isEtapaFixa(et) || etapasEdit.length <= 1) return
    const leadsNaEtapa = leads.filter(l => l.etapa_id === id).length
    if (leadsNaEtapa > 0) {
      setEtapaErro({ nome: et.nome, count: leadsNaEtapa })
      return
    }
    setEtapaErro(null)
    setEtapasEdit(prev => prev.filter(e => e.id !== id))
  }

  const saveEtapas = async () => {
    setSavingEtapas(true)
    const originalIds = etapas.map(e => e.id)
    const currentIds = etapasEdit.filter(e => !e.id.startsWith('et_')).map(e => e.id)
    const deletedIds = originalIds.filter(id => {
      if (!currentIds.includes(id)) {
        const et = etapas.find(e => e.id === id)
        return et && !isEtapaFixa(et)
      }
      return false
    })

    if (deletedIds.length) {
      await supabase.from('etapas_funil').delete().in('id', deletedIds)
    }
    for (const et of etapasEdit) {
      if (et.id.startsWith('et_')) {
        await supabase.from('etapas_funil').insert({ agente_id: activeAgente, nome: et.nome, cor: et.cor, ordem: et.ordem })
      } else if (isEtapaFixa(et)) {
        // etapas fixas: não atualizar nome nem cor
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

  const createLead = async () => {
    if (!novoLead.nome.trim()) { setErroNovoLead('Nome é obrigatório.'); return }
    if (!novoLead.telefone.trim()) { setErroNovoLead('Telefone é obrigatório.'); return }
    setErroNovoLead('')
    setSavingNovoLead(true)
    const primeiraEtapa = [...etapas].sort((a, b) => a.ordem - b.ordem)[0]
    try {
      const res = await fetch('/api/leads/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agente_id: activeAgente,
          cliente_id: clienteId,
          nome: novoLead.nome.trim(),
          telefone: novoLead.telefone.trim(),
          nicho: novoLead.nicho.trim() || null,
          etapa_id: novoLead.etapa_id || primeiraEtapa?.id || null,
          resumo: novoLead.resumo.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setErroNovoLead('Erro ao criar lead: ' + (json.error || res.status)); return }
      setLeads(prev => [json.lead, ...prev])
      setShowNovoLead(false)
      setNovoLead({ nome: '', telefone: '', nicho: '', etapa_id: '', resumo: '' })
    } catch (e) {
      setErroNovoLead('Erro ao criar lead: ' + e.message)
    } finally {
      setSavingNovoLead(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div style={{ padding: 28, height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ color: co.text, fontSize: 20, fontWeight: 700, margin: 0 }}>Leads</h2>
          <p style={{ color: co.textMuted, fontSize: 13, margin: "4px 0 0" }}>{leads.length} leads no funil</p>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: co.textDim, fontSize: 14, pointerEvents: "none" }}>🔍</span>
          <input
            value={searchLeads}
            onChange={e => setSearchLeads(e.target.value)}
            placeholder="Busca rápida: nome ou telefone..."
            style={{ width: "100%", padding: "9px 14px 9px 36px", background: co.bgInput, border: `1px solid ${searchLeads ? co.borderFocus : co.border}`, borderRadius: 10, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = co.borderFocus}
            onBlur={e => e.target.style.borderColor = searchLeads ? co.borderFocus : co.border}
          />
          {searchLeads && (
            <button onClick={() => setSearchLeads('')} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: co.textDim, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>×</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => reloadLeads(activeAgente, true)} disabled={refreshing} title="Atualizar" style={{ width: 34, height: 34, borderRadius: 8, background: refreshing ? co.primaryBg : co.bgCard, border: `1px solid ${refreshing ? co.primary : co.border}`, color: refreshing ? co.primary : co.textMuted, fontSize: 15, cursor: refreshing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            <span className={refreshing ? "spinning" : ""}>↻</span>
          </button>
          <Btn size="sm" onClick={() => { setNovoLead({ nome: '', telefone: '', nicho: '', etapa_id: etapas.sort((a,b)=>a.ordem-b.ordem)[0]?.id || '', resumo: '' }); setErroNovoLead(''); setShowNovoLead(true) }}>+ Adicionar Lead</Btn>
          <Btn variant="ghost" size="sm" onClick={openGerenciar}>⚙ Gerenciar Etapas</Btn>
        </div>
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
        {[...etapas].sort((a, b) => {
          const FIXAS = ['Atendimento (IA)', 'Qualificado']
          const ai = FIXAS.indexOf(a.nome) >= 0 ? FIXAS.indexOf(a.nome) : 99 + a.ordem
          const bi = FIXAS.indexOf(b.nome) >= 0 ? FIXAS.indexOf(b.nome) : 99 + b.ordem
          return ai - bi
        }).map(etapa => {
          const q = searchLeads.toLowerCase()
          const el = leads.filter(l => l.etapa_id === etapa.id && (!q || (l.nome||'').toLowerCase().includes(q) || (l.telefone||'').includes(q)))
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

      {/* DRAWER — DETALHE DO LEAD + CHAT */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => { setEditingLead({ ...selectedLead }); setSelectedLead(null) }}
          onDelete={(id) => setLeads(prev => prev.filter(l => l.id !== id))}
        />
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

      {/* MODAL — NOVO LEAD */}
      {showNovoLead && (
        <div onClick={() => setShowNovoLead(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 520, maxHeight: "85vh", overflow: "auto", background: co.bgCard, borderRadius: 16, border: `1px solid ${co.border}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ color: co.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Adicionar Lead</h3>
                <p style={{ color: co.textMuted, fontSize: 12, margin: "4px 0 0" }}>Nome e telefone são obrigatórios</p>
              </div>
              <button onClick={() => setShowNovoLead(false)} style={{ background: "none", border: "none", color: co.textMuted, fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>NOME <span style={{ color: co.danger }}>*</span></label>
                <input value={novoLead.nome} onChange={e => setNovoLead(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: João Silva"
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${!novoLead.nome.trim() && erroNovoLead ? co.danger : co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>TELEFONE <span style={{ color: co.danger }}>*</span></label>
                <input value={novoLead.telefone} onChange={e => setNovoLead(p => ({ ...p, telefone: e.target.value }))} placeholder="5547999990000"
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${!novoLead.telefone.trim() && erroNovoLead ? co.danger : co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>NICHO / TIPO <span style={{ color: co.textDim, fontSize: 11 }}>(opcional)</span></label>
                <input value={novoLead.nicho} onChange={e => setNovoLead(p => ({ ...p, nicho: e.target.value }))} placeholder="Ex: Trabalhista"
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>ETAPA DO FUNIL <span style={{ color: co.textDim, fontSize: 11 }}>(opcional)</span></label>
                <select value={novoLead.etapa_id} onChange={e => setNovoLead(p => ({ ...p, etapa_id: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", cursor: "pointer" }}>
                  {etapas.sort((a,b) => a.ordem - b.ordem).map(et => <option key={et.id} value={et.id}>{et.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500 }}>RESUMO <span style={{ color: co.textDim, fontSize: 11 }}>(opcional)</span></label>
                <textarea value={novoLead.resumo} onChange={e => setNovoLead(p => ({ ...p, resumo: e.target.value }))} rows={4} placeholder="Informações relevantes sobre o lead..."
                  style={{ width: "100%", padding: "10px 14px", background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, color: co.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
            {erroNovoLead && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: co.dangerBg, border: `1px solid ${co.danger}`, borderRadius: 8, color: co.danger, fontSize: 13 }}>
                {erroNovoLead}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <Btn variant="ghost" onClick={() => setShowNovoLead(false)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn onClick={createLead} disabled={savingNovoLead} style={{ flex: 2 }}>{savingNovoLead ? "Criando..." : "Criar Lead"}</Btn>
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
              {etapasEdit.sort((a, b) => a.ordem - b.ordem).map(et => {
                const fixa = isEtapaFixa(et)
                return (
                  <div key={et.id} style={{ display: "flex", alignItems: "center", gap: 10, background: fixa ? co.bgHover : co.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${fixa ? co.borderFocus : co.border}`, opacity: fixa ? 1 : 1 }}>
                    <span style={{ color: co.textDim, fontSize: 12, fontWeight: 700, width: 20, textAlign: "center" }}>{et.ordem}</span>
                    {fixa ? (
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: et.cor, flexShrink: 0, border: "2px solid rgba(255,255,255,0.2)" }} />
                    ) : (
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {corOpts.map(cor => <div key={cor} onClick={() => updateEtapaEdit(et.id, "cor", cor)} style={{ width: 16, height: 16, borderRadius: 4, background: cor, cursor: "pointer", border: et.cor === cor ? "2px solid #fff" : "2px solid transparent" }} />)}
                      </div>
                    )}
                    <input value={et.nome} readOnly={fixa} onChange={e => updateEtapaEdit(et.id, "nome", e.target.value)}
                      style={{ flex: 1, padding: "6px 10px", background: fixa ? co.bg : co.bgInput, border: `1px solid ${co.border}`, borderRadius: 6, color: fixa ? co.textMuted : co.text, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: fixa ? "default" : "text" }} />
                    {fixa ? (
                      <span title="Etapa fixa — não pode ser removida" style={{ fontSize: 14, opacity: 0.4, padding: "2px 6px" }}>🔒</span>
                    ) : (
                      <button onClick={() => removeEtapaEdit(et.id)}
                        style={{ background: "none", border: "none", color: co.textDim, cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>✕</button>
                    )}
                  </div>
                )
              })}
            </div>
            {etapaErro && (
              <div style={{ background: co.dangerBg, border: `1px solid ${co.danger}`, borderRadius: 10, padding: "12px 16px", marginBottom: 4 }}>
                <div style={{ color: co.danger, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  ⚠ Não é possível excluir "{etapaErro.nome}"
                </div>
                <div style={{ color: co.text, fontSize: 12, lineHeight: 1.6 }}>
                  Esta etapa possui <strong>{etapaErro.count} lead{etapaErro.count > 1 ? 's' : ''}</strong>. Para excluí-la, mova {etapaErro.count > 1 ? 'os leads' : 'o lead'} para outra etapa primeiro usando o Kanban.
                </div>
                <button onClick={() => setEtapaErro(null)} style={{ marginTop: 8, background: "none", border: `1px solid ${co.danger}`, color: co.danger, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Entendi</button>
              </div>
            )}
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
export function ConfigView({ clienteId, initAgenteId, initSection }) {
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
  const audioInputRef = useRef(null)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadAudioErr, setUploadAudioErr] = useState('')

  useEffect(() => {
    if (!clienteId) return
    supabase.from('agentes').select('*').eq('cliente_id', clienteId).order('created_at')
      .then(({ data }) => {
        if (data?.length) {
          setAgentes(data)
          const preselect = initAgenteId && data.find(a => a.id === initAgenteId)
          setActiveAgente(preselect ? initAgenteId : data[0].id)
          if (initSection) setActiveSection(initSection)
          else if (preselect) setActiveSection('whatsapp')
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

  const handleAudioUpload = async (file) => {
    if (!file || !activeAgente) return
    if (!file.type.startsWith('audio/')) { setUploadAudioErr('Formato não suportado. Use MP3, OGG, M4A, AAC ou WAV.'); return }
    setUploadingAudio(true)
    setUploadAudioErr('')
    const ext = file.name.split('.').pop().toLowerCase() || 'mp3'
    const fileName = `welcome/agente_${activeAgente}.${ext}`
    const { error } = await supabase.storage.from('chat-media').upload(fileName, file, { contentType: file.type, upsert: true })
    if (error) { setUploadAudioErr('Erro no upload: ' + error.message); setUploadingAudio(false); return }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await supabase.from('agentes').update({ url_audio: pub.publicUrl }).eq('id', activeAgente)
    updateAgente('url_audio', pub.publicUrl)
    setUploadingAudio(false)
  }

  const handleRemoveAudio = async () => {
    await supabase.from('agentes').update({ url_audio: null }).eq('id', activeAgente)
    updateAgente('url_audio', '')
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
            <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Áudio de Boas-vindas</h3>
            <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 4px", lineHeight: 1.5 }}>Áudio enviado automaticamente ao lead junto com a saudação de texto.</p>
            <p style={{ color: co.textDim, fontSize: 11, margin: "0 0 16px", padding: "8px 12px", background: co.bg, borderRadius: 6, border: `1px solid ${co.border}` }}>
              Formatos aceitos: <strong style={{ color: co.textMuted }}>MP3, OGG, M4A, AAC, WAV</strong> — compatíveis com envio de áudio no WhatsApp
            </p>
            {agente.url_audio && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: co.bg, borderRadius: 8, border: `1px solid ${co.border}`, marginBottom: 14 }}>
                <audio controls src={agente.url_audio} style={{ flex: 1, height: 32, minWidth: 0 }} />
                <button onClick={handleRemoveAudio} title="Remover áudio"
                  style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, background: co.dangerBg, border: `1px solid ${co.danger}`, color: co.danger, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            )}
            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) { handleAudioUpload(e.target.files[0]); e.target.value = "" } }} />
            {uploadAudioErr && <p style={{ color: co.danger, fontSize: 12, margin: "0 0 12px", padding: "8px 12px", background: co.dangerBg, borderRadius: 6 }}>{uploadAudioErr}</p>}
            <Btn variant="ghost" size="sm" onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio}>
              {uploadingAudio ? "⏳ Enviando..." : agente.url_audio ? "↻ Substituir áudio" : "↑ Enviar áudio"}
            </Btn>
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
// PTT PLAYER — waveform visual + proxy de áudio
// ============================================================
function PttPlayer({ messageId, agenteId, content, hostedUrl, isRight, phoneNumber }) {
  const [state, setState] = useState('idle') // idle | loading | playing | paused | error
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef(null)

  // Parseia content: [ptt:6s:BASE64WAVEFORM] ou [ptt:6s]
  const pttMatch = content?.match(/\[ptt:(\d+)s(?::([A-Za-z0-9+/=]+))?\]/)
  const totalSec = pttMatch ? parseInt(pttMatch[1]) : 0
  const waveformB64 = pttMatch?.[2] || null

  // Decodifica waveform base64 → array de amplitudes 0-1
  const waveformBars = useMemo(() => {
    if (!waveformB64) return Array(20).fill(0.3)
    try {
      const bytes = Uint8Array.from(atob(waveformB64), c => c.charCodeAt(0))
      const step = Math.max(1, Math.floor(bytes.length / 30))
      const bars = []
      for (let i = 0; i < bytes.length; i += step) {
        bars.push(bytes[i] / 255)
        if (bars.length >= 30) break
      }
      return bars.length > 0 ? bars : Array(20).fill(0.3)
    } catch { return Array(20).fill(0.3) }
  }, [waveformB64])

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const togglePlay = async () => {
    if (state === 'error') return
    if (state === 'playing') { audioRef.current?.pause(); setState('paused'); return }
    if (state === 'paused') { audioRef.current?.play(); setState('playing'); return }
    if (state === 'loading') return

    setState('loading')
    try {
      const url = hostedUrl || `/api/chat/audio?messageId=${encodeURIComponent(messageId)}&agenteId=${encodeURIComponent(agenteId)}`
      if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.addEventListener('timeupdate', () => {
          const cur = audioRef.current.currentTime
          const dur = audioRef.current.duration || totalSec || 1
          setCurrentTime(cur)
          setProgress(cur / dur)
        })
        audioRef.current.addEventListener('ended', () => { setState('idle'); setProgress(0); setCurrentTime(0) })
        audioRef.current.addEventListener('error', () => setState('error'))
      }
      audioRef.current.src = url
      await audioRef.current.play()
      setState('playing')
    } catch (e) {
      console.error('[PttPlayer] erro:', e)
      setState('error')
    }
  }

  const seekTo = (e) => {
    if (!audioRef.current || state === 'idle' || state === 'error') return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const dur = audioRef.current.duration || totalSec || 1
    audioRef.current.currentTime = pct * dur
    setProgress(pct)
  }

  useEffect(() => () => audioRef.current?.pause(), [])

  const alpha = (a) => isRight ? `rgba(255,255,255,${a})` : `rgba(99,102,241,${a})`
  const isPlaying = state === 'playing'

  return (
    <div style={{ minWidth: 220, maxWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Botão play/pause */}
        <button onClick={togglePlay} style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: alpha(0.2), border: `1.5px solid ${alpha(0.3)}`,
          cursor: state === 'error' ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: isRight ? '#fff' : '#6366F1', transition: 'background 0.15s',
        }}>
          {state === 'loading' ? '·' : isPlaying ? '⏸' : '▶'}
        </button>

        {/* Waveform + barra de progresso */}
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={seekTo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 28, marginBottom: 3 }}>
            {waveformBars.map((amp, i) => {
              const filled = progress > 0 && i / waveformBars.length <= progress
              const isActive = isPlaying && filled
              return (
                <div key={i} style={{
                  width: 3, borderRadius: 2, flexShrink: 0,
                  height: `${Math.max(18, amp * 100)}%`,
                  background: filled ? alpha(0.9) : alpha(0.3),
                  transition: isActive ? 'none' : 'background 0.1s',
                }} />
              )
            })}
          </div>
          {/* Tempo */}
          <div style={{ fontSize: 10, opacity: 0.65 }}>
            {isPlaying || state === 'paused'
              ? `${fmtTime(currentTime)} / ${fmtTime(totalSec)}`
              : fmtTime(totalSec)
            }
          </div>
        </div>

        {/* Ícone microfone */}
        <div style={{ fontSize: 15, opacity: 0.5, flexShrink: 0 }}>🎤</div>
      </div>

      {/* Link WhatsApp quando não consegue tocar */}
      {state === 'error' && phoneNumber && (
        <a
          href={`https://wa.me/${phoneNumber.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
            fontSize: 11, color: isRight ? 'rgba(255,255,255,0.8)' : '#6366F1',
            textDecoration: 'none', opacity: 0.85,
          }}
        >
          <span>↗</span> Ouvir no WhatsApp
        </a>
      )}
    </div>
  )
}

// ============================================================
// LEAD DRAWER — Detalhes + Chat inline (Aba Leads)
// ============================================================
function LeadDrawer({ lead, onClose, onEdit, onDelete }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [resumoAberto, setResumoAberto] = useState(false)
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const deleteLead = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/leads/excluir', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      })
      if (res.ok) { onDelete(lead.id); onClose() }
      else { const j = await res.json(); console.error('[deleteLead]', j.error) }
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (lightboxUrl) { setLightboxUrl(null); return }
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl, onClose])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const recordingSecondsRef = useRef(0)

  const agenteId = lead?.agente_id || null
  const telefone = lead?.telefone || null

  // Polling de mensagens (2s)
  useEffect(() => {
    if (!telefone) return
    let cancelled = false

    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/chat/historico?telefone=${telefone}`)
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
      } catch (e) {
        console.error('[LeadDrawer poll] erro:', e)
      }
    }

    fetchMsgs()
    const interval = setInterval(fetchMsgs, 2000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [telefone])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (tipo, conteudo, duration = null) => {
    if (!agenteId || !telefone || !conteudo) return
    const tempId = `temp_${Date.now()}`
    const displayContent = tipo === 'text' ? conteudo
      : tipo === 'ptt' && duration ? `[ptt:${duration}s] ${conteudo}`
      : `[${tipo}] ${conteudo}`
    setMessages(prev => [...prev, { id: tempId, type: 'agent', content: displayContent, mediaUrl: tipo !== 'text' ? conteudo : null, mediaType: tipo !== 'text' ? tipo : null }])
    setSending(true)
    try {
      const res = await fetch('/api/chat/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId, telefone, tipo, conteudo, ...(duration ? { duration } : {}) }),
      })
      if (!res.ok) {
        // Só remove o temp se foi erro HTTP real (não warning de entrega)
        setMessages(prev => prev.filter(m => m.id !== tempId))
      }
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
      recordingSecondsRef.current = 0
      setRecordingSeconds(0)
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t)) || ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
      recordingTimerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1
        setRecordingSeconds(recordingSecondsRef.current)
      }, 1000)
    } catch {
      alert('Permissão de microfone negada.')
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return
    clearInterval(recordingTimerRef.current)
    const duration = recordingSecondsRef.current
    setRecording(false)
    setRecordingSeconds(0)
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop())
    await new Promise(r => { mediaRecorderRef.current.onstop = r })
    const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm'
    const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
    const blob = new Blob(audioChunksRef.current, { type: mimeType })
    const fileName = `ptt_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('chat-media').upload(fileName, blob, { contentType: mimeType })
    if (error) { console.error('Upload áudio:', error); return }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendMessage('ptt', pub.publicUrl, Math.max(1, duration))
  }

  const sendMedia = async (file) => {
    const tipo = file.type.startsWith('image/') ? 'image' : 'document'
    const ext = file.name.split('.').pop() || (tipo === 'image' ? 'jpg' : 'bin')
    const fileName = `${tipo}_${Date.now()}.${ext}`
    setSending(true)
    const { error } = await supabase.storage.from('chat-media').upload(fileName, file, { contentType: file.type })
    if (error) {
      setSending(false)
      console.error('Upload mídia:', error)
      alert(`Erro ao enviar: ${error.message}`)
      return
    }
    setSending(false)
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendMessage(tipo, pub.publicUrl)
  }

  const displayName = lead?.nome || lead?.telefone || '?'

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', right: 0, top: 0, width: 700, height: '100vh', zIndex: 201, background: co.bgCard, borderLeft: `1px solid ${co.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-8px 0 40px rgba(0,0,0,0.5)' }}>

        {/* Header do lead */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${co.border}`, flexShrink: 0, background: co.bg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
            <div>
              <h3 style={{ color: co.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{displayName}</h3>
              <p style={{ color: co.textMuted, fontSize: 12, margin: '3px 0 0' }}>{lead?.telefone?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {confirmDelete ? (
                <>
                  <Btn size="sm" variant="danger" onClick={deleteLead} disabled={deleting} style={{ fontSize: 11 }}>
                    {deleting ? 'Excluindo...' : '⚠ Confirmar exclusão'}
                  </Btn>
                  <button onClick={() => setConfirmDelete(false)} style={{ background: 'none', border: 'none', color: co.textMuted, fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} title="Excluir lead"
                  style={{ width: 30, height: 30, borderRadius: 6, background: 'transparent', border: `1px solid ${co.border}`, color: co.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = co.danger; e.currentTarget.style.color = co.danger; e.currentTarget.style.background = co.dangerBg }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = co.border; e.currentTarget.style.color = co.textDim; e.currentTarget.style.background = 'transparent' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              )}
              <Btn size="sm" variant="ghost" onClick={onEdit}>✎ Editar</Btn>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: co.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: lead?.resumo ? 12 : 0 }}>
            <Badge color="primary">{lead?.status}</Badge>
            {lead?.nicho && <Badge color="purple">{lead?.nicho}</Badge>}
            <Badge color="purple">{lead?.created_at?.slice(0, 10)}</Badge>
          </div>
          {lead?.resumo && (
            <div style={{ background: co.bgCard, borderRadius: 8, border: `1px solid ${co.border}`, overflow: 'hidden' }}>
              <button onClick={() => setResumoAberto(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: co.textDim }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em' }}>RESUMO DA QUALIFICAÇÃO</span>
                <span style={{ fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: resumoAberto ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {resumoAberto && (
                <div style={{ padding: '0 12px 12px' }}>
                  <p style={{ color: co.text, fontSize: 12, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{lead.resumo}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Label secção chat */}
        <div style={{ padding: '7px 16px', borderBottom: `1px solid ${co.border}`, flexShrink: 0 }}>
          <span style={{ color: co.textDim, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em' }}>CONVERSA WHATSAPP</span>
        </div>

        {/* Mensagens */}
        <div style={{ height: 500, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: co.bg }}>
          {messages.map((msg) => {
            const type = msg.type || 'human'
            const content = msg.content || ''
            const mediaUrl = msg.mediaUrl || null
            const mediaType = msg.mediaType || null
            const isRight = type === 'ai' || type === 'agent'
            const bubbleBg = type === 'agent' ? co.success : type === 'ai' ? co.primary : co.bgCard
            const bubbleColor = isRight ? '#fff' : co.text
            const bubbleRadius = isRight ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
            const ts = msg.timestamp ? (() => {
              const d = new Date(msg.timestamp)
              const now = new Date()
              const isToday = d.toDateString() === now.toDateString()
              const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              return isToday ? hm : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, ${hm}`
            })() : null
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isRight ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: bubbleRadius, background: bubbleBg, border: isRight ? 'none' : `1px solid ${co.border}`, color: bubbleColor, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {(() => { const isAudioMsg = (mediaType === 'ptt' || mediaType === 'audio') || content?.startsWith('[ptt') || (mediaUrl && /\.(mp3|ogg|aac|m4a|wav|webm|oga)(\?|#|$)/i.test(mediaUrl)); return isAudioMsg })() ? (
                    <PttPlayer
                      messageId={msg.messageId}
                      agenteId={agenteId}
                      content={content}
                      hostedUrl={mediaUrl?.startsWith('https://') && !mediaUrl.includes('mmg.whatsapp.net') ? mediaUrl : null}
                      isRight={isRight}
                      phoneNumber={telefone}
                    />
                  ) : mediaUrl && mediaType === 'image' ? (
                    <>
                      <img
                        src={mediaUrl}
                        alt="imagem"
                        style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, display: 'block', cursor: 'pointer' }}
                        onClick={() => setLightboxUrl(mediaUrl)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const next = e.currentTarget.nextElementSibling
                          if (next) next.style.display = 'flex'
                        }}
                      />
                      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', display: 'none', alignItems: 'center', gap: 6 }}>
                        <span>🖼️</span><span>Ver imagem</span>
                      </a>
                    </>
                  ) : mediaUrl ? (
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📎</span><span>{content || 'Arquivo'}</span>
                    </a>
                  ) : content}
                </div>
                {ts && <span style={{ fontSize: 10, color: co.textDim, marginTop: 3, paddingLeft: isRight ? 0 : 4, paddingRight: isRight ? 4 : 0 }}>{ts}</span>}
              </div>
            )
          })}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: co.textMuted, fontSize: 13, marginTop: 40, lineHeight: 1.8 }}>
              Nenhuma mensagem ainda.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) { sendMedia(e.target.files[0]); e.target.value = '' } }} />
        <input ref={fileInputRef} type="file" accept="application/pdf,.doc,.docx,.xls,.xlsx,.zip" style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) { sendMedia(e.target.files[0]); e.target.value = '' } }} />
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${co.border}`, display: 'flex', gap: 8, alignItems: 'center', background: co.bgCard, flexShrink: 0 }}>
          <button onClick={() => imageInputRef.current?.click()} title="Enviar imagem" disabled={sending || recording}
            style={{ width: 36, height: 36, borderRadius: 8, background: co.bgInput, border: `1px solid ${co.border}`, color: co.textMuted, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || recording) ? 0.4 : 1 }}>
            🖼️
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Enviar arquivo" disabled={sending || recording}
            style={{ width: 36, height: 36, borderRadius: 8, background: co.bgInput, border: `1px solid ${co.border}`, color: co.textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || recording) ? 0.4 : 1 }}>
            📎
          </button>
          <input
            value={recording ? `● ${recordingSeconds}s` : inputText}
            onChange={recording ? () => {} : e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !recording) { e.preventDefault(); sendText() } }}
            placeholder="Digite uma mensagem..."
            readOnly={recording}
            disabled={sending}
            style={{ flex: 1, padding: '9px 14px', background: co.bgInput, border: `1px solid ${recording ? co.danger : co.border}`, borderRadius: 24, color: recording ? co.danger : co.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: recording ? 'default' : 'text' }}
          />
          <button onClick={recording ? stopRecording : startRecording}
            title={recording ? 'Clique para enviar áudio' : 'Clique para gravar áudio'} disabled={sending}
            style={{ width: 36, height: 36, borderRadius: '50%', background: recording ? co.danger : co.bgInput, border: `1px solid ${recording ? co.danger : co.border}`, color: recording ? '#fff' : co.textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', opacity: sending ? 0.4 : 1 }}>
            {recording ? '⏹' : '🎤'}
          </button>
          <button onClick={sendText} disabled={sending || recording || !inputText.trim()}
            style={{ width: 36, height: 36, borderRadius: '50%', background: co.primary, border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || recording || !inputText.trim()) ? 0.4 : 1, transition: 'opacity 0.15s' }}>
            {sending ? '⋯' : '→'}
          </button>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightboxUrl} alt="imagem ampliada" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxUrl(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 22, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
    </>
  )
}

// ============================================================
// CHAT (Cliente)
// ============================================================
export function ChatView({ clienteId }) {
  const [conversations, setConversations] = useState([])
  const [leads, setLeads] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const recordingSecondsRef = useRef(0)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLightboxUrl(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  const sendMessage = async (tipo, conteudo, duration = null) => {
    const agenteId = getAgenteId()
    if (!agenteId || !selectedSession || !conteudo) return

    const tempId = `temp_${Date.now()}`
    const displayContent = tipo === 'text' ? conteudo
      : tipo === 'ptt' && duration ? `[ptt:${duration}s] ${conteudo}`
      : `[${tipo}] ${conteudo}`
    setMessages(prev => [...prev, { id: tempId, type: 'agent', content: displayContent, mediaUrl: tipo !== 'text' ? conteudo : null, mediaType: tipo !== 'text' ? tipo : null }])

    setSending(true)
    try {
      const res = await fetch('/api/chat/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId, telefone: selectedSession, tipo, conteudo, ...(duration ? { duration } : {}) }),
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
      recordingSecondsRef.current = 0
      setRecordingSeconds(0)
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported(t)) || ''
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
      recordingTimerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1
        setRecordingSeconds(recordingSecondsRef.current)
      }, 1000)
    } catch {
      alert('Permissão de microfone negada.')
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return
    clearInterval(recordingTimerRef.current)
    const duration = recordingSecondsRef.current
    setRecording(false)
    setRecordingSeconds(0)
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop())
    await new Promise(r => { mediaRecorderRef.current.onstop = r })
    const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm'
    const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
    const blob = new Blob(audioChunksRef.current, { type: mimeType })
    const fileName = `ptt_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('chat-media').upload(fileName, blob, { contentType: mimeType })
    if (error) { console.error('Upload áudio:', error); return }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendMessage('ptt', pub.publicUrl, Math.max(1, duration))
  }

  const sendMedia = async (file) => {
    const tipo = file.type.startsWith('image/') ? 'image' : 'document'
    const ext = file.name.split('.').pop() || (tipo === 'image' ? 'jpg' : 'bin')
    const fileName = `${tipo}_${Date.now()}.${ext}`
    setSending(true)
    const { error } = await supabase.storage.from('chat-media').upload(fileName, file, { contentType: file.type })
    if (error) {
      setSending(false)
      console.error('Upload mídia:', error)
      alert(`Erro ao enviar: ${error.message}`)
      return
    }
    setSending(false)
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ color: co.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Chat</h2>
            <button onClick={async () => { setRefreshing(true); if (selectedSession) setMessages([]); await refreshConversas(); setRefreshing(false) }} disabled={refreshing} title="Atualizar" style={{ width: 30, height: 30, borderRadius: 8, background: refreshing ? co.primaryBg : co.bgCard, border: `1px solid ${refreshing ? co.primary : co.border}`, color: refreshing ? co.primary : co.textMuted, fontSize: 15, cursor: refreshing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <span className={refreshing ? 'spinning' : ''}>↻</span>
            </button>
          </div>
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
                    ? (() => {
                        const c = conv.lastMessage.content || ''
                        const arrow = conv.lastMessage.type === 'human' ? '' : '→ '
                        const preview = c.startsWith('[ptt') ? '🎤 Áudio de voz'
                          : c.startsWith('[') && c.includes('media') ? '📎 Arquivo'
                          : c.slice(0, 40) + (c.length > 40 ? '...' : '')
                        return `${arrow}${preview}`
                      })()
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
              const ts = msg.timestamp ? (() => {
                const d = new Date(msg.timestamp)
                const now = new Date()
                const isToday = d.toDateString() === now.toDateString()
                const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                return isToday ? hm : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, ${hm}`
              })() : null
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isRight ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '68%', padding: '10px 14px', borderRadius: bubbleRadius, background: bubbleBg, border: isRight ? 'none' : `1px solid ${co.border}`, color: bubbleColor, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {(() => { const isAudioMsg = (mediaType === 'ptt' || mediaType === 'audio') || content?.startsWith('[ptt') || (mediaUrl && /\.(mp3|ogg|aac|m4a|wav|webm|oga)(\?|#|$)/i.test(mediaUrl)); return isAudioMsg })() ? (
                      <PttPlayer
                        messageId={msg.messageId}
                        agenteId={getAgenteId()}
                        content={content}
                        hostedUrl={mediaUrl?.startsWith('https://') && !mediaUrl.includes('mmg.whatsapp.net') ? mediaUrl : null}
                        isRight={isRight}
                        phoneNumber={selectedSession}
                      />
                    ) : mediaUrl && mediaType === 'image' ? (
                      <>
                        <img
                          src={mediaUrl}
                          alt="imagem"
                          style={{ maxWidth: 240, maxHeight: 240, borderRadius: 8, display: 'block', cursor: 'pointer' }}
                          onClick={() => setLightboxUrl(mediaUrl)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const next = e.currentTarget.nextElementSibling
                            if (next) next.style.display = 'flex'
                          }}
                        />
                        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', display: 'none', alignItems: 'center', gap: 6 }}>
                          <span>🖼️</span><span>Ver imagem</span>
                        </a>
                      </>
                    ) : mediaUrl ? (
                      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📎</span><span>{content || 'Arquivo'}</span>
                      </a>
                    ) : content}
                  </div>
                  {ts && <span style={{ fontSize: 10, color: co.textDim, marginTop: 3, paddingLeft: isRight ? 0 : 4, paddingRight: isRight ? 4 : 0 }}>{ts}</span>}
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
          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { sendMedia(e.target.files[0]); e.target.value = '' } }} />
          <input ref={fileInputRef} type="file" accept="application/pdf,.doc,.docx,.xls,.xlsx,.zip" style={{ display: 'none' }}
            onChange={e => { if (e.target.files[0]) { sendMedia(e.target.files[0]); e.target.value = '' } }} />
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${co.border}`, display: 'flex', gap: 8, alignItems: 'center', background: co.bgCard, flexShrink: 0 }}>
            <button onClick={() => imageInputRef.current?.click()} title="Enviar imagem" disabled={sending || recording}
              style={{ width: 38, height: 38, borderRadius: 8, background: co.bgInput, border: `1px solid ${co.border}`, color: co.textMuted, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || recording) ? 0.4 : 1 }}>
              🖼️
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Enviar arquivo" disabled={sending || recording}
              style={{ width: 38, height: 38, borderRadius: 8, background: co.bgInput, border: `1px solid ${co.border}`, color: co.textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (sending || recording) ? 0.4 : 1 }}>
              📎
            </button>
            <input
              value={recording ? `● ${recordingSeconds}s` : inputText}
              onChange={recording ? () => {} : e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !recording) { e.preventDefault(); sendText() } }}
              placeholder="Digite uma mensagem..."
              readOnly={recording}
              disabled={sending}
              style={{ flex: 1, padding: '10px 16px', background: co.bgInput, border: `1px solid ${recording ? co.danger : co.border}`, borderRadius: 24, color: recording ? co.danger : co.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: recording ? 'default' : 'text' }}
            />
            <button onClick={recording ? stopRecording : startRecording}
              title={recording ? 'Clique para enviar áudio' : 'Clique para gravar áudio'} disabled={sending}
              style={{ width: 38, height: 38, borderRadius: '50%', background: recording ? co.danger : co.bgInput, border: `1px solid ${recording ? co.danger : co.border}`, color: recording ? '#fff' : co.textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', opacity: sending ? 0.4 : 1 }}>
              {recording ? '⏹' : '🎤'}
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

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img
            src={lightboxUrl}
            alt="imagem ampliada"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 22, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

export function AdminClientesView({ onSelectCliente }) {
  const [clientes, setClientes] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', nome_cliente: '', email: '', senha: '' })
  const [criando, setCriando] = useState(false)
  const [erroNovo, setErroNovo] = useState('')
  const [editingCliente, setEditingCliente] = useState(null)
  const [savingCliente, setSavingCliente] = useState(false)
  const [erroEdit, setErroEdit] = useState('')
  const [expandedCliente, setExpandedCliente] = useState(null)
  const [confirm, setConfirm] = useState(null) // { type: 'ia'|'cliente', id, nome, profile_id? }
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (confirm) { setConfirm(null); return }
      if (editingCliente) { setEditingCliente(null); return }
      if (showNovoCliente) { setShowNovoCliente(false); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirm, editingCliente, showNovoCliente])

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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (confirm.type === 'ia') {
        await fetch('/api/admin/excluir-ia', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agenteId: confirm.id }) })
      } else {
        await fetch('/api/admin/excluir-cliente', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clienteId: confirm.id, profileId: confirm.profile_id }) })
        setExpandedCliente(null)
      }
      await fetchClientes()
    } finally {
      setConfirm(null)
      setDeleting(false)
    }
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={async () => { setRefreshing(true); await fetchClientes(); setRefreshing(false) }} disabled={refreshing} title="Atualizar" style={{ width: 36, height: 36, borderRadius: 8, background: refreshing ? co.primaryBg : co.bgCard, border: `1px solid ${refreshing ? co.primary : co.border}`, color: refreshing ? co.primary : co.textMuted, fontSize: 16, cursor: refreshing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            <span className={refreshing ? "spinning" : ""}>↻</span>
          </button>
          <Btn size="md" onClick={() => setShowNovoCliente(true)}>+ Novo Cliente</Btn>
        </div>
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
          const isExpanded = expandedCliente === cl.id
          return (
            <div key={cl.id} style={{ background: co.bgCard, borderRadius: 12, border: `1px solid ${isExpanded ? co.borderFocus : co.border}`, transition: "all 0.15s", overflow: "hidden" }}>
              {/* Cabeçalho clicável */}
              <div onClick={() => setExpandedCliente(isExpanded ? null : cl.id)} style={{ padding: 20, cursor: "pointer" }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.parentElement.style.borderColor = co.borderFocus }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.parentElement.style.borderColor = co.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ color: co.text, fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{cl.nome_cliente}</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge color={clienteAtivo ? "success" : "danger"}>{clienteAtivo ? "Ativo" : "Desativado"}</Badge>
                      {ags.map(a => <Badge key={a.id} color={!a.ativo ? "danger" : a.ia_ativa ? "purple" : "warning"}>{a.nome} {!a.ativo ? "DESATIVADO" : a.ia_ativa ? "ON" : "OFF"}</Badge>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ color: co.textDim, fontSize: 13, transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    <button onClick={e => { e.stopPropagation(); onSelectCliente(cl) }} title="Abrir editor"
                      style={{ width: 30, height: 30, borderRadius: 8, background: co.bgHover, border: `1px solid ${co.border}`, color: co.textMuted, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
                  </div>
                </div>
              </div>

              {/* Seção expandida */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${co.border}`, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <Btn size="sm" variant="ghost" onClick={() => openEditCliente(cl)}>✎ Editar Cliente</Btn>
                    <Btn size="sm" variant="danger" onClick={() => setConfirm({ type: 'cliente', id: cl.id, nome: cl.nome_cliente, profile_id: cl.profile_id })}>🗑 Excluir Cliente</Btn>
                  </div>
                  {ags.length > 0 && (
                    <div style={{ borderTop: `1px solid ${co.border}`, paddingTop: 12 }}>
                      <p style={{ color: co.textDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 8px" }}>IAs / Agentes</p>
                      {ags.map((ag, i) => (
                        <div key={ag.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < ags.length - 1 ? `1px solid ${co.border}` : "none" }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ color: co.text, fontSize: 13, fontWeight: 500 }}>{ag.nome}</span>
                            <Badge color={ag.ia_ativa ? "success" : "warning"}>{ag.ia_ativa ? "ON" : "OFF"}</Badge>
                          </div>
                          <Btn size="sm" variant="danger" onClick={() => setConfirm({ type: 'ia', id: ag.id, nome: ag.nome })}>🗑 Excluir IA</Btn>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {confirm && (
        <div onClick={() => !deleting && setConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, background: co.bgCard, borderRadius: 16, border: `1px solid ${co.danger}`, padding: 28, boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: co.dangerBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚠️</div>
              <h3 style={{ color: co.danger, fontSize: 17, fontWeight: 700, margin: 0 }}>Confirmar Exclusão</h3>
            </div>
            <p style={{ color: co.text, fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 }}>
              {confirm.type === 'ia'
                ? <>Tem certeza que deseja excluir a IA <strong>"{confirm.nome}"</strong>?</>
                : <>Tem certeza que deseja excluir o cliente <strong>"{confirm.nome}"</strong>?</>}
            </p>
            <p style={{ color: co.textMuted, fontSize: 12, margin: "0 0 20px", padding: "10px 12px", background: co.dangerBg, borderRadius: 8, lineHeight: 1.5 }}>
              {confirm.type === 'ia'
                ? 'Todos os leads, conversas e configurações desta IA serão excluídos permanentemente. Esta ação não pode ser desfeita.'
                : 'TODOS os dados do cliente serão excluídos permanentemente: agentes, leads, conversas e o acesso ao sistema. Esta ação não pode ser desfeita.'}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" size="md" onClick={() => setConfirm(null)} disabled={deleting} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn variant="danger" size="md" onClick={handleDelete} disabled={deleting} style={{ flex: 1 }}>{deleting ? "Excluindo..." : "Sim, excluir"}</Btn>
            </div>
          </div>
        </div>
      )}

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
export function AdminEditorView({ cliente: initialCliente }) {
  const [agentes, setAgentes] = useState([])
  const [activeAgente, setActiveAgente] = useState(null)
  const [agenteConfigs, setAgenteConfigs] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showNovaIA, setShowNovaIA] = useState(false)
  const [novaIANome, setNovaIANome] = useState("")
  const [criandoIA, setCriandoIA] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowNovaIA(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: co.textMuted, marginBottom: 6, fontWeight: 500, letterSpacing: "0.03em" }}>URL DO ÁUDIO (Boas-vindas)</label>
              {agente.url_audio ? (
                <div style={{ background: co.bgInput, border: `1px solid ${co.border}`, borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${co.border}` }}>
                    <audio controls src={agente.url_audio} style={{ flex: 1, height: 32, minWidth: 0 }} />
                  </div>
                  <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 10, color: co.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{agente.url_audio}</span>
                    <button onClick={() => navigator.clipboard.writeText(agente.url_audio)} style={{ fontSize: 10, color: co.textMuted, background: co.bgCard, border: `1px solid ${co.border}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>Copiar</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "9px 14px", background: co.bg, border: `1px solid ${co.border}`, borderRadius: 8, color: co.textDim, fontSize: 13 }}>
                  Nenhum áudio — o cliente faz upload em <strong style={{ color: co.textMuted }}>Configurações → Qualificação</strong>
                </div>
              )}
            </div>
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
// ANALYTICS VIEW
// ============================================================

function BarChart({ data }) {
  const h = 160
  const maxVal = Math.max(...data.map(d => Math.max(d.total, d.qual)), 1)
  const showEvery = data.length <= 14 ? 1 : data.length <= 31 ? 2 : Math.ceil(data.length / 14)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: h + 36, paddingBottom: 28, overflow: 'visible', marginTop: 16 }}>
      {data.map((d, i) => {
        const totalH = maxVal > 0 ? Math.round((d.total / maxVal) * h) : 0
        const qualH = maxVal > 0 ? Math.round((d.qual / maxVal) * h) : 0
        return (
          <div key={d.date}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: h + 36, minWidth: 0 }}>
            {/* barras lado a lado */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              {/* recebidos */}
              <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                {d.total > 0 && <div style={{ position: 'absolute', bottom: totalH + 3, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: co.primary, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}>{d.total}</div>}
                <div style={{ height: totalH || 2, background: co.primary, borderRadius: '2px 2px 0 0', minHeight: 2 }} />
              </div>
              {/* qualificados */}
              <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                {d.qual > 0 && <div style={{ position: 'absolute', bottom: qualH + 3, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: co.success, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}>{d.qual}</div>}
                <div style={{ height: qualH || 2, background: co.success, borderRadius: '2px 2px 0 0', minHeight: 2 }} />
              </div>
            </div>
            {/* data */}
            <div style={{ fontSize: 9, color: co.textDim, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden',
              transform: data.length > 20 ? 'rotate(-45deg) translateX(-4px)' : 'none', transformOrigin: 'top left',
              display: i % showEvery === 0 ? 'block' : 'none' }}>
              {d.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AnalyticsView({ clienteId }) {
  const [preset, setPreset] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [leads, setLeads] = useState([])
  const [agentes, setAgentes] = useState([])
  const [etapasMap, setEtapasMap] = useState({}) // { etapa_id: nome }
  const [agenteFilter, setAgenteFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const getRange = () => {
    const today = new Date(); today.setHours(23, 59, 59, 999)
    if (preset === '7d') {
      const from = new Date(); from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
    if (preset === '30d') {
      const from = new Date(); from.setDate(from.getDate() - 29); from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
    if (preset === 'mes') {
      const t = new Date()
      const from = new Date(t.getFullYear(), t.getMonth(), 1)
      return { from, to: today }
    }
    if (preset === 'custom' && customFrom && customTo) {
      return { from: new Date(customFrom + 'T00:00:00'), to: new Date(customTo + 'T23:59:59') }
    }
    return null
  }

  useEffect(() => {
    if (!clienteId) return
    supabase.from('agentes').select('id, nome').eq('cliente_id', clienteId)
      .then(({ data }) => {
        setAgentes(data || [])
        // Busca etapas de todos os agentes para mapear etapa_id → nome
        const ids = (data || []).map(a => a.id)
        if (!ids.length) return
        supabase.from('etapas_funil').select('id, nome').in('agente_id', ids)
          .then(({ data: etapas }) => {
            const m = {}
            ;(etapas || []).forEach(e => { m[e.id] = e.nome })
            setEtapasMap(m)
          })
      })
  }, [clienteId])

  useEffect(() => {
    if (!clienteId) return
    const range = getRange()
    if (!range) return
    setLoading(true)
    let q = supabase.from('leads')
      .select('id, created_at, etapa_id, agente_id, nome')
      .eq('cliente_id', clienteId)
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString())
      .order('created_at', { ascending: true })
    if (agenteFilter !== 'all') q = q.eq('agente_id', agenteFilter)
    q.then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [clienteId, preset, customFrom, customTo, agenteFilter])

  // Métricas
  const total = leads.length
  const qualificados = leads.filter(l => etapasMap[l.etapa_id] === 'Qualificado').length
  const taxa = total > 0 ? Math.round((qualificados / total) * 100) : 0

  // Gerar todos os dias do range
  const range = getRange()
  const days = []
  if (range) {
    const d = new Date(range.from); d.setHours(0, 0, 0, 0)
    const end = new Date(range.to); end.setHours(0, 0, 0, 0)
    while (d <= end) { days.push(d.toISOString().substring(0, 10)); d.setDate(d.getDate() + 1) }
  }

  const byDay = {}
  leads.forEach(l => {
    const day = l.created_at?.substring(0, 10)
    if (!day) return
    if (!byDay[day]) byDay[day] = { total: 0, qual: 0 }
    byDay[day].total++
    if (etapasMap[l.etapa_id] === 'Qualificado') byDay[day].qual++
  })

  const chartData = days.map(d => {
    const parts = d.split('-')
    return { date: d, label: `${parts[2]}/${parts[1]}`, total: byDay[d]?.total || 0, qual: byDay[d]?.qual || 0 }
  })
  const maxVal = Math.max(...chartData.map(d => d.total), 1)

  const presetBtns = [
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: 'mes', label: 'Este mês' },
    { id: 'custom', label: 'Personalizado' },
  ]

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: co.bg, padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: co.text, margin: 0 }}>Analytics</h2>
        <p style={{ color: co.textMuted, fontSize: 13, marginTop: 4, marginBottom: 0 }}>Desempenho de qualificação de leads</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        {presetBtns.map(p => (
          <button key={p.id} onClick={() => setPreset(p.id)}
            style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${preset === p.id ? co.primary : co.border}`, background: preset === p.id ? co.primaryBg : co.bgCard, color: preset === p.id ? co.primary : co.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: preset === p.id ? 600 : 400 }}>
            {p.label}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${co.border}`, background: co.bgCard, color: co.text, fontSize: 13, fontFamily: 'inherit', colorScheme: 'dark' }} />
            <span style={{ color: co.textMuted, fontSize: 13 }}>até</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${co.border}`, background: co.bgCard, color: co.text, fontSize: 13, fontFamily: 'inherit', colorScheme: 'dark' }} />
          </>
        )}
        {agentes.length > 1 && (
          <select value={agenteFilter} onChange={e => setAgenteFilter(e.target.value)}
            style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, border: `1px solid ${co.border}`, background: co.bgCard, color: co.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="all">Todos os agentes</option>
            {agentes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total de Leads', value: total, color: co.primary, sub: 'leads recebidos no período' },
          { label: 'Leads Qualificados', value: qualificados, color: co.success, sub: 'concluíram a qualificação' },
          { label: 'Taxa de Qualificação', value: `${taxa}%`, color: co.warning, sub: `${qualificados} de ${total} leads` },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: co.bgCard, border: `1px solid ${co.border}`, borderRadius: 12, padding: '24px 28px' }}>
            <div style={{ fontSize: 11, color: co.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{kpi.label}</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{loading ? '—' : kpi.value}</div>
            <div style={{ fontSize: 12, color: co.textDim, marginTop: 8 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico combinado */}
      <div style={{ background: co.bgCard, border: `1px solid ${co.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: co.text }}>Leads por dia</span>
            <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: co.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: co.primary, display: 'inline-block' }} />
                <span style={{ color: co.primary, fontWeight: 600 }}>{loading ? '—' : total}</span> recebidos no período
              </span>
              <span style={{ fontSize: 12, color: co.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: co.success, display: 'inline-block' }} />
                <span style={{ color: co.success, fontWeight: 600 }}>{loading ? '—' : qualificados}</span> qualificados no período
              </span>
            </div>
          </div>
        </div>
        {loading ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: co.textDim, fontSize: 13, marginTop: 16 }}>Carregando...</div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: co.textDim, fontSize: 13, marginTop: 16 }}>Nenhum dado no período</div>
        ) : (
          <BarChart data={chartData} />
        )}
      </div>
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
  const [configInitAgenteId, setConfigInitAgenteId] = useState(null)

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
      if (activeTab === 'analytics') return <AnalyticsView clienteId={clienteId} />
      if (activeTab === 'config') return <ConfigView clienteId={clienteId} initAgenteId={configInitAgenteId} />
    }
    return null
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: co.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: co.text }}>
      <Sidebar user={user} activeTab={activeTab} onTabChange={(tab) => { if (tab !== 'config') setConfigInitAgenteId(null); setActiveTab(tab) }} onLogout={handleLogout} onConfigNav={(agenteId) => { setConfigInitAgenteId(agenteId); setActiveTab('config') }} />
      <div style={{ flex: 1, overflow: "hidden" }}>{renderContent()}</div>
    </div>
  )
}
