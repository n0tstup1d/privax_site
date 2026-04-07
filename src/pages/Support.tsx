import { useState, useEffect, useRef } from 'react'
import { apiFetch, getToken, isTokenValid, saveTokens, clearTokens, API } from '../Api'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import NavbarAuth from '../components/NavbarAuth'
import NavbarPublic from '../components/NavbarPublic'
import Footer from '../components/Footer'

const C = {
  bg: '#0d0f10', surface: '#111416', card: '#161a1d',
  border: '#242a2e', borderHi: '#2e3840', accent: '#ffffff',
  dim: '#8a9aaa', dimHi: '#b0c0cc',
  green: '#00e5a0', greenDim: 'rgba(0,229,160,0.1)', greenGlow: 'rgba(0,229,160,0.25)',
  red: '#ff5e5e', redDim: 'rgba(255,94,94,0.1)',
  orange: '#f5a623', orangeDim: 'rgba(245,166,35,0.1)',
}


interface Reply   { id: number; is_admin: boolean; message: string; created_at: string }
interface Ticket  { id: number; type: string; subject: string; message: string; status: string; created_at: string; updated_at: string; replies: Reply[] }

const TYPES = [
  { key: 'question',   icon: '❓', label: 'Вопрос',      desc: 'Хочу уточнить что-то о сервисе' },
  { key: 'complaint',  icon: '⚠️', label: 'Жалоба',      desc: 'Что-то работает не так' },
  { key: 'suggestion', icon: '💡', label: 'Предложение',  desc: 'Есть идея по улучшению' },
]

function statusInfo(status: string) {
  if (status === 'answered') return { label: 'Отвечено',  color: C.green,  bg: C.greenDim,  border: 'rgba(0,229,160,0.25)' }
  if (status === 'closed')   return { label: 'Закрыто',   color: C.dim,    bg: C.card,      border: C.border }
  return                            { label: 'Открыто',   color: C.orange, bg: C.orangeDim, border: 'rgba(245,166,35,0.3)' }
}

const inputBase: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: C.card,
  border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '12px 14px', color: C.accent, fontSize: '0.88rem',
  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
}

// ─── Компонент вложений ─────────────────────────────────────────────
function AttachmentList({ attachments }: { attachments: { id: number; filename: string; mime_type: string; size: number; url: string }[] }) {
  if (!attachments || attachments.length === 0) return null
  return (
    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {attachments.map(a => {
        const isImg = a.mime_type.startsWith('image/')
        const href = `${API}${a.url}`
        return isImg ? (
          <a key={a.id} href={href} target="_blank" rel="noreferrer"
            style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, flexShrink: 0 }}>
            <img src={href} alt={a.filename} style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }} />
          </a>
        ) : (
          <a key={a.id} href={href} target="_blank" rel="noreferrer" download={a.filename}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', color: C.dimHi, fontSize: '0.76rem', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = C.green}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
            📄 {a.filename} <span style={{ color: C.dim }}>({(a.size / 1024).toFixed(0)} КБ)</span>
          </a>
        )
      })}
    </div>
  )
}

