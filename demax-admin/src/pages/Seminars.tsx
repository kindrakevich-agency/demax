import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Video } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Button, Modal, Field, Input, Select, Textarea, LoadMore } from '../components/ui'
import { seminars } from '../lib/mock'

const schema = z.object({
  title: z.string().min(3).max(250),
  type: z.enum(['offline', 'webinar']),
  start: z.string().min(1),
  location: z.string().min(2),
  capacity: z.string().regex(/^\d*$/),
  description: z.string().max(2000).optional(),
})
type FormData = z.infer<typeof schema>

export default function Seminars() {
  const { L, lang, toast } = useApp()
  const nav = useNavigate()
  const [create, setCreate] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'webinar', capacity: '' },
  })

  const onSubmit = () => {
    setCreate(false)
    reset()
    toast({ ru: 'Семинар создан (черновик)', en: 'Seminar created (draft)' })
  }

  return (
    <div>
      <PageHeader
        title={{ ru: 'Семинары и вебинары', en: 'Seminars & webinars' }}
        subtitle={{ ru: 'Жизненный цикл: черновик → открыт → закрыт/отменён', en: 'Lifecycle: draft → open → closed/cancelled' }}
        actions={
          <Button size="sm" onClick={() => setCreate(true)}>
            <Plus size={15} /> {L({ ru: 'Создать', en: 'Create' })}
          </Button>
        }
      />

      <Card pad={false}>
        <Table
          head={[
            { ru: 'Событие', en: 'Event' },
            { ru: 'Дата', en: 'Date' },
            { ru: 'Места', en: 'Seats' },
            { ru: 'Заполнено', en: 'Fill' },
            { ru: 'Статус', en: 'Status' },
          ]}
        >
          {seminars.map((s) => {
            const fill = s.capacity === null ? null : Math.round((s.taken / s.capacity) * 100)
            return (
              <Tr key={s.id} onClick={() => nav(`/seminars/${s.id}`)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className={`flex size-8 items-center justify-center rounded-lg ${s.type === 'offline' ? 'bg-copper-600/12 text-copper-700 dark:text-copper-300' : 'bg-sage-100 text-sage-600 dark:bg-sage-700/25 dark:text-sage-400'}`}>
                      {s.type === 'offline' ? <MapPin size={15} /> : <Video size={15} />}
                    </span>
                    <div>
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-xs text-ink-400">{s.location}</div>
                    </div>
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-ink-600 dark:text-ink-300">{fmtDate(s.start, lang, true)}</Td>
                <Td><span className="font-mono text-xs">{s.capacity === null ? `${s.taken} / ∞` : `${s.taken} / ${s.capacity}`}</span></Td>
                <Td className="w-36">
                  {fill === null ? (
                    <span className="text-xs text-ink-400">{L({ ru: 'без лимита', en: 'unlimited' })}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                        <div className={`h-full rounded-full ${fill >= 90 ? 'bg-copper-500' : 'bg-sage-500'}`} style={{ width: `${fill}%` }} />
                      </div>
                      <span className="font-mono text-[11px] text-ink-500">{fill}%</span>
                    </div>
                  )}
                </Td>
                <Td><Status s={s.status} /></Td>
              </Tr>
            )
          })}
        </Table>
        <LoadMore />
      </Card>

      <Modal open={create} onClose={() => setCreate(false)} title={{ ru: 'Новый семинар', en: 'New seminar' }} wide>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={{ ru: 'Название', en: 'Title' }} error={errors.title && L({ ru: 'От 3 до 250 символов', en: '3–250 characters' })}>
              <Input {...register('title')} placeholder={L({ ru: 'Например: Карбокситерапия — практикум', en: 'e.g. Carboxytherapy hands-on' })} />
            </Field>
          </div>
          <Field label={{ ru: 'Тип', en: 'Type' }}>
            <Select {...register('type')}>
              <option value="webinar">{L({ ru: 'Вебинар', en: 'Webinar' })}</option>
              <option value="offline">{L({ ru: 'Офлайн', en: 'Offline' })}</option>
            </Select>
          </Field>
          <Field label={{ ru: 'Дата и время', en: 'Date & time' }} error={errors.start && L({ ru: 'Обязательное поле', en: 'Required' })}>
            <Input type="datetime-local" {...register('start')} />
          </Field>
          <Field label={{ ru: 'Локация / ссылка', en: 'Location / link' }} error={errors.location && L({ ru: 'Обязательное поле', en: 'Required' })}>
            <Input {...register('location')} placeholder={L({ ru: 'Адрес или URL трансляции', en: 'Address or stream URL' })} />
          </Field>
          <Field label={{ ru: 'Вместимость', en: 'Capacity' }} hint={{ ru: 'Пусто — без лимита', en: 'Empty = unlimited' }} error={errors.capacity && L({ ru: 'Только число', en: 'Numbers only' })}>
            <Input inputMode="numeric" {...register('capacity')} placeholder="∞" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={{ ru: 'Описание', en: 'Description' }}>
              <Textarea rows={3} {...register('description')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setCreate(false)}>{L({ ru: 'Отмена', en: 'Cancel' })}</Button>
            <Button type="submit">{L({ ru: 'Создать черновик', en: 'Create draft' })}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
