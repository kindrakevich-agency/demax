import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Avatar, Input, Select, Chip, LoadMore, EmptyState, Mono } from '../components/ui'
import { customers, managerById } from '../lib/mock'

export default function Customers() {
  const { L, lang } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [ver, setVer] = useState('')

  const rows = useMemo(
    () =>
      customers.filter(
        (c) =>
          (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.username.includes(q.toLowerCase())) &&
          (!role || c.role === role) &&
          (!ver || c.verification === ver),
      ),
    [q, role, ver],
  )

  return (
    <div>
      <PageHeader
        title={{ ru: 'Клиенты', en: 'Customers' }}
        subtitle={{ ru: '768 профилей · операционная CRM — единый источник правды', en: '768 profiles · operational CRM is the single source of truth' }}
      />

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4 dark:border-ink-800">
          <Input placeholder={L({ ru: 'Поиск по имени или @username…', en: 'Search name or @username…' })} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-44">
            <option value="">{L({ ru: 'Роль: все', en: 'Role: all' })}</option>
            <option value="home_care">Home Care</option>
            <option value="professional">Professional</option>
          </Select>
          <Select value={ver} onChange={(e) => setVer(e.target.value)} className="w-48">
            <option value="">{L({ ru: 'Верификация: все', en: 'Verification: all' })}</option>
            <option value="approved">{L({ ru: 'Одобрена', en: 'Approved' })}</option>
            <option value="pending">{L({ ru: 'Ожидает', en: 'Pending' })}</option>
            <option value="rejected">{L({ ru: 'Отклонена', en: 'Rejected' })}</option>
            <option value="none">{L({ ru: 'Нет', en: 'None' })}</option>
          </Select>
          {(q || role || ver) && (
            <Chip onRemove={() => { setQ(''); setRole(''); setVer('') }}>
              {L({ ru: `Найдено: ${rows.length}`, en: `Found: ${rows.length}` })}
            </Chip>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState text={{ ru: 'Ничего не найдено по заданным фильтрам', en: 'Nothing matches the current filters' }} />
        ) : (
          <>
            <Table
              head={[
                { ru: 'Клиент', en: 'Customer' },
                { ru: 'Город', en: 'City' },
                { ru: 'Роль', en: 'Role' },
                { ru: 'Верификация', en: 'Verification' },
                { ru: 'Менеджер', en: 'Manager' },
                { ru: 'Активность', en: 'Last active' },
              ]}
            >
              {rows.map((c) => (
                <Tr key={c.id} onClick={() => nav(`/customers/${c.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <Mono>@{c.username}</Mono>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-ink-600 dark:text-ink-300">{c.city}</Td>
                  <Td>
                    <span className={`text-xs font-bold ${c.role === 'professional' ? 'text-copper-700 dark:text-copper-300' : 'text-ink-500 dark:text-ink-400'}`}>
                      {c.role === 'professional' ? 'PRO' : 'Home Care'}
                    </span>
                  </Td>
                  <Td><Status s={c.verification} /></Td>
                  <Td className="text-ink-600 dark:text-ink-300">{managerById(c.managerId)?.name}</Td>
                  <Td className="text-xs whitespace-nowrap text-ink-400">{fmtDate(c.lastActive, lang, true)}</Td>
                </Tr>
              ))}
            </Table>
            <LoadMore />
          </>
        )}
      </Card>
    </div>
  )
}
