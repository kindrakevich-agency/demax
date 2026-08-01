import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Select, Input, Button, LoadMore, EmptyState, Mono } from '../components/ui'
import { audit } from '../lib/mock'

export default function AuditLog() {
  const { L, lang, toast } = useApp()
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')

  const actions = [...new Set(audit.map((a) => a.action))]
  const entities = [...new Set(audit.map((a) => a.entity))]

  const rows = useMemo(
    () => audit.filter((a) => (!actor || a.actorType === actor) && (!action || a.action === action) && (!entity || a.entity === entity)),
    [actor, action, entity],
  )

  return (
    <div>
      <PageHeader
        title={{ uk: 'Журнал аудиту', ru: 'Журнал аудита', en: 'Audit log' }}
        subtitle={{ uk: 'Незмінний журнал: лише додавання; зміна та видалення записів заборонені на рівні БД.', ru: 'Неизменяемый журнал: только добавление, изменение и удаление записей запрещены на уровне БД.', en: 'Immutable log: append-only; updates and deletes are revoked at the database level.' }}
        actions={
          <Button variant="secondary" size="sm" onClick={() => toast({ uk: 'Демо: JSON вивантажено', ru: 'Демо: JSON выгружен', en: 'Demo: JSON exported' })}>
            <Download size={14} /> JSON
          </Button>
        }
      />

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4 dark:border-ink-800">
          <Select value={actor} onChange={(e) => setActor(e.target.value)} className="w-44">
            <option value="">{L({ uk: 'Актор: усі', ru: 'Актор: все', en: 'Actor: all' })}</option>
            <option value="admin">{L({ uk: 'Адміністратори', ru: 'Администраторы', en: 'Admins' })}</option>
            <option value="manager">{L({ uk: 'Менеджери', ru: 'Менеджеры', en: 'Managers' })}</option>
            <option value="system">{L({ uk: 'Система', ru: 'Система', en: 'System' })}</option>
          </Select>
          <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-56">
            <option value="">{L({ uk: 'Дія: усі', ru: 'Действие: все', en: 'Action: all' })}</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="w-52">
            <option value="">{L({ uk: 'Сутність: усі', ru: 'Сущность: все', en: 'Entity: all' })}</option>
            {entities.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
          </Select>
          <Input type="date" className="w-40" defaultValue="2026-07-01" />
        </div>

        {rows.length === 0 ? (
          <EmptyState text={{ uk: 'Записів не знайдено', ru: 'Записей не найдено', en: 'No entries found' }} />
        ) : (
          <>
            <Table
              head={[
                { uk: 'ID', ru: 'ID', en: 'ID' },
                { uk: 'Час (UTC)', ru: 'Время (UTC)', en: 'Time (UTC)' },
                { uk: 'Актор', ru: 'Актор', en: 'Actor' },
                { uk: 'Дія', ru: 'Действие', en: 'Action' },
                { uk: 'Сутність', ru: 'Сущность', en: 'Entity' },
              ]}
            >
              {rows.map((a) => (
                <Tr key={a.id}>
                  <Td><Mono>#{a.id}</Mono></Td>
                  <Td className="text-xs whitespace-nowrap text-ink-500">{fmtDate(a.time, lang, true)}</Td>
                  <Td>
                    <div className="font-semibold">{a.actor}</div>
                    <div className="text-[11px] text-ink-400">{a.actorType}</div>
                  </Td>
                  <Td><span className="font-mono text-xs font-semibold text-copper-700 dark:text-copper-300">{a.action}</span></Td>
                  <Td>
                    <Mono>{a.entity} · {a.entityId}</Mono>
                  </Td>
                </Tr>
              ))}
            </Table>
            <LoadMore />
          </>
        )}
      </Card>

      <p className="mt-4 text-xs text-ink-400">
        {L({ uk: 'Поля before/after редагуються за allow-list: паролі, OTP, токени та підписані URL ніколи не записуються.', ru: 'Поля before/after редактируются по allow-list: пароли, OTP, токены и подписанные URL никогда не записываются.', en: 'before/after fields follow a redaction allow-list: passwords, OTPs, tokens and signed URLs are never stored.' })}
      </p>
    </div>
  )
}
