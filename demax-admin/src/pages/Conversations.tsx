import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Avatar, Select, LoadMore, Confidence } from '../components/ui'
import { conversations, customerById } from '../lib/mock'

export default function Conversations() {
  const { L, lang } = useApp()
  const nav = useNavigate()
  const [status, setStatus] = useState('')

  const rows = conversations.filter((c) => !status || c.status === status)

  return (
    <div>
      <PageHeader
        title={{ uk: 'Діалоги', ru: 'Диалоги', en: 'Conversations' }}
        subtitle={{ uk: 'Історія спілкування клієнтів з AI-асистентом', ru: 'История общения клиентов с AI-ассистентом', en: 'Customer conversations with the AI assistant' }}
      />
      <Card pad={false}>
        <div className="flex items-center gap-3 border-b border-ink-100 p-4 dark:border-ink-800">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-52">
            <option value="">{L({ uk: 'Статус: усі', ru: 'Статус: все', en: 'Status: all' })}</option>
            <option value="active">{L({ uk: 'Активні', ru: 'Активные', en: 'Active' })}</option>
            <option value="escalated">{L({ uk: 'Ескальовані', ru: 'Эскалированные', en: 'Escalated' })}</option>
            <option value="closed">{L({ uk: 'Закриті', ru: 'Закрытые', en: 'Closed' })}</option>
          </Select>
        </div>
        <Table
          head={[
            { uk: 'Клієнт', ru: 'Клиент', en: 'Customer' },
            { uk: 'Перше повідомлення', ru: 'Первое сообщение', en: 'First message' },
            { uk: 'Інтент', ru: 'Интент', en: 'Intent' },
            { uk: 'Впев.', ru: 'Увер.', en: 'Conf.' },
            { uk: 'Статус', ru: 'Статус', en: 'Status' },
            { uk: 'Розпочато', ru: 'Начат', en: 'Started' },
          ]}
        >
          {rows.map((v) => {
            const c = customerById(v.customerId)
            const aiMsg = v.messages.find((m) => m.sender === 'ai')
            return (
              <Tr key={v.id} onClick={() => nav(`/conversations/${v.id}`)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c?.name ?? '?'} />
                    <span className="font-semibold whitespace-nowrap">{c?.name}</span>
                  </div>
                </Td>
                <Td className="max-w-72"><span className="line-clamp-1 text-ink-600 dark:text-ink-300">{v.messages[0]?.text}</span></Td>
                <Td><span className="font-mono text-xs text-ink-500">{v.intent}</span></Td>
                <Td>{aiMsg?.confidence !== undefined ? <Confidence v={aiMsg.confidence} /> : '—'}</Td>
                <Td><Status s={v.status} /></Td>
                <Td className="text-xs whitespace-nowrap text-ink-400">{fmtDate(v.started, lang, true)}</Td>
              </Tr>
            )
          })}
        </Table>
        <LoadMore />
      </Card>
    </div>
  )
}
