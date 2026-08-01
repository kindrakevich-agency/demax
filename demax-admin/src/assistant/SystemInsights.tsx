/**
 * AI-зведення по системі — замінює рядок пошуку в шапці.
 *
 * Менеджер питає «що зараз важливо?» звичайною мовою й одразу отримує
 * персональний брифінг: свої ескалації, черга верифікацій, заповнюваність
 * семінарів, прогалини в базі знань. Дані беруться з того самого джерела,
 * що рендерить панель, і надсилаються моделі разом із запитом.
 */

import { useEffect, useRef, useState } from 'react'
import { Sparkles, CornerDownLeft, X, Loader2 } from 'lucide-react'
import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'
import { renderMarkdown, RAG_ORIGIN } from './lib'
import { customers, escalations, verifications, seminars, articles, managers, convPerDay } from '../lib/mock'

/** Хто зараз у панелі — у проді береться з JWT (spec §2). */
const CURRENT_USER = { name: 'Ольга Коваль', role: { uk: 'Адміністратор', ru: 'Администратор', en: 'Administrator' } as Bi }

const PRESETS: { label: Bi; q: Bi }[] = [
  {
    label: { uk: 'Що потребує уваги', ru: 'Что требует внимания', en: 'Needs attention' },
    q: {
      uk: 'Що зараз найбільше потребує моєї уваги?',
      ru: 'Что сейчас больше всего требует моего внимания?',
      en: 'What needs my attention most right now?',
    },
  },
  {
    label: { uk: 'Звіт за сьогодні', ru: 'Отчёт за сегодня', en: "Today's report" },
    q: {
      uk: 'Дай коротке зведення за сьогодні: діалоги, ескалації, верифікації.',
      ru: 'Дай краткую сводку за сегодня: диалоги, эскалации, верификации.',
      en: 'Give me a short summary for today: conversations, escalations, verifications.',
    },
  },
  {
    label: { uk: 'Мої клієнти', ru: 'Мои клиенты', en: 'My customers' },
    q: {
      uk: 'Що відбувається з моїм портфелем клієнтів?',
      ru: 'Что происходит с моим портфелем клиентов?',
      en: 'What is happening with my customer portfolio?',
    },
  },
  {
    label: { uk: 'Якість AI', ru: 'Качество AI', en: 'AI quality' },
    q: {
      uk: 'Як працює AI-асистент і де прогалини в базі знань?',
      ru: 'Как работает AI-ассистент и где пробелы в базе знаний?',
      en: 'How is the AI assistant performing and where are the knowledge gaps?',
    },
  },
]

/** Компактний зріз стану системи — рівно те, що бачить користувач у панелі. */
function buildSnapshot(managerName: string) {
  const mine = managers.find((m) => m.name === managerName)
  const myCustomers = customers.filter((c) => c.managerId === mine?.id)
  return {
    date: '2026-08-01',
    manager: mine ? { name: mine.name, region: mine.region, portfolio: `${mine.assigned}/${mine.capacity}` } : null,
    customers: {
      total: 768,
      in_demo_view: customers.length,
      mine: myCustomers.length,
      professional: customers.filter((c) => c.role === 'professional').length,
      pending_verification: customers.filter((c) => c.verification === 'pending').length,
      no_marketing_consent: customers.filter((c) => !c.consent).length,
    },
    escalations: {
      open: escalations.filter((e) => e.status === 'open').length,
      assigned: escalations.filter((e) => e.status === 'assigned').length,
      resolved: escalations.filter((e) => e.status === 'resolved').length,
      mine: escalations.filter((e) => e.managerId === mine?.id).length,
      by_reason: escalations.reduce<Record<string, number>>((a, e) => ({ ...a, [e.reason]: (a[e.reason] ?? 0) + 1 }), {}),
      oldest_open_hours: 1,
    },
    verifications: {
      pending: verifications.filter((v) => v.status === 'pending').length,
      approved: verifications.filter((v) => v.status === 'approved').length,
      rejected: verifications.filter((v) => v.status === 'rejected').length,
    },
    seminars: seminars
      .filter((s) => s.status === 'open')
      .map((s) => ({ title: s.title, date: s.start, seats: s.capacity, taken: s.taken })),
    knowledge_base: {
      published: articles.filter((a) => a.status === 'published').length,
      in_review: articles.filter((a) => a.status === 'in_review').length,
      draft: articles.filter((a) => a.status === 'draft').length,
      most_cited: articles.filter((a) => a.cited > 0).sort((a, b) => b.cited - a.cited)[0]?.title,
    },
    ai: { conversations_last_8_days: convPerDay, resolved_without_escalation_pct: 91, avg_confidence: 0.79 },
    managers: managers.filter((m) => m.active).map((m) => ({ name: m.name, load: `${m.assigned}/${m.capacity}` })),
  }
}

