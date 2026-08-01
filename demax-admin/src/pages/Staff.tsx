import { useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Avatar, Button, Modal, Field, Input, Select, Mono } from '../components/ui'
import { managers } from '../lib/mock'

const schema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  region: z.string().min(2),
  capacity: z.string().regex(/^\d+$/),
  isAdmin: z.string(),
})
type FormData = z.infer<typeof schema>

export default function Staff() {
  const { L, lang, toast } = useApp()
  const [create, setCreate] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { capacity: '200', isAdmin: 'false' } })

  return (
    <div>
      <PageHeader
        title={{ ru: 'Персонал и роли', en: 'Staff & roles' }}
        subtitle={{ ru: 'Менеджеры и администраторы. Вход: email + пароль + MFA (обязательно).', en: 'Managers and administrators. Sign-in: email + password + mandatory MFA.' }}
        actions={
          <Button size="sm" onClick={() => setCreate(true)}>
            <Plus size={15} /> {L({ ru: 'Добавить менеджера', en: 'Add manager' })}
          </Button>
        }
      />

      <Card pad={false}>
        <Table
          head={[
            { ru: 'Сотрудник', en: 'Staff member' },
            { ru: 'Роль', en: 'Role' },
            { ru: 'Регион', en: 'Region' },
            { ru: 'Портфель', en: 'Portfolio' },
            { ru: 'Последний вход', en: 'Last login' },
            { ru: 'Статус', en: 'Status' },
            { ru: '', en: '' },
          ]}
        >
          {managers.map((m) => (
            <Tr key={m.id}>
              <Td>
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.name} />
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <Mono>{m.email}</Mono>
                  </div>
                </div>
              </Td>
              <Td>
                {m.isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-copper-700 dark:text-copper-300">
                    <ShieldCheck size={13} /> {L({ ru: 'Администратор', en: 'Administrator' })}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-ink-500">{L({ ru: 'Менеджер', en: 'Manager' })}</span>
                )}
              </Td>
              <Td className="text-ink-600 dark:text-ink-300">{m.region}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <div className={`h-full rounded-full ${m.assigned / m.capacity > 0.8 ? 'bg-copper-500' : 'bg-sage-500'}`} style={{ width: `${Math.min(100, (m.assigned / m.capacity) * 100)}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-ink-500">{m.assigned}/{m.capacity}</span>
                </div>
              </Td>
              <Td className="text-xs whitespace-nowrap text-ink-400">{fmtDate(m.lastLogin, lang, true)}</Td>
              <Td><Status s={m.active ? 'active' : 'none'} /></Td>
              <Td>
                {m.active && !m.isAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => toast({ ru: 'Демо: менеджер деактивирован, клиенты будут перераспределены', en: 'Demo: manager deactivated, customers will be reassigned' })}>
                    {L({ ru: 'Деактивировать', en: 'Deactivate' })}
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>

      <p className="mt-4 text-xs text-ink-400">
        {L({ ru: 'Последнего активного администратора нельзя понизить или удалить. Деактивация менеджера запускает перераспределение его портфеля.', en: 'The last active administrator cannot be demoted or removed. Deactivating a manager triggers portfolio reassignment.' })}
      </p>

      <Modal open={create} onClose={() => setCreate(false)} title={{ ru: 'Новый сотрудник', en: 'New staff member' }}>
        <form
          onSubmit={handleSubmit(() => { setCreate(false); reset(); toast({ ru: 'Приглашение отправлено. MFA настраивается при первом входе.', en: 'Invite sent. MFA is enrolled on first sign-in.' }) })}
          className="space-y-4"
        >
          <Field label={{ ru: 'Имя', en: 'Name' }} error={errors.name && L({ ru: 'Введите имя', en: 'Enter a name' })}>
            <Input {...register('name')} />
          </Field>
          <Field label={{ ru: 'Email', en: 'Email' }} error={errors.email && L({ ru: 'Неверный email', en: 'Invalid email' })}>
            <Input type="email" {...register('email')} placeholder="name@demax.example" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={{ ru: 'Регион', en: 'Region' }} error={errors.region && L({ ru: 'Укажите регион', en: 'Enter a region' })}>
              <Input {...register('region')} />
            </Field>
            <Field label={{ ru: 'Лимит клиентов', en: 'Capacity' }} error={errors.capacity && L({ ru: '0 или больше', en: '0 or more' })}>
              <Input type="number" {...register('capacity')} />
            </Field>
          </div>
          <Field label={{ ru: 'Роль', en: 'Role' }}>
            <Select {...register('isAdmin')}>
              <option value="false">{L({ ru: 'Менеджер', en: 'Manager' })}</option>
              <option value="true">{L({ ru: 'Администратор', en: 'Administrator' })}</option>
            </Select>
          </Field>
          <p className="text-xs text-ink-400">
            {L({ ru: 'Пароль не задаётся здесь: сотрудник получит ссылку-приглашение.', en: 'No password is set here: the member receives an invite link.' })}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreate(false)}>{L({ ru: 'Отмена', en: 'Cancel' })}</Button>
            <Button type="submit">{L({ ru: 'Пригласить', en: 'Invite' })}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
