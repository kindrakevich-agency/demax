import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Bot, User, UserCog, Cog, Download } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Status, Button, Textarea, EmptyState, Confidence, SectionTitle } from '../components/ui'
import { convById, customerById, articleById } from '../lib/mock'
import type { Msg } from '../lib/mock'

const senderIcon = { customer: User, ai: Bot, manager: UserCog, system: Cog }

function Bubble({ m }: { m: Msg }) {
  const { L, lang } = useApp()
  const Icon = senderIcon[m.sender]
  const mine = m.sender === 'ai' || m.sender === 'manager'
  if (m.sender === 'system')
    return (
      <div className="my-2 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
        <Cog size={11} /> {m.text}
      </div>
    )
  return (
    <div className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
      <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${mine ? 'bg-copper-600/15 text-copper-700 dark:text-copper-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300'}`}>
        <Icon size={15} />
      </span>
      <div className={`max-w-[75%] ${mine ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed ${
          mine
            ? 'rounded-tr-sm bg-copper-600/10 text-ink-900 dark:bg-copper-400/15 dark:text-ivory-100'
            : 'rounded-tl-sm bg-white text-ink-900 shadow-card dark:bg-ink-800 dark:text-ivory-100'
        }`}>
          {m.text}
        </div>
        <div className={`mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-400 ${mine ? 'justify-end' : ''}`}>
          <span>{fmtDate(m.time, lang, true)}</span>
          {m.intent && <span className="font-mono">{m.intent}</span>}
          {m.confidence !== undefined && <Confidence v={m.confidence} />}
          {m.sources?.map((s) => {
            const a = articleById(s)
            return a ? (
              <Link key={s} to={`/knowledge/${s}`} className="rounded-full bg-sage-100 px-2 py-0.5 font-medium text-sage-700 hover:underline dark:bg-sage-700/25 dark:text-sage-400">
                § {a.title.slice(0, 28)}…
              </Link>
            ) : null
          })}
          {m.sender === 'ai' && m.confidence !== undefined && m.confidence < 0.5 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-500/15 dark:text-rose-400">
              {L({ uk: 'низька впевненість', ru: 'низкая уверенность', en: 'low confidence' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConversationView() {
  const { id } = useParams()
  const { L, lang, toast } = useApp()
  const [reply, setReply] = useState('')
  const [resolve, setResolve] = useState(false)
  const [note, setNote] = useState('')

  const v = convById(id ?? '')
  if (!v) return <EmptyState text={{ uk: 'Діалог не знайдено', ru: 'Диалог не найден', en: 'Conversation not found' }} />
  const c = customerById(v.customerId)

  return (
    <div>
      <Link to="/conversations" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-copper-700 dark:hover:text-copper-300">
        <ArrowLeft size={15} /> {L({ uk: 'Усі діалоги', ru: 'Все диалоги', en: 'All conversations' })}
      </Link>

      <PageHeader
        title={{ uk: `Діалог з ${c?.name ?? ''}`, ru: `Диалог с ${c?.name ?? ''}`, en: `Conversation with ${c?.name ?? ''}` }}
        subtitle={{ uk: `Розпочато ${fmtDate(v.started, lang, true)} · інтент: ${v.intent}`, ru: `Начат ${fmtDate(v.started, lang, true)} · интент: ${v.intent}`, en: `Started ${fmtDate(v.started, lang, true)} · intent: ${v.intent}` }}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast({ uk: 'Демо: експорт CSV готовий', ru: 'Демо: экспорт CSV готов', en: 'Demo: CSV export ready' })}>
              <Download size={14} /> CSV
            </Button>
            <Status s={v.status} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          {v.messages.map((m) => <Bubble key={m.id} m={m} />)}
        </Card>

        <div className="space-y-4">
          {v.status === 'escalated' && (
            <Card>
              <SectionTitle>{L({ uk: 'Відповідь менеджера', ru: 'Ответ менеджера', en: 'Manager reply' })}</SectionTitle>
              <Textarea rows={4} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={L({ uk: 'Відповідь клієнту (надійде в Telegram)…', ru: 'Ответ клиенту (уйдёт в Telegram)…', en: 'Reply to the customer (sent to Telegram)…' })} />
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={resolve} onChange={(e) => setResolve(e.target.checked)} className="rounded border-ink-300 text-copper-600 focus:ring-copper-500/40" />
                {L({ uk: 'Закрити ескалацію', ru: 'Закрыть эскалацию', en: 'Resolve escalation' })}
              </label>
              {resolve && (
                <Textarea rows={2} className="mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder={L({ uk: 'Резолюція (обов’язково)…', ru: 'Резолюция (обязательно)…', en: 'Resolution note (required)…' })} />
              )}
              <Button
                className="mt-3 w-full"
                disabled={!reply.trim() || (resolve && !note.trim())}
                onClick={() => { setReply(''); setNote(''); setResolve(false); toast({ uk: 'Демо: відповідь надіслано', ru: 'Демо: ответ отправлен', en: 'Demo: reply sent' }) }}
              >
                {L({ uk: 'Надіслати', ru: 'Отправить', en: 'Send' })}
              </Button>
            </Card>
          )}
          <Card>
            <SectionTitle>{L({ uk: 'Клієнт', ru: 'Клиент', en: 'Customer' })}</SectionTitle>
            <div className="space-y-1.5 text-sm">
              <div className="font-semibold">{c?.name}</div>
              <div className="text-ink-500">{c?.phone}</div>
              <div className="text-ink-500">{c?.city}</div>
              <Link to={`/customers/${c?.id}`} className="inline-block pt-1 text-xs font-bold text-copper-700 hover:underline dark:text-copper-300">
                {L({ uk: 'Відкрити профіль →', ru: 'Открыть профиль →', en: 'Open profile →' })}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