export default function SystemInsights() {
  const { L, lang } = useApp()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ⌘K / Ctrl+K відкриває панель, Esc закриває.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 40)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const run = async (question: string) => {
    if (!question.trim()) return
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    setFailed(false)
    setReport('')
    try {
      const r = await fetch(`${RAG_ORIGIN}/v1/admin/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({
          question,
          language: lang,
          name: CURRENT_USER.name,
          role: L(CURRENT_USER.role),
          snapshot: buildSnapshot(CURRENT_USER.name),
        }),
      })
      const j = await r.json()
      if (j.report) setReport(j.report)
      else setFailed(true)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const greeting = L({
    uk: `Привіт, Ольго — запитайте про систему`,
    ru: `Привет, Ольга — спросите о системе`,
    en: `Hi Olga — ask about the system`,
  })

  return (
    <>
      {/* тригер у шапці */}
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 40)
        }}
        className="group flex w-full max-w-md items-center gap-2.5 rounded-full border border-transparent bg-white/70 py-2 pr-3 pl-3.5 text-left text-sm transition-colors hover:border-copper-500/40 dark:bg-ink-800/70"
      >
        <Sparkles size={15} className="shrink-0 text-copper-600 dark:text-copper-400" />
        <span className="flex-1 truncate text-ink-400 dark:text-ink-500">{greeting}</span>
        <kbd className="hidden shrink-0 rounded border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-400 sm:block dark:border-ink-600">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-100 flex items-start justify-center p-4 pt-[8vh]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-xs" onClick={() => setOpen(false)} />

          <div className="animate-rise relative flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-200/60 bg-white shadow-pop dark:border-ink-700 dark:bg-ink-900">
            {/* рядок запиту */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void run(q)
              }}
              className="flex items-center gap-3 border-b border-ink-100 px-5 py-4 dark:border-ink-800"
            >
              <Sparkles size={18} className="shrink-0 text-copper-600 dark:text-copper-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={L({
                  uk: 'Запитайте про клієнтів, ескалації, семінари, базу знань…',
                  ru: 'Спросите о клиентах, эскалациях, семинарах, базе знаний…',
                  en: 'Ask about customers, escalations, seminars, the knowledge base…',
                })}
                className="flex-1 border-0 bg-transparent p-0 text-[15px] text-ink-900 placeholder:text-ink-400 focus:ring-0 dark:text-ivory-100"
              />
              {loading ? (
                <Loader2 size={17} className="shrink-0 animate-spin text-copper-600" />
              ) : (
                <CornerDownLeft size={15} className="shrink-0 text-ink-300" />
              )}
              <button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="close">
                <X size={16} />
              </button>
            </form>

            {/* швидкі звіти */}
            {!report && !loading && (
              <div className="px-5 py-4">
                <div className="mb-2.5 text-[11px] font-bold tracking-widest text-ink-400 uppercase">
                  {L({ uk: 'Швидкі звіти', ru: 'Быстрые отчёты', en: 'Quick reports' })}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label.en}
                      type="button"
                      onClick={() => {
                        setQ(L(p.q))
                        void run(L(p.q))
                      }}
                      className="rounded-xl border border-ink-200/70 px-3.5 py-2.5 text-left text-sm font-medium text-ink-700 transition-all hover:-translate-y-0.5 hover:border-copper-500 hover:text-copper-800 dark:border-ink-700 dark:text-ink-200 dark:hover:border-copper-400 dark:hover:text-copper-300"
                    >
                      {L(p.label)}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-ink-400">
                  {L({
                    uk: 'Звіт складається під вас: ваш портфель клієнтів, ваші ескалації, ваші черги.',
                    ru: 'Отчёт составляется под вас: ваш портфель клиентов, ваши эскалации, ваши очереди.',
                    en: 'The briefing is written for you: your portfolio, your escalations, your queues.',
                  })}
                </p>
              </div>
            )}

            {/* звіт */}
            {(report || loading || failed) && (
              <div className="overflow-y-auto px-5 py-4">
                {loading && (
                  <div className="flex items-center gap-2.5 py-6 text-sm text-ink-400">
                    <Loader2 size={15} className="animate-spin" />
                    {L({ uk: 'Аналізую стан системи…', ru: 'Анализирую состояние системы…', en: 'Analysing the system…' })}
                  </div>
                )}
                {failed && !loading && (
                  <p className="py-4 text-sm text-rose-700 dark:text-rose-400">
                    {L({ uk: 'Сервіс звітів недоступний.', ru: 'Сервис отчётов недоступен.', en: 'The reporting service is unavailable.' })}
                  </p>
                )}
                {report && !loading && (
                  <>
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-widest text-copper-700 uppercase dark:text-copper-300">
                      <Sparkles size={12} />
                      {L({ uk: 'Зведення для вас', ru: 'Сводка для вас', en: 'Your briefing' })}
                    </div>
                    <div
                      className="plg-md text-sm leading-relaxed text-ink-800 dark:text-ink-100"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReport('')
                        setQ('')
                        inputRef.current?.focus()
                      }}
                      className="mt-4 text-xs font-bold text-copper-700 hover:underline dark:text-copper-300"
                    >
                      {L({ uk: '← Інший запит', ru: '← Другой запрос', en: '← Another question' })}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
