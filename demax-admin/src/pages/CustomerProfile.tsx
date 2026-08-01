import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, Status, Avatar, Button, Tabs, Modal, Input, Textarea, Mono, EmptyState, SectionTitle } from '../components/ui'
import { customerById, managerById, conversations, verifications, seminars, audit } from '../lib/mock'

type Tab = 'overview' | 'conversations' | 'verification' | 'seminars' | 'notes' | 'activity'

export default function CustomerProfile() {
  const { id } = useParams()
  const { L, lang, toast } = useApp()
  const [tab, setTab] = useState<Tab>('overview')
  const [erase, setErase] = useState(false)
  const [eraseText, setEraseText] = useState('')
  const [notes, setNotes] = useState([
    { id: 1, text: L({ ru: 'Постоянный клиент, интересуется профессиональной линейкой.', en: 'Loyal customer, interested in the professional line.' }), author: 'Ольга Коваль', time: '2026-07-20T10:00:00Z' },
  ])
  const [noteDraft, setNoteDraft] = useState('')

  const c = customerById(id ?? '')
  if (!c) return <EmptyState text={{ ru: 'Клиент не найден', en: 'Customer not found' }} />
  const convs = conversations.filter((v) => v.customerId === c.id)
  const vers = verifications.filter((v) => v.customerId === c.id)

  const tabs: { key: Tab; label: Bi; count?: number }[] = [
    { key: 'overview', label: { ru: 'Обзор', en: 'Overview' } },
    { key: 'conversations', label: { ru: 'Диалоги', en: 'Conversations' }, count: convs.length },
    { key: 'verification', label: { ru: 'Верификация', en: 'Verification' }, count: vers.length },
    { key: 'seminars', label: { ru: 'Семинары', en: 'Seminars' } },
    { key: 'notes', label: { ru: 'Заметки', en: 'Notes' }, count: notes.length },
    { key: 'activity', label: { ru: 'Активность', en: 'Activity' } },
  ]

  return (
    <div>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-copper-700 dark:hover:text-copper-300">
        <ArrowLeft size={15} /> {L({ ru: 'Все клиенты', en: 'All customers' })}
      </Link>

      <PageHeader
        title={{ ru: c.name, en: c.name }}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast({ ru: 'Демо: сообщение отправлено в Telegram', en: 'Demo: message sent to Telegram' })}>
              {L({ ru: 'Написать в Telegram', en: 'Message in Telegram' })}
            </Button>
            <Button variant="danger" size="sm" onClick={() => setErase(true)}>
              {L({ ru: 'Стереть (GDPR)', en: 'Erase (GDPR)' })}
            </Button>
          </>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={c.name} size={10} />
              <div>
                <div className="font-display text-xl font-semibold">{c.name}</div>
                <Mono>@{c.username} · {c.id}</Mono>
              </div>
              <div className="ml-auto"><Status s={c.verification} /></div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              {[
                { k: { ru: 'Телефон', en: 'Phone' } as Bi, v: c.phone },
                { k: { ru: 'Город', en: 'City' } as Bi, v: c.city },
                { k: { ru: 'Роль', en: 'Role' } as Bi, v: c.role === 'professional' ? 'Professional' : 'Home Care' },
                { k: { ru: 'Менеджер', en: 'Manager' } as Bi, v: managerById(c.managerId)?.name ?? '—' },
                { k: { ru: 'Согласие на рассылки', en: 'Marketing consent' } as Bi, v: c.consent ? L({ ru: 'Да', en: 'Yes' }) : L({ ru: 'Нет', en: 'No' }) },
                { k: { ru: 'Регистрация', en: 'Registered' } as Bi, v: fmtDate(c.created, lang) },
              ].map((r) => (
                <div key={r.k.en}>
                  <dt className="text-[11px] font-bold tracking-wider text-ink-400 uppercase">{L(r.k)}</dt>
                  <dd className="mt-0.5 font-medium">{r.v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-ink-400">
              {L({ ru: 'Телефон маскируется. Полное раскрытие не предусмотрено в v1.0 (OQ-16).', en: 'Phone is masked. Full reveal is not backed in v1.0 (OQ-16).' })}
            </p>
          </Card>
          <Card>
            <SectionTitle>{L({ ru: 'Хронология', en: 'Timeline' })}</SectionTitle>
            <ol className="relative space-y-4 border-l border-ink-200 pl-4 text-sm dark:border-ink-700">
              {[
                { t: c.created, e: { ru: 'Регистрация через Telegram', en: 'Registered via Telegram' } as Bi },
                ...(vers[0] ? [{ t: vers[0].submitted, e: { ru: 'Подана заявка на верификацию', en: 'Verification submitted' } as Bi }] : []),
                ...(convs[0] ? [{ t: convs[0].started, e: { ru: 'Последний диалог с AI', en: 'Latest AI conversation' } as Bi }] : []),
                { t: c.lastActive, e: { ru: 'Последняя активность', en: 'Last activity' } as Bi },
              ].map((ev, i) => (
                <li key={i}>
                  <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-copper-500" />
                  <div className="font-medium">{L(ev.e)}</div>
                  <div className="text-xs text-ink-400">{fmtDate(ev.t, lang, true)}</div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}

      {tab === 'conversations' && (
        <div className="space-y-3">
          {convs.length === 0 && <EmptyState text={{ ru: 'Диалогов пока нет', en: 'No conversations yet' }} />}
          {convs.map((v) => (
            <Link key={v.id} to={`/conversations/${v.id}`} className="block">
              <Card className="transition-shadow hover:shadow-pop">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{v.messages[0]?.text}</div>
                    <div className="mt-0.5 text-xs text-ink-400">{v.intent} · {fmtDate(v.started, lang, true)}</div>
                  </div>
                  <Status s={v.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'verification' && (
        <div className="space-y-3">
          {vers.length === 0 && <EmptyState text={{ ru: 'Заявок на верификацию нет', en: 'No verification requests' }} />}
          {vers.map((v) => (
            <Card key={v.id}>
              <div className="flex flex-wrap items-center gap-3">
                <ShieldAlert size={18} className="text-copper-600" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{v.docType === 'diploma' ? L({ ru: 'Диплом', en: 'Diploma' }) : L({ ru: 'Сертификат', en: 'Certificate' })}</div>
                  <div className="text-xs text-ink-400">{fmtDate(v.submitted, lang, true)}{v.reason ? ` · ${v.reason}` : ''}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => toast({ ru: 'Демо: открыт подписанный URL (доступ записан в аудит)', en: 'Demo: signed URL opened (access audited)' })}>
                  {L({ ru: 'Документ', en: 'Document' })}
                </Button>
                <Status s={v.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'seminars' && (
        <Card pad={false}>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {seminars.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-ink-400">{fmtDate(s.start, lang)}</div>
                </div>
                <Status s={s.status === 'closed' ? 'attended' : 'open'} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'notes' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2" pad={false}>
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {notes.map((n) => (
                <div key={n.id} className="px-5 py-4">
                  <p className="text-sm">{n.text}</p>
                  <div className="mt-1.5 text-xs text-ink-400">{n.author} · {fmtDate(n.time, lang, true)}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle>{L({ ru: 'Добавить заметку', en: 'Add note' })}</SectionTitle>
            <Textarea rows={4} maxLength={5000} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder={L({ ru: 'Внутренняя заметка (не видна клиенту)…', en: 'Internal note (never visible to the customer)…' })} />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-ink-400">{noteDraft.length}/5000</span>
              <Button
                size="sm"
                disabled={!noteDraft.trim()}
                onClick={() => {
                  setNotes((ns) => [{ id: Date.now(), text: noteDraft.trim(), author: 'Ольга Коваль', time: new Date().toISOString() }, ...ns])
                  setNoteDraft('')
                  toast({ ru: 'Заметка добавлена', en: 'Note added' })
                }}
              >
                {L({ ru: 'Сохранить', en: 'Save' })}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'activity' && (
        <Card pad={false}>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {audit.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="font-mono text-xs text-copper-700 dark:text-copper-300">{a.action}</span>
                <span className="flex-1 text-ink-500">{a.actor}</span>
                <span className="text-xs text-ink-400">{fmtDate(a.time, lang, true)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* GDPR erase modal — typed confirmation */}
      <Modal open={erase} onClose={() => setErase(false)} title={{ ru: 'Стереть данные клиента', en: 'Erase customer data' }}>
        <p className="mb-4 text-sm text-ink-600 dark:text-ink-300">
          {L({
            ru: 'GDPR-каскад: разговоры, регистрации, заявки и заметки будут удалены или анонимизированы. Действие необратимо. Введите ERASE для подтверждения.',
            en: 'GDPR cascade: conversations, registrations, requests and notes will be removed or anonymised. This cannot be undone. Type ERASE to confirm.',
          })}
        </p>
        <Input value={eraseText} onChange={(e) => setEraseText(e.target.value)} placeholder="ERASE" />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setErase(false)}>{L({ ru: 'Отмена', en: 'Cancel' })}</Button>
          <Button
            variant="danger"
            disabled={eraseText !== 'ERASE'}
            onClick={() => { setErase(false); setEraseText(''); toast({ ru: 'Демо: клиент помечен на стирание', en: 'Demo: customer queued for erasure' }) }}
          >
            {L({ ru: 'Стереть навсегда', en: 'Erase permanently' })}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
