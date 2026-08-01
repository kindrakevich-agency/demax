/**
 * DEMAX Assistant — the Polylog landing widget ported 1:1 into the admin.
 * Grey #eeeeee panel, translucent blurred header, empty-state headline +
 * starter cards, typewriter reveal, Möbius typing indicator, copy/👍/👎
 * actions, white composer card with a dark send button, amber FAB with
 * pulsing halo rings. Talks to the local RAG API (spec 4.4.4).
 */

import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/app'
import {
  clearConversationId, fetchConversation, readConversationId, readOpenState, renderMarkdown,
  sendChat, useTypewriter, writeConversationId, writeOpenState,
} from './lib'
import type { Source } from './lib'

type Msg = {
  kind: 'user' | 'assistant'
  id: string
  text: string
  animate?: boolean
  sources?: Source[]
  escalated?: boolean
  confidence?: number
}

let _seq = 0
const tempId = (p: string) => `${p}-${++_seq}`

// Polyphonic Möbius — the continuous figure-8 mark from the Polylog widget.
const LOOP = 'M4 16 C4 7 13 7 16 16 C19 25 28 25 28 16 C28 7 19 7 16 16 C13 25 4 25 4 16 Z'

/* ---------- FAB ---------- */

function FAB({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close chat' : 'Open chat'}
      className="pointer-events-auto fixed right-5 bottom-5 z-95 grid h-14 w-14 place-items-center rounded-full bg-white text-neutral-900 shadow-[0_10px_30px_-10px_rgba(40,36,28,0.45)] outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#f4b41a] focus-visible:ring-offset-2"
    >
      {!open && (
        <>
          <span aria-hidden="true" className="plg-fab-ring" />
          <span aria-hidden="true" className="plg-fab-ring plg-fab-ring--delay" />
        </>
      )}
      {open ? (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      ) : (
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="plg-fab-loop" x1="0" y1="16" x2="32" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f7c948" />
              <stop offset="55%" stopColor="#f4b41a" />
              <stop offset="100%" stopColor="#f08a1d" />
            </linearGradient>
          </defs>
          <path d={LOOP} stroke="url(#plg-fab-loop)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )}
    </button>
  )
}

/* ---------- typing indicator (animated Möbius) ---------- */

function TypingIndicator() {
  return (
    <div role="status" aria-label="typing" className="flex items-center px-1 py-1.5">
      <svg width="42" height="42" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="plg-typing-loop" x1="0" y1="16" x2="32" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b6ef5" />
            <stop offset="55%" stopColor="#5b5bd6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d={LOOP} stroke="url(#plg-typing-loop)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.22" />
        <path className="plg-loop-draw" d={LOOP} pathLength={100} stroke="url(#plg-typing-loop)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

/* ---------- one message ---------- */

function Bubble({ msg, actionable, L }: { msg: Msg; actionable: boolean; L: (b: { uk: string; ru: string; en: string }) => string }) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const shownText = useTypewriter(msg.text, !!msg.animate)
  const isTyping = shownText.length < msg.text.length

  if (msg.kind === 'user') {
    return (
      <div className="mt-5 flex justify-end">
        <div className="max-w-[78%] rounded-xl bg-[#e0e0e0] px-4 py-2.5 text-[15px] leading-[1.5] text-neutral-900">{msg.text}</div>
      </div>
    )
  }

  const html = renderMarkdown(shownText).replace(/\[\d+\]/g, '')

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(msg.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className="mt-5">
      <div className="text-[15px] leading-[1.55] text-neutral-900">
        <div className="plg-md" dangerouslySetInnerHTML={{ __html: html }} />
        {isTyping && <span aria-hidden="true" className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-neutral-400" />}
      </div>

      {/* admin context: show grounding — source pills + escalation notice */}
      {!isTyping && msg.sources && msg.sources.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {msg.sources.map((s) => (
            <a
              key={s.article_id}
              href={s.url ?? undefined}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex max-w-56 items-center gap-1 rounded-full bg-[#e3e3e3] px-2.5 py-1 text-[11.5px] text-neutral-600 ${s.url ? 'hover:bg-[#d8d8d8] hover:text-neutral-900' : 'cursor-default'}`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
              <span className="truncate">{s.title}</span>
            </a>
          ))}
          {msg.confidence !== undefined && (
            <span className="inline-flex items-center rounded-full bg-[#e3e3e3] px-2.5 py-1 font-mono text-[11px] text-neutral-500">{msg.confidence.toFixed(2)}</span>
          )}
        </div>
      )}
      {!isTyping && msg.escalated && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[12px] font-medium text-amber-800">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          {L({ uk: 'Передано менеджеру', ru: 'Передано менеджеру', en: 'Handed to a manager' })}
        </div>
      )}

      {actionable && !isTyping && (
        <div className="mt-3 mb-2 flex items-center gap-2 text-neutral-500">
          <button type="button" onClick={handleCopy} className="rounded-lg p-1.5 transition-colors hover:bg-neutral-300/60 hover:text-neutral-800" aria-label="copy" title={copied ? 'Copied' : 'Copy'}>
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFeedback((f) => (f === 'up' ? null : 'up'))}
            className={`rounded-lg p-1.5 transition-colors hover:bg-neutral-300/60 hover:text-neutral-800 ${feedback === 'up' ? 'bg-neutral-300/60 text-neutral-800' : ''}`}
            aria-label="thumbs up"
            aria-pressed={feedback === 'up'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>
          </button>
          <button
            type="button"
            onClick={() => setFeedback((f) => (f === 'down' ? null : 'down'))}
            className={`rounded-lg p-1.5 transition-colors hover:bg-neutral-300/60 hover:text-neutral-800 ${feedback === 'down' ? 'bg-neutral-300/60 text-neutral-800' : ''}`}
            aria-label="thumbs down"
            aria-pressed={feedback === 'down'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- root widget ---------- */

export default function AssistantWidget() {
  const { L, lang } = useApp()
  const [open, setOpen] = useState(() => readOpenState())
  const [fullScreen, setFullScreen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [streaming, setStreaming] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(() => readConversationId())
  const [value, setValue] = useState('')
  const restoredRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const greeting = L({ uk: 'Чим я можу допомогти з доглядом DEMAX?', ru: 'Чем я могу помочь с уходом DEMAX?', en: 'How can I help with DEMAX care?' })
  const starters = [
    L({ uk: 'Як доглядати за шкірою після пілінгу?', ru: 'Как ухаживать за кожей после пилинга?', en: 'How should I care for skin after a peeling?' }),
    L({ uk: 'Які засоби DEMAX є для проблемної шкіри?', ru: 'Какие средства DEMAX есть для проблемной кожи?', en: 'Which DEMAX products are for problem skin?' }),
    L({ uk: 'Які засоби для догляду за тілом є у DEMAX?', ru: 'Какие средства для ухода за телом есть у DEMAX?', en: 'What body-care products does DEMAX have?' }),
    L({ uk: 'Які семінари DEMAX проводить для косметологів?', ru: 'Какие семинары DEMAX проводит для косметологов?', en: 'What seminars does DEMAX run for cosmetologists?' }),
  ]

  // Стан «відкрито» переживає перезавантаження сторінки.
  useEffect(() => {
    writeOpenState(open)
  }, [open])

  // Відновлення збереженої розмови при першому відкритті: показуємо
  // попередню переписку замість того, щоб починати діалог наново.
  useEffect(() => {
    if (!open || restoredRef.current) return
    restoredRef.current = true
    if (!conversationId) return
    const ac = new AbortController()
    setRestoring(true)
    void (async () => {
      try {
        const history = await fetchConversation(conversationId, ac.signal)
        if (!history || history.length === 0) {
          clearConversationId()
          setConversationId(null)
          return
        }
        setMessages(
          history.map((m) => ({
            kind: m.sender === 'customer' ? 'user' : 'assistant',
            id: m.id,
            text: m.content,
            animate: false, // історію показуємо одразу, без ефекту друку
            sources: m.sources,
            confidence: m.confidence ?? undefined,
          })),
        )
      } catch {
        // мережевий збій — лишаємо порожній стан, розмова продовжиться далі
      } finally {
        setRestoring(false)
      }
    })()
    return () => ac.abort()
  }, [open, conversationId])

  // Snap to bottom on a new turn; follow the growing typewriter text.
  useEffect(() => {
    stick.current = true
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, streaming])

  useEffect(() => {
    const outer = scrollRef.current
    const inner = contentRef.current
    if (!outer || !inner) return
    const toBottom = () => {
      if (stick.current) outer.scrollTop = outer.scrollHeight
    }
    const ro = new ResizeObserver(toBottom)
    ro.observe(inner)
    const onScroll = () => {
      stick.current = outer.scrollHeight - outer.scrollTop - outer.clientHeight < 80
    }
    outer.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      outer.removeEventListener('scroll', onScroll)
    }
  }, [open])

  const startTurn = async (text: string) => {
    setError(null)
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setStreaming(true)
    setMessages((m) => [...m, { kind: 'user', id: tempId('u'), text }])
    try {
      const res = await sendChat(text, conversationId, lang, ac.signal)
      setConversationId(res.conversation_id)
      writeConversationId(res.conversation_id)
      setMessages((m) => [
        ...m,
        {
          kind: 'assistant',
          id: res.message_id,
          text: res.reply,
          animate: true,
          sources: res.sources,
          escalated: res.escalated,
          confidence: res.confidence,
        },
      ])
    } catch (e) {
      if (!ac.signal.aborted) setError((e as Error).message || 'stream_failed')
    } finally {
      setStreaming(false)
    }
  }

  const send = () => {
    const v = value.trim()
    if (!v || streaming) return
    setValue('')
    if (taRef.current) taRef.current.style.height = 'auto'
    void startTurn(v)
  }

  const autoSize = () => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 168)}px`
  }

  const onNewConversation = () => {
    abortRef.current?.abort()
    clearConversationId()
    setConversationId(null)
    setMessages([])
    setError(null)
    setStreaming(false)
  }

  const onClose = () => {
    abortRef.current?.abort()
    setOpen(false)
    setFullScreen(false)
  }

  // External trigger: any page can dispatch `demax-assistant-ask` with a
  // question in `detail` — the widget opens and answers it (used by the
  // example-question chips on the Analysis page).
  useEffect(() => {
    const onAsk = (e: Event) => {
      const text = (e as CustomEvent<string>).detail
      if (!text) return
      setOpen(true)
      void startTurn(text)
    }
    window.addEventListener('demax-assistant-ask', onAsk)
    return () => window.removeEventListener('demax-assistant-ask', onAsk)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lang])

  const hasUserMessages = messages.some((m) => m.kind === 'user')
  // Поки триває відновлення історії — не показуємо порожній стан із
  // привітанням, інакше воно блимне перед збереженою розмовою.
  const inEmptyState = !hasUserMessages && !restoring

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].kind === 'assistant') return i
    return -1
  })()

  const docked =
    'fixed bottom-24 right-5 h-[min(724px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2.5rem))] rounded-[2rem] border border-neutral-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.18)]'
  const full = 'fixed inset-0 h-dvh w-screen rounded-none border-0 shadow-none'

  return (
    <>
      <FAB open={open} onClick={() => (open ? onClose() : setOpen(true))} />
      {open && (
        <section className={`pointer-events-auto z-94 flex flex-col overflow-hidden bg-[#eeeeee] ${fullScreen ? full : docked}`} role="dialog" aria-label="Chat panel">
          {/* header — translucent blurred overlay */}
          <header className="absolute inset-x-0 top-0 z-20 flex items-center bg-[#eeeeee]/65 px-5 pt-5 pb-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => setFullScreen((v) => !v)}
              className="rounded-lg p-1 text-neutral-700 transition-colors hover:bg-neutral-300/60"
              aria-label={fullScreen ? 'Collapse' : 'Expand'}
            >
              {fullScreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5" /><line x1="9.5" y1="4" x2="9.5" y2="20" /></svg>
              )}
            </button>
            <div className="flex-1 truncate px-2 text-center text-[15px] font-medium text-neutral-700">
              {L({ uk: 'DEMAX Консультант', ru: 'DEMAX Консультант', en: 'DEMAX Consultant' })}
            </div>
            <button type="button" onClick={onNewConversation} aria-label="New conversation" className="mr-1.5 rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-neutral-300/60 hover:text-neutral-800">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-neutral-300/70 text-neutral-600 transition-colors hover:bg-neutral-400/60 hover:text-neutral-900">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </header>

          {/* EU AI Act transparency notice */}
          <div className="flex items-center gap-2 border-b border-neutral-200 bg-[#f4f4f4] px-4 py-2 pt-[74px] text-[12px] text-neutral-500" role="note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 11v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="7.6" r="1" fill="currentColor" /></svg>
            <span>{L({ uk: 'Ви спілкуєтеся з ШІ-асистентом', ru: 'Вы общаетесь с ИИ-ассистентом', en: 'You are chatting with an AI assistant' })}</span>
          </div>

          {inEmptyState ? (
            <div className="grid flex-1 place-items-center px-6">
              <h1 className="text-center text-[22px] leading-snug font-bold tracking-tight text-neutral-900">{greeting}</h1>
            </div>
          ) : (
            <div ref={scrollRef} className="plg-no-sb flex-1 overflow-y-auto px-5 pt-2 pb-2 text-[15px] text-neutral-900" aria-live="polite">
              <div ref={contentRef}>
                {messages.map((m, i) => (
                  <Bubble key={m.id} msg={m} actionable={m.kind === 'assistant' && i === lastAssistantIdx} L={L} />
                ))}
                {streaming && (
                  <div className="mt-3">
                    <TypingIndicator />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-4 pb-4">
            {inEmptyState && !streaming && !restoring && (
              <div className="mb-3 grid grid-cols-2 gap-3">
                {starters.map((s) => (
                  <button key={s} type="button" onClick={() => void startTurn(s)} className="rounded-2xl bg-[#e3e3e3] px-4 py-3 text-left text-[15px] leading-snug text-neutral-700 transition-colors hover:bg-[#d8d8d8]">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {inEmptyState && streaming && (
              <div className="mb-3 flex justify-center"><TypingIndicator /></div>
            )}

            {/* composer — white rounded-3xl card, dark send button */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="rounded-3xl border border-neutral-200 bg-white px-4 pt-4 pb-3 shadow-sm transition-colors focus-within:border-neutral-300"
            >
              <textarea
                ref={taRef}
                rows={1}
                value={value}
                disabled={streaming}
                maxLength={2000}
                placeholder={L({ uk: 'Запитайте про продукти, догляд, семінари…', ru: 'Спросите о продуктах, уходе, семинарах…', en: 'Ask about products, care, seminars…' })}
                onChange={(e) => {
                  setValue(e.target.value)
                  autoSize()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                className="plg-no-sb mb-3 max-h-[168px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-[16px] text-neutral-900 placeholder-neutral-400 focus:ring-0"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-neutral-500">
                  <button type="button" disabled className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 transition-colors disabled:opacity-40" aria-label="Attach">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                  </button>
                  <button type="button" disabled className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 transition-colors disabled:opacity-40" aria-label="Web search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  </button>
                  <button type="button" disabled className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 transition-colors disabled:opacity-40" aria-label="Ideas">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>
                  </button>
                </div>
                <button type="submit" aria-label="Send" disabled={streaming || !value.trim()} className="grid h-11 w-11 place-items-center rounded-2xl bg-neutral-900 text-white transition-colors hover:bg-neutral-700 disabled:opacity-40">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
                </button>
              </div>
            </form>

            {error ? (
              <p className="mt-2 text-center text-[12px] text-rose-600" role="alert">
                {L({ uk: 'Не вдалося отримати відповідь. RAG API запущено? (localhost:8100)', ru: 'Не удалось получить ответ. RAG API запущен? (localhost:8100)', en: 'Failed to get a reply. Is the RAG API running? (localhost:8100)' })}
              </p>
            ) : (
              <p className="mt-3 text-center text-[12px] text-neutral-400">
                {L({ uk: 'ШІ може помилятися. Перевіряйте важливу інформацію.', ru: 'ИИ может ошибаться. Проверяйте важную информацию.', en: 'AI can make mistakes. Please double-check responses.' })}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  )
}