// ─── Модальное окно (портал) ─────────────────────────────────────────
export function SupportModal({ onClose, initialSubject = '', initialType = 'question' }: { onClose: () => void; initialSubject?: string; initialType?: string }) {
  const [step,     setStep]     = useState<'type' | 'form' | 'done'>('type')
  const [type,     setType]     = useState(initialType)
  const [subject,  setSubject]  = useState(initialSubject)
  const [message,  setMessage]  = useState('')
  const [sending,  setSending]  = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const toast = useToast()
  const loggedIn = isTokenValid()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) { toast.error('Заполните все поля'); return }
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('type', type)
      fd.append('subject', subject.trim())
      fd.append('message', message.trim())
      attachedFiles.forEach(f => fd.append('files', f))
      const r = await apiFetch(`/support/tickets`, {
        method: 'POST',
        
        body: fd,
      })
      if (r.ok) { setStep('done'); }
      else { const d = await r.json(); toast.error(d.detail || 'Ошибка') }
    } catch { toast.error('Ошибка сети') }
    setSending(false)
  }

  return (
    <div ref={overlayRef} onClick={handleOverlayClick}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="privax-modal" style={{ background: C.surface, borderRadius: 22, border: `1px solid ${C.border}`, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', animation: 'modalIn 0.25s ease both', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
        <style>{`@keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} } .privax-modal * { box-sizing: border-box !important; margin: 0; }`}</style>

        {/* Шапка */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: C.green, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Поддержка Privax</div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: C.accent }}>
              {step === 'type' ? 'Чем можем помочь?' : step === 'done' ? 'Готово!' : TYPES.find(t => t.key === type)?.label}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.dim, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px 24px', overflow: 'hidden' }}>

          {/* Шаг 1 — выбор типа */}
          {step === 'type' && (
            <>
              {!loggedIn && (
                <div style={{ background: C.orangeDim, border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: C.orange }}>
                  ⚠️ Для отправки обращения нужно войти в аккаунт
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TYPES.map(t => (
                  <button key={t.key} onClick={() => { if (!loggedIn) return; setType(t.key); setStep('form') }}
                    style={{ width: '100%', boxSizing: 'border-box' as const, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', cursor: loggedIn ? 'pointer' : 'not-allowed', textAlign: 'left' as const, fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.2s', opacity: loggedIn ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 14 }}
                    onMouseEnter={e => { if (loggedIn) { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = C.greenDim }}}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: C.accent, fontSize: '0.9rem', marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontSize: '0.78rem', color: C.dim }}>{t.desc}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: C.dim, fontSize: '0.9rem' }}>→</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Шаг 2 — форма */}
          {step === 'form' && (
            <>
              <button onClick={() => setStep('type')}
                style={{ background: 'none', border: 'none', color: C.dim, fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18 }}
                onMouseEnter={e => e.currentTarget.style.color = C.accent}
                onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                ← Назад
              </button>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.78rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 7 }}>Тема</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Кратко опишите проблему"
                  style={inputBase}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.78rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 7 }}>Сообщение</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Подробно опишите ваш вопрос или проблему..." rows={5}
                  style={{ ...inputBase, resize: 'vertical', lineHeight: 1.65 } as React.CSSProperties}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>

              {/* Прикрепить файлы */}
              <div style={{ marginBottom: 16 }}>
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt,.zip"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const newFiles = Array.from(e.target.files || [])
                    setAttachedFiles(prev => {
                      const existing = new Set(prev.map(f => f.name + f.size))
                      return [...prev, ...newFiles.filter(f => !existing.has(f.name + f.size))]
                    })
                    e.target.value = ''
                  }} />

                <button onClick={() => fileRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.greenDim, border: `1px solid rgba(0,229,160,0.35)`, borderRadius: 10, padding: '11px 14px', color: C.green, fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', margin: 0, transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,160,0.18)'; e.currentTarget.style.borderColor = C.green; e.currentTarget.style.boxShadow = `0 0 12px rgba(0,229,160,0.2)` }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.greenDim; e.currentTarget.style.borderColor = 'rgba(0,229,160,0.35)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  Прикрепить файл или фото
                </button>

                {attachedFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {attachedFiles.map((f, i) => {
                      const isImg = f.type.startsWith('image/')
                      const preview = isImg ? URL.createObjectURL(f) : null
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, borderRadius: 9, padding: '8px 10px', border: `1px solid ${C.border}` }}>
                          {preview
                            ? <img src={preview} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                            : <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>📄</span>}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', color: C.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                            <div style={{ fontSize: '0.68rem', color: C.dim }}>{(f.size / 1024).toFixed(0)} КБ</div>
                          </div>
                          <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ background: C.redDim, border: 'none', color: C.red, borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>✕</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <button onClick={handleSubmit} disabled={sending}
                style={{ display: 'block', width: '100%', boxSizing: 'border-box', margin: 0, textAlign: 'center', background: sending ? 'transparent' : C.green, color: sending ? C.green : C.bg, border: `1px solid ${C.green}`, borderRadius: 13, padding: '14px 0', fontWeight: 800, fontSize: '0.9rem', cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: sending ? 'none' : `0 0 20px ${C.greenGlow}`, transition: 'all 0.2s' }}>
                {sending ? 'Отправляем...' : 'Отправить →'}
              </button>
            </>
          )}

          {/* Шаг 3 — успех */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.greenDim, border: `2px solid rgba(0,229,160,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 20px' }}>✓</div>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>Обращение отправлено!</h3>
              <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: C.dim, lineHeight: 1.6 }}>Мы рассмотрим его в ближайшее время.<br />Ответ появится в разделе «Мои обращения».</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose}
                  style={{ flex: 1, boxSizing: 'border-box' as const, textAlign: 'center' as const, background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 11, padding: '11px 0', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Закрыть
                </button>
                <button onClick={() => { setStep('type'); setSubject(''); setMessage('') }}
                  style={{ flex: 1, boxSizing: 'border-box' as const, textAlign: 'center' as const, background: C.green, color: C.bg, border: 'none', borderRadius: 11, padding: '11px 0', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Ещё обращение
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Страница /support ───────────────────────────────────────────────
export default function SupportPage() {
  const navigate = useNavigate()
  const loggedIn = isTokenValid()
  const toast = useToast()
  const [showModal,   setShowModal]   = useState(false)
  const [tickets,     setTickets]     = useState<Ticket[]>([])
  const [loadingTix,  setLoadingTix]  = useState(false)
  const [openId,      setOpenId]      = useState<number | null>(null)
  const [replyMsg,    setReplyMsg]    = useState('')
  const [replySending,setReplySending]= useState(false)

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/')
  }

  useEffect(() => {
    if (!loggedIn) return
    setLoadingTix(true)
    apiFetch('/support/tickets')
      .then(r => r.ok ? r.json() : [])
      .then(d => setTickets(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingTix(false))
  }, [])

  const replyFileRef = useRef<HTMLInputElement>(null)
  const [replyFiles, setReplyFiles] = useState<Record<number, File[]>>({})

  async function submitReply(ticketId: number) {
    if (!replyMsg.trim()) return
    setReplySending(true)
    const fd = new FormData()
    fd.append('message', replyMsg)
    ;(replyFiles[ticketId] || []).forEach(f => fd.append('files', f))
    const r = await apiFetch(`/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      
      body: fd,
    })
    if (r.ok) {
      const data = await r.json()
      setTickets(prev => prev.map(t => t.id === ticketId ? data : t))
      setReplyMsg('')
      setReplyFiles(prev => { const n = {...prev}; delete n[ticketId]; return n })
      toast.success('Ответ отправлен')
    } else {
      toast.error('Не удалось отправить ответ')
    }
    setReplySending(false)
  }

  async function closeTicket(ticketId: number) {
    await apiFetch(`/support/tickets/${ticketId}/close`, { method: 'POST' })
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t))
  }

  function onModalClose() {
    setShowModal(false)
    // Обновляем список после отправки
    if (loggedIn) {
      apiFetch('/support/tickets')
        .then(r => r.ok ? r.json() : [])
        .then(d => setTickets(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
  }

  const typeIcon  = (t: string) => ({ question: '❓', complaint: '⚠️', suggestion: '💡' }[t] ?? '📩')
  const typeLabel = (t: string) => ({ question: 'Вопрос', complaint: 'Жалоба', suggestion: 'Предложение' }[t] ?? t)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', color: C.accent, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .ticket-card:hover { border-color: ${C.borderHi} !important; }
        textarea:focus, input:focus { border-color: ${C.green} !important; }
      `}</style>

      {showModal && <SupportModal onClose={onModalClose} />}

      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', width: '100%', padding: 'clamp(36px,6vw,64px) 20px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56, animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: C.greenDim, border: `2px solid rgba(0,229,160,0.25)`, fontSize: '2rem', marginBottom: 20 }}>🛡</div>
          <h1 style={{ fontSize: 'clamp(1.7rem,4vw,2.4rem)', fontWeight: 900, color: C.accent, letterSpacing: '-0.02em', marginBottom: 12 }}>Поддержка</h1>
          <p style={{ fontSize: '0.95rem', color: C.dim, maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.65 }}>
            Задайте вопрос, сообщите о проблеме или поделитесь предложением — мы ответим как можно скорее
          </p>
          <button onClick={() => setShowModal(true)}
            style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 14, padding: '14px 36px', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 28px ${C.greenGlow}`, transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 40px rgba(0,229,160,0.45)`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 28px ${C.greenGlow}`}>
            Написать обращение →
          </button>
        </div>

        {/* Мои обращения */}
        {loggedIn && (
          <div style={{ animation: 'fadeUp 0.4s 0.15s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: '0.62rem', color: C.green, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Мои обращения</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              {tickets.length > 0 && <span style={{ fontSize: '0.72rem', color: C.dim }}>{tickets.length}</span>}
            </div>

            {loadingTix ? (
              <div style={{ textAlign: 'center', color: C.dim, padding: '40px 0' }}>Загрузка...</div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.dim, fontSize: '0.88rem' }}>
                Обращений пока нет
              </div>
            ) : tickets.map(ticket => {
              const isOpen = openId === ticket.id
              const st = statusInfo(ticket.status)
              return (
                <div key={ticket.id} className="ticket-card"
                  style={{ marginBottom: 10, borderRadius: 16, border: `1px solid ${isOpen ? C.green : C.border}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>

                  {/* Заголовок */}
                  <div onClick={() => setOpenId(isOpen ? null : ticket.id)}
                    style={{ padding: '16px 18px', background: C.surface, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: C.accent }}>{typeIcon(ticket.type)} {ticket.subject}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: C.dim }}>
                        {typeLabel(ticket.type)} · {new Date(ticket.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · {ticket.replies.length} ответов
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 6, padding: '3px 9px' }}>{st.label}</span>
                      <span style={{ color: C.dim, fontSize: '0.85rem', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'block' }}>▾</span>
                    </div>
                  </div>

                  {/* Диалог */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${C.border}`, background: C.card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Исходное */}
                      <div style={{ padding: '12px 14px', background: C.surface, borderRadius: 10, borderLeft: `3px solid ${C.borderHi}` }}>
                        <div style={{ fontSize: '0.7rem', color: C.dim, marginBottom: 5 }}>Ваше сообщение</div>
                        <div style={{ fontSize: '0.86rem', color: C.dimHi, lineHeight: 1.65 }}>{ticket.message}</div>
                        <AttachmentList attachments={ticket.attachments || []} />
                      </div>

                      {/* Ответы */}
                      {ticket.replies.map((r: any) => (
                        <div key={r.id} style={{ padding: '12px 14px', borderRadius: 10, borderLeft: `3px solid ${r.is_admin ? C.green : C.borderHi}`, background: r.is_admin ? C.greenDim : C.surface, border: `1px solid ${r.is_admin ? 'rgba(0,229,160,0.2)' : C.border}` }}>
                          <div style={{ fontSize: '0.7rem', color: r.is_admin ? C.green : C.dim, marginBottom: 5, fontWeight: 600 }}>
                            {r.is_admin ? '🛡 Поддержка Privax' : '👤 Вы'} · {new Date(r.created_at).toLocaleDateString('ru-RU')}
                          </div>
                          <div style={{ fontSize: '0.86rem', color: C.dimHi, lineHeight: 1.65 }}>{r.message}</div>
                          <AttachmentList attachments={r.attachments || []} />
                        </div>
                      ))}

                      {/* Ответить / Закрыть */}
                      {ticket.status !== 'closed' && (
                        <div style={{ marginTop: 4 }}>
                          <textarea value={replyMsg} onChange={e => setReplyMsg(e.target.value)} placeholder="Написать ответ..."
                            style={{ ...inputBase, resize: 'none', height: 80, lineHeight: 1.6, marginBottom: 8 } as React.CSSProperties}
                            onFocus={e => e.target.style.borderColor = C.green}
                            onBlur={e => e.target.style.borderColor = C.border} />
                          {/* Файлы в ответе */}
                          <div style={{ marginBottom: 8 }}>
                            <input type="file" multiple accept="image/*,.pdf,.txt,.zip" style={{ display: 'none' }}
                              id={`reply-file-${ticket.id}`}
                              onChange={e => {
                                const newF = Array.from(e.target.files || [])
                                setReplyFiles(prev => {
                                  const cur = prev[ticket.id] || []
                                  const existing = new Set(cur.map((f:File) => f.name + f.size))
                                  return { ...prev, [ticket.id]: [...cur, ...newF.filter(f => !existing.has(f.name + f.size))] }
                                })
                                e.target.value = ''
                              }} />
                            <label htmlFor={`reply-file-${ticket.id}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.greenDim, border: `1px solid rgba(0,229,160,0.3)`, borderRadius: 8, padding: '6px 12px', color: C.green, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', marginBottom: 8, transition: 'background 0.2s, box-shadow 0.2s' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,160,0.18)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(0,229,160,0.18)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.greenDim; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                              Прикрепить файл
                            </label>
                            {(replyFiles[ticket.id] || []).length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(replyFiles[ticket.id] || []).map((f: File, i: number) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.card, borderRadius: 7, padding: '4px 8px', border: `1px solid ${C.border}`, fontSize: '0.72rem', color: C.dim }}>
                                    {f.type.startsWith('image/') ? '🖼' : '📄'} {f.name}
                                    <button onClick={() => setReplyFiles(prev => ({ ...prev, [ticket.id]: prev[ticket.id].filter((_:File, idx:number) => idx !== i) }))}
                                      style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}>✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => submitReply(ticket.id)} disabled={replySending || !replyMsg.trim()}
                              style={{ flex: 1, background: C.green, color: C.bg, border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: '0.83rem', cursor: replySending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !replyMsg.trim() ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                              {replySending ? 'Отправка...' : 'Ответить →'}
                            </button>
                            <button onClick={() => closeTicket(ticket.id)}
                              style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' as const }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,94,94,0.4)'; e.currentTarget.style.color = C.red }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}>
                              Закрыть
                            </button>
                          </div>
                        </div>
                      )}
                      {ticket.status === 'closed' && (
                        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: C.dim, padding: '6px 0' }}>Обращение закрыто</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Для неавторизованных — CTA */}
        {!loggedIn && (
          <div style={{ background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`, padding: '28px 24px', textAlign: 'center', animation: 'fadeUp 0.4s 0.15s ease both' }}>
            <div style={{ fontSize: '0.88rem', color: C.dim, marginBottom: 16, lineHeight: 1.6 }}>
              Войдите в аккаунт, чтобы отправить обращение и отслеживать его статус
            </div>
            <button onClick={() => navigate('/login')}
              style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 11, padding: '11px 28px', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Войти →
            </button>
          </div>
        )}

      </main>
      <Footer />
    </div>
  )
}