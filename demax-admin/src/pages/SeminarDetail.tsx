import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, Status, Button, Tabs, Table, Tr, Td, Avatar, EmptyState, Stat } from '../components/ui'
import { seminars, customers } from '../lib/mock'

type Tab = 'registrations' | 'attendance' | 'stats'

const regs = customers.slice(0, 6).map((c, i) => ({
  id: `r${i}`,
  customer: c,
  registered: `2026-07-${10 + i}T10:0${i}:00Z`,
  status: (['registered', 'registered', 'attended', 'registered', 'no_show', 'registered'] as const)[i],
}))

export default function SeminarDetail() {
  const { id } = useParams()
  const { L, lang, toast } = useApp()
  const s = seminars.find((x) => x.id === id)
  const [tab, setTab] = useState<Tab>('registrations')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!s) return <EmptyState text={{ ru: 'Семинар не найден', en: 'Seminar not found' }} />

  const tabs: { key: Tab; label: Bi; count?: number }[] = [
    { key: 'registrations', label: { ru: 'Регистрации', en: 'Registrations' }, count: regs.length },
    { key: 'attendance', label: { ru: 'Посещаемость', en: 'Attendance' } },
    { key: 'stats', label: { ru: 'Статистика', en: 'Stats' } },
  ]

  const toggle = (id: string) =>
    setSelected((sel) => {
      const n = new Set(sel)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })

  const bulk = (status: 'attended' | 'no_show') => {
    toast(status === 'attended'
      ? { ru: `Отмечено «посетил»: ${selected.size}`, en: `Marked attended: ${selected.size}` }
      : { ru: `Отмечено «не пришёл»: ${selected.size}`, en: `Marked no-show: ${selected.size}` })
    setSelected(new Set())
  }

  return (
    <div>
      <Link to="/seminars" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-copper-700 dark:hover:text-copper-300">
        <ArrowLeft size={15} /> {L({ ru: 'Все семинары', en: 'All seminars' })}
      </Link>

      <PageHeader
        title={{ ru: s.title, en: s.title }}
        subtitle={{ ru: `${fmtDate(s.start, lang, true)} · ${s.location}`, en: `${fmtDate(s.start, lang, true)} · ${s.location}` }}
        actions={
          <>
            <Status s={s.status} />
            {s.status === 'open' && (
              <Button variant="secondary" size="sm" onClick={() => toast({ ru: 'Демо: регистрация закрыта', en: 'Demo: registration closed' })}>
                {L({ ru: 'Закрыть регистрацию', en: 'Close registration' })}
              </Button>
            )}
          </>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'registrations' && (
        <Card pad={false}>
          <Table head={[{ ru: 'Участник', en: 'Participant' }, { ru: 'Город', en: 'City' }, { ru: 'Дата регистрации', en: 'Registered' }, { ru: 'Статус', en: 'Status' }]}>
            {regs.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.customer.name} />
                    <span className="font-semibold">{r.customer.name}</span>
                  </div>
                </Td>
                <Td className="text-ink-600 dark:text-ink-300">{r.customer.city}</Td>
                <Td className="text-xs whitespace-nowrap text-ink-400">{fmtDate(r.registered, lang, true)}</Td>
                <Td><Status s={r.status === 'registered' ? 'open' : r.status} /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'attendance' && (
        <Card pad={false}>
          {selected.size > 0 && (
            <div className="flex items-center gap-3 border-b border-copper-500/30 bg-copper-500/8 px-4 py-2.5">
              <span className="text-sm font-bold text-copper-700 dark:text-copper-300">{selected.size} {L({ ru: 'выбрано', en: 'selected' })}</span>
              <Button size="sm" onClick={() => bulk('attended')}>{L({ ru: 'Посетил', en: 'Attended' })}</Button>
              <Button size="sm" variant="secondary" onClick={() => bulk('no_show')}>{L({ ru: 'Не пришёл', en: 'No-show' })}</Button>
            </div>
          )}
          <Table head={[{ ru: '', en: '' }, { ru: 'Участник', en: 'Participant' }, { ru: 'Статус', en: 'Status' }]}>
            {regs.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded border-ink-300 text-copper-600 focus:ring-copper-500/40" />
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.customer.name} />
                    <span className="font-semibold">{r.customer.name}</span>
                  </div>
                </Td>
                <Td><Status s={r.status === 'registered' ? 'pending' : r.status} /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label={{ ru: 'Регистраций', en: 'Registrations' }} value={String(s.taken)} accent />
          <Stat label={{ ru: 'Заполненность', en: 'Fill rate' }} value={s.capacity === null ? '∞' : `${Math.round((s.taken / s.capacity) * 100)}%`} />
          <Stat label={{ ru: 'Посетили', en: 'Attended' }} value={String(s.attended || '—')} />
          <Stat label={{ ru: 'Доходимость', en: 'Show rate' }} value={s.attended ? `${Math.round((s.attended / s.taken) * 100)}%` : '—'} />
        </div>
      )}
    </div>
  )
}
