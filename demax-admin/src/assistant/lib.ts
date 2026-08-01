/* Ported 1:1 from the Polylog widget (markdown + typewriter + storage). */

import { useEffect, useRef, useState } from 'react'

/* ---------- tiny markdown (escape first — LLM output is untrusted) ---------- */

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const BOLD = /\*\*([^*\n]+?)\*\*/g
const ITALIC = /(?<!\*)\*([^*\n]+?)\*(?!\*)/g
const CODE = /`([^`\n]+?)`/g

function inlineMd(s: string): string {
  return s.replace(BOLD, '<strong>$1</strong>').replace(ITALIC, '<em>$1</em>').replace(CODE, '<code>$1</code>')
}

function renderBlocks(input: string): string {
  const escaped = escapeHtml(input)
  const lines = escaped.split('\n')
  const out: string[] = []
  let listBuffer: string[] = []
  let listType: 'ul' | 'ol' = 'ul'
  let paragraphBuffer: string[] = []

  const flushList = () => {
    if (!listBuffer.length) return
    out.push(`<${listType}>` + listBuffer.map((li) => `<li>${inlineMd(li)}</li>`).join('') + `</${listType}>`)
    listBuffer = []
  }
  const flushParagraph = () => {
    if (!paragraphBuffer.length) return
    out.push(`<p>${inlineMd(paragraphBuffer.join(' '))}</p>`)
    paragraphBuffer = []
  }
  const pushItem = (type: 'ul' | 'ol', text: string) => {
    flushParagraph()
    if (listBuffer.length && listType !== type) flushList()
    listType = type
    listBuffer.push(text)
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      flushList()
      flushParagraph()
      continue
    }
    const ulMatch = /^(?:[-*])\s+(.+)$/.exec(trimmed)
    const olMatch = /^\d+[.)]\s+(.+)$/.exec(trimmed)
    if (ulMatch) pushItem('ul', ulMatch[1])
    else if (olMatch) pushItem('ol', olMatch[1])
    else {
      flushList()
      paragraphBuffer.push(trimmed)
    }
  }
  flushList()
  flushParagraph()
  return out.join('')
}

export function renderMarkdown(input: string): string {
  const segments = input.split('```')
  const out: string[] = []
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (i % 2 === 0) {
      if (seg.trim() !== '') out.push(renderBlocks(seg))
      continue
    }
    let code = seg
    const nl = code.indexOf('\n')
    const firstLine = (nl >= 0 ? code.slice(0, nl) : code).trim()
    if (/^[a-zA-Z0-9_+-]*$/.test(firstLine)) code = nl >= 0 ? code.slice(nl + 1) : ''
    code = code.replace(/\n+$/, '')
    out.push(`<pre class="plg-code"><code>${escapeHtml(code)}</code></pre>`)
  }
  return out.join('')
}

/* ---------- typewriter reveal (client-side, like the Polylog D1 layer) ---------- */

const CHARS_PER_TICK = 3
const TICK_MS = 16

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function useTypewriter(target: string, animate: boolean): string {
  const [shown, setShown] = useState(animate && !prefersReducedMotion() ? '' : target)
  const shownRef = useRef(shown)
  shownRef.current = shown

  useEffect(() => {
    if (!animate || prefersReducedMotion()) {
      setShown(target)
      return
    }
    if (shownRef.current.length >= target.length) {
      setShown(target.slice(0, target.length))
      return
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = () => {
      const cur = shownRef.current.length
      const next = Math.min(target.length, cur + CHARS_PER_TICK)
      setShown(target.slice(0, next))
      if (next < target.length) timer = setTimeout(tick, TICK_MS)
    }
    timer = setTimeout(tick, TICK_MS)
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [target, animate])

  return animate && !prefersReducedMotion() ? shown : target
}

/* ---------- conversation persistence ---------- */

const KEY = 'demax-assistant-conversation'
const OPEN_KEY = 'demax-assistant-open'

export const readConversationId = (): string | null => {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
export const writeConversationId = (id: string) => {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
}
export const clearConversationId = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** Панель лишається відкритою після перезавантаження сторінки. */
export const readOpenState = (): boolean => {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
}
export const writeOpenState = (open: boolean) => {
  try {
    localStorage.setItem(OPEN_KEY, open ? '1' : '0')
  } catch {
    /* ignore */
  }
}

/* ---------- Історія розмови ---------- */

export type HistoryMessage = {
  id: string
  sender: 'customer' | 'ai' | 'manager'
  content: string
  confidence: number | null
  sources: Source[]
}

/** Відновлює збережену розмову з сервера (щоб не починати з нуля щоразу). */
export async function fetchConversation(
  conversationId: string,
  signal?: AbortSignal,
): Promise<HistoryMessage[] | null> {
  const r = await fetch(`${RAG_ORIGIN}/v1/me/conversations/${conversationId}/messages`, { signal })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`history_failed: ${r.status}`)
  const j = await r.json()
  return j.data as HistoryMessage[]
}

/* ---------- RAG API client ---------- */

/**
 * RAG API origin.
 * Локально — http://localhost:8100 (docker compose).
 * На сервері — той самий домен: nginx проксіює /api → 127.0.0.1:8100,
 * тож фронтенд ходить на відносний шлях і не залежить від IP.
 */
export const RAG_ORIGIN =
  import.meta.env.VITE_RAG_ORIGIN ??
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:8100'
    : `${location.origin}/api`)

export type Source = { article_id: string; title: string; url?: string | null }

export type ChatResponse = {
  conversation_id: string
  message_id: string
  reply: string
  intent: string
  confidence: number
  escalated: boolean
  sources: Source[]
}

export async function sendChat(
  text: string,
  conversationId: string | null,
  language: 'uk' | 'ru' | 'en',
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const r = await fetch(`${RAG_ORIGIN}/v1/me/conversations/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, text, language }),
    signal,
  })
  if (!r.ok) throw new Error(`chat_failed: ${r.status}`)
  return r.json()
}
