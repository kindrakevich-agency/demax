import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Avatar, Input, Select, Chip, LoadMore, EmptyState, Mono, applySort } from '../components/ui'
import type { SortState } from '../components/ui'
import { customers, managerById } from '../lib/mock'

export default function Customers() {
  const { L, lang } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [ver, setVer] = useState('')
  const [sort, setSort] = useState<SortState>(null)

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

  const sorted = useMemo(
    () =>
      applySort(rows, sort, (c, k) =>
        k === 'name' ? c.name : k === 'city' ? c.city : k === 'role' ? c.role
        : k === 'verification' ? c.verification : k === 'manager' ? managerById(c.managerId)?.name
        : k === 'lastActive' ? Date.parse(c.lastActive) : null,
      ),
    [rows, sort],
  )

  return (
    <div>
      <PageHeader
        title={{ uk: 'Клієнти', ru: 'Клиенты', en: 'Customers' }}
        subtitle={{ uk: '768 профілів · операційна CRM — єдине джерело правди', ru: '768 профилей · операционная CRM — единый источник правды', en: '768 profiles · operational CRM is the single source of truth' }}
      />

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4 dark:border-ink-800">
          <Input placeholder={L({ uk: 'Пошук за іменем або @username…', ru: 'Поиск по имени или @username…', en: 'Search name or @username…' })} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-44">
            <option value="">{L({ uk: 'Роль: усі', ru: 'Роль: все', en: 'Role: all' })}</option>
            <option value="home_care">Home Care</option>
            <option value="professional">Professional</option>
          </Select>
          <Select value={ver} onChange={(e) => setVer(e.target.value)} className="w-48">
            <option value="">{L({ uk: 'Верифікація: усі', ru: 'Верификация: все', en: 'Verification: all' })}</option>
            <option value="approved">{L({ uk: 'Схвалена', ru: 'Одобрена', en: 'Approved' })}</option>
            <option value="pending">{L({ uk: 'Очікує', ru: 'Ожидает', en: 'Pending' })}</option>
            <option value="rejected">{L({ uk: 'Відхилена', ru: 'Отклонена', en: 'Rejected' })}</option>
            <option value="none">{L({ uk: 'Немає', ru: 'Нет', en: 'None' })}</option>
          </Select>
          {(q || role || ver) && (
            <Chip onRemove={() => { setQ(''); setRole(''); setVer('') }}>
              {L({ uk: `Знайдено: ${rows.length}`, ru: `Найдено: ${rows.length}`, en: `Found: ${rows.length}` })}
            </Chip>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState text={{ uk: 'Нічого не знайдено за заданими фільтрами', ru: 'Ничего не найдено по заданным фильтрам', en: 'Nothing matches the current filters' }} />
        ) : (
          <>
            <Table
              sort={sort}
              onSort={setSort}
              head={[
                { uk: 'Клієнт', ru: 'Клиент', en: 'Customer', sortKey: 'name' },
                { uk: 'Місто', ru: 'Город', en: 'City', sortKey: 'city' },
                { uk: 'Роль', ru: 'Роль', en: 'Role', sortKey: 'role' },
                { uk: 'Верифікація', ru: 'Верификация', en: 'Verification', sortKey: 'verification' },
                { uk: 'Менеджер', ru: 'Менеджер', en: 'Manager', sortKey: 'manager' },
                { uk: 'Активність', ru: 'Активность', en: 'Last active', sortKey: 'lastActive' },
              ]}
            >
              {sorted.map((c) => (
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
