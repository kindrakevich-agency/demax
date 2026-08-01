import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Avatar, Tabs, Confidence, EmptyState, Button } from '../components/ui'
import { escalations, customerById, managerById } from '../lib/mock'

type Tab = 'open' | 'assigned' | 'resolved' | 'dismissed'

const reasonLabel: Record<string, Bi> = {
  low_confidence: { uk: 'Низька впевненість', ru: 'Низкая уверенность', en: 'Low confidence' },
  manager_request: { uk: 'Запит менеджера', ru: 'Запрос менеджера', en: 'Manager requested' },
  complaint: { uk: 'Скарга', ru: 'Жалоба', en: 'Complaint' },
  commercial: { uk: 'Комерційне питання', ru: 'Коммерческий вопрос', en: 'Commercial' },
}

function age(iso: string) {
  const h = Math.max(1, Math.round((Date.parse('2026-08-01T09:00:00Z') - Date.parse(iso)) / 36e5))
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`
}

export default function Escalations() {
  const { L, toast } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('open')

  const by = (s: Tab) => escalations.filter((e) => e.status === s)
  const rows = by(tab)

  return (
    <div>
      <PageHeader
        title={{ uk: 'Ескалації', ru: 'Эскалации', en: 'Escalations' }}
        subtitle={{ uk: 'Черга питань, переданих AI живим менеджерам', ru: 'Очередь вопросов, переданных AI живым менеджерам', en: 'Queue of questions the AI handed to human managers' }}
      />

      <Tabs
        tabs={[
          { key: 'open', label: { uk: 'Відкриті', ru: 'Открытые', en: 'Open' }, count: by('open').length },
          { key: 'assigned', label: { uk: 'Призначені', ru: 'Назначенные', en: 'Assigned' }, count: by('assigned').length },
          { key: 'resolved', label: { uk: 'Вирішені', ru: 'Решённые', en: 'Resolved' }, count: by('resolved').length },
          { key: 'dismissed', label: { uk: 'Зняті', ru: 'Снятые', en: 'Dismissed' }, count: by('dismissed').length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <Card pad={false}>
        {rows.length === 0 ? (
          <EmptyState text={{ uk: 'У цій черзі порожньо', ru: 'В этой очереди пусто', en: 'This queue is empty' }} />
        ) : (
          <Table
            head={[
              { uk: 'ID', ru: 'ID', en: 'ID' },
              { uk: 'Клієнт', ru: 'Клиент', en: 'Customer' },
              { uk: 'Причина', ru: 'Причина', en: 'Reason' },
              { uk: 'Впевн.', ru: 'Увер.', en: 'Conf.' },
              { uk: 'Менеджер', ru: 'Менеджер', en: 'Manager' },
              { uk: 'Вік', ru: 'Возраст', en: 'Age' },
              { uk: '', ru: '', en: '' },
            ]}
          >
            {rows.map((e) => {
              const c = customerById(e.customerId)
              return (
                <Tr key={e.id} onClick={() => nav(`/conversations/${e.conversationId}`)}>
                  <Td><span className="font-mono text-xs font-semibold text-copper-700 dark:text-copper-300">{e.id}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c?.name ?? '?'} />
                      <span className="font-semibold whitespace-nowrap">{c?.name}</span>
                    </div>
                  </Td>
                  <Td className="text-ink-600 dark:text-ink-300">{L(reasonLabel[e.reason])}</Td>
                  <Td><Confidence v={e.confidence} /></Td>
                  <Td className="text-ink-600 dark:text-ink-300">{managerById(e.managerId)?.name ?? '—'}</Td>
                  <Td><span className={`font-mono text-xs font-bold ${age(e.created).endsWith('d') ? 'text-rose-700 dark:text-rose-400' : 'text-ink-500'}`}>{age(e.created)}</span></Td>
                  <Td>
                    {tab === 'open' ? (
                      <Button size="sm" variant="secondary" onClick={(ev) => { ev.stopPropagation(); toast({ uk: 'Демо: ескалацію призначено вам', ru: 'Демо: эскалация назначена вам', en: 'Demo: escalation assigned to you' }) }}>
                        {L({ uk: 'Взяти', ru: 'Взять', en: 'Take' })}
                      </Button>
                    ) : <Status s={e.status} />}
                  </Td>
                </Tr>
              )
            })}
          </Table>
        )}
      </Card>

      <p className="mt-4 text-xs text-ink-400">
        {L({
          uk: 'Сортування: найстаріші зверху. SLA-пріоритизація з’явиться після вирішення OQ-17.',
          ru: 'Сортировка: старейшие сверху. SLA-приоритизация появится после решения OQ-17.',
          en: 'Sorted oldest-first. SLA prioritisation arrives once OQ-17 is decided.',
        })}
      </p>
    </div>
  )
}
