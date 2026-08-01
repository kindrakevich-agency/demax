import { useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Avatar, Button, Modal, Field, Input, Select, Mono, applySort } from '../components/ui'
import type { SortState } from '../components/ui'
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
  const [sort, setSort] = useState<SortState>(null)
  const sorted = applySort(managers, sort, (m, k) =>
    k === 'name' ? m.name : k === 'region' ? m.region : k === 'assigned' ? m.assigned
    : k === 'lastLogin' ? Date.parse(m.lastLogin) : null,
  )
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { capacity: '200', isAdmin: 'false' } })

  return (
    <div>
      <PageHeader
        title={{ uk: 'Персонал і ролі', ru: 'Персонал и роли', en: 'Staff & roles' }}
        subtitle={{ uk: 'Менеджери та адміністратори. Вхід: email + пароль + MFA (обов’язково).', ru: 'Менеджеры и администраторы. Вход: email + пароль + MFA (обязательно).', en: 'Managers and administrators. Sign-in: email + password + mandatory MFA.' }}
        actions={
          <Button size="sm" onClick={() => setCreate(true)}>
            <Plus size={15} /> {L({ uk: 'Додати менеджера', ru: 'Добавить менеджера', en: 'Add manager' })}
          </Button>
        }
      />

      <Card pad={false}>
        <Table
          sort={sort}
          onSort={setSort}
          head={[
            { uk: 'Співробітник', ru: 'Сотрудник', en: 'Staff member', sortKey: 'name' },
            { uk: 'Роль', ru: 'Роль', en: 'Role' },
            { uk: 'Регіон', ru: 'Регион', en: 'Region', sortKey: 'region' },
            { uk: 'Портфель', ru: 'Портфель', en: 'Portfolio', sortKey: 'assigned' },
            { uk: 'Останній вхід', ru: 'Последний вход', en: 'Last login', sortKey: 'lastLogin' },
            { uk: 'Статус', ru: 'Статус', en: 'Status' },
            { uk: '', ru: '', en: '' },
          ]}
        >
          {sorted.map((m) => (
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
                    <ShieldCheck size={13} /> {L({ uk: 'Адміністратор', ru: 'Администратор', en: 'Administrator' })}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-ink-500">{L({ uk: 'Менеджер', ru: 'Менеджер', en: 'Manager' })}</span>
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
                  <Button size="sm" variant="ghost" onClick={() => toast({ uk: 'Демо: менеджера деактивовано, клієнтів буде перерозподілено', ru: 'Демо: менеджер деактивирован, клиенты будут перераспределены', en: 'Demo: manager deactivated, customers will be reassigned' })}>
                    {L({ uk: 'Деактивувати', ru: 'Деактивировать', en: 'Deactivate' })}
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>

      <p className="mt-4 text-xs text-ink-400">
        {L({ uk: 'Останнього активного адміністратора не можна понизити або видалити. Деактивація менеджера запускає перерозподіл його портфеля.', ru: 'Последнего активного администратора нельзя понизить или удалить. Деактивация менеджера запускает перераспределение его портфеля.', en: 'The last active administrator cannot be demoted or removed. Deactivating a manager triggers portfolio reassignment.' })}
      </p>

      <Modal open={create} onClose={() => setCreate(false)} title={{ uk: 'Новий співробітник', ru: 'Новый сотрудник', en: 'New staff member' }}>
        <form
          onSubmit={handleSubmit(() => { setCreate(false); reset(); toast({ uk: 'Запрошення надіслано. MFA налаштовується під час першого входу.', ru: 'Приглашение отправлено. MFA настраивается при первом входе.', en: 'Invite sent. MFA is enrolled on first sign-in.' }) })}
          className="space-y-4"
        >
          <Field label={{ uk: 'Ім’я', ru: 'Имя', en: 'Name' }} error={errors.name && L({ uk: 'Введіть ім’я', ru: 'Введите имя', en: 'Enter a name' })}>
            <Input {...register('name')} />
          </Field>
          <Field label={{ uk: 'Email', ru: 'Email', en: 'Email' }} error={errors.email && L({ uk: 'Некоректний email', ru: 'Неверный email', en: 'Invalid email' })}>
            <Input type="email" {...register('email')} placeholder="name@demax.example" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={{ uk: 'Регіон', ru: 'Регион', en: 'Region' }} error={errors.region && L({ uk: 'Вкажіть регіон', ru: 'Укажите регион', en: 'Enter a region' })}>
              <Input {...register('region')} />
            </Field>
            <Field label={{ uk: 'Ліміт клієнтів', ru: 'Лимит клиентов', en: 'Capacity' }} error={errors.capacity && L({ uk: '0 або більше', ru: '0 или больше', en: '0 or more' })}>
              <Input type="number" {...register('capacity')} />
            </Field>
          </div>
          <Field label={{ uk: 'Роль', ru: 'Роль', en: 'Role' }}>
            <Select {...register('isAdmin')}>
              <option value="false">{L({ uk: 'Менеджер', ru: 'Менеджер', en: 'Manager' })}</option>
              <option value="true">{L({ uk: 'Адміністратор', ru: 'Администратор', en: 'Administrator' })}</option>
            </Select>
          </Field>
          <p className="text-xs text-ink-400">
            {L({ uk: 'Пароль тут не задається: співробітник отримає посилання-запрошення.', ru: 'Пароль не задаётся здесь: сотрудник получит ссылку-приглашение.', en: 'No password is set here: the member receives an invite link.' })}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreate(false)}>{L({ uk: 'Скасувати', ru: 'Отмена', en: 'Cancel' })}</Button>
            <Button type="submit">{L({ uk: 'Запросити', ru: 'Пригласить', en: 'Invite' })}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
