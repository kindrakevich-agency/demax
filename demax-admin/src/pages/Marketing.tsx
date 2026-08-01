import { useState } from 'react'
import { Megaphone, Send, Plus } from 'lucide-react'
import { useApp, fmtNum } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Button, Tabs, Modal, Field, Input, Select, Textarea, SectionTitle } from '../components/ui'
import { promotions, notices } from '../lib/mock'

type Tab = 'campaigns' | 'notifications'

export default function Marketing() {
  const { L, lang, toast } = useApp()
  const [tab, setTab] = useState<Tab>('campaigns')
  const [compose, setCompose] = useState(false)
  const [sendModal, setSendModal] = useState<string | null>(null)

  const tabs: { key: Tab; label: Bi }[] = [
    { key: 'campaigns', label: { ru: 'Кампании', en: 'Campaigns' } },
    { key: 'notifications', label: { ru: 'Уведомления', en: 'Notifications' } },
  ]

  const promo = promotions.find((p) => p.id === sendModal)

  return (
    <div>
      <PageHeader
        title={{ ru: 'Рассылки и уведомления', en: 'Campaigns & notifications' }}
        subtitle={{ ru: 'Только клиентам с согласием на маркетинг. Доставка дозируется — защита от бана Telegram.', en: 'Consenting customers only. Delivery is throttled to protect the Telegram bot.' }}
        actions={
          <Button size="sm" onClick={() => setCompose(true)}>
            <Plus size={15} /> {L({ ru: 'Новая кампания', en: 'New campaign' })}
          </Button>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'campaigns' && (
        <Card pad={false}>
          <Table
            head={[
              { ru: 'Кампания', en: 'Campaign' },
              { ru: 'Аудитория', en: 'Audience' },
              { ru: 'Отправлено', en: 'Sent' },
              { ru: 'Доставлено', en: 'Delivered' },
              { ru: 'Ошибки', en: 'Failed' },
              { ru: 'Статус', en: 'Status' },
              { ru: '', en: '' },
            ]}
          >
            {promotions.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-copper-600/12 text-copper-700 dark:text-copper-300"><Megaphone size={15} /></span>
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-xs text-ink-400">{p.start}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="text-xs font-bold text-ink-500 uppercase">{p.audience === 'all' ? L({ ru: 'Все', en: 'All' }) : p.audience === 'professional' ? 'PRO' : 'Home Care'}</span>
                </Td>
                <Td><span className="font-mono text-xs">{p.sent ? fmtNum(p.sent, lang) : '—'}</span></Td>
                <Td><span className="font-mono text-xs text-sage-600 dark:text-sage-400">{p.delivered ? fmtNum(p.delivered, lang) : '—'}</span></Td>
                <Td><span className={`font-mono text-xs ${p.failed ? 'text-rose-700 dark:text-rose-400' : 'text-ink-400'}`}>{p.failed || '—'}</span></Td>
                <Td><Status s={p.status} /></Td>
                <Td>
                  {p.status === 'draft' && (
                    <Button size="sm" onClick={() => setSendModal(p.id)}>
                      <Send size={13} /> {L({ ru: 'Отправить', en: 'Send' })}
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card pad={false}>
          <Table
            head={[
              { ru: 'Тип', en: 'Type' },
              { ru: 'Получатель', en: 'Recipient' },
              { ru: 'Канал', en: 'Channel' },
              { ru: 'Запланировано', en: 'Scheduled' },
              { ru: 'Статус', en: 'Status' },
            ]}
          >
            {notices.map((n) => (
              <Tr key={n.id}>
                <Td><span className="font-mono text-xs text-ink-600 dark:text-ink-300">{n.type}</span></Td>
                <Td className="font-semibold">{n.recipient}</Td>
                <Td><span className="text-xs text-ink-500">{n.channel}</span></Td>
                <Td className="text-xs whitespace-nowrap text-ink-400">{new Date(n.scheduled).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Td>
                <Td><Status s={n.status} /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {/* composer */}
      <Modal open={compose} onClose={() => setCompose(false)} title={{ ru: 'Новая кампания', en: 'New campaign' }} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label={{ ru: 'Заголовок', en: 'Title' }}>
              <Input placeholder={L({ ru: 'Название кампании…', en: 'Campaign title…' })} />
            </Field>
          </div>
          <Field label={{ ru: 'Аудитория', en: 'Audience' }}>
            <Select>
              <option>{L({ ru: 'Все клиенты', en: 'All customers' })}</option>
              <option>Home Care</option>
              <option>Professional</option>
            </Select>
          </Field>
          <Field label={{ ru: 'Дата старта', en: 'Start date' }}>
            <Input type="date" defaultValue="2026-08-15" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={{ ru: 'Текст сообщения', en: 'Message body' }} hint={{ ru: 'Уйдёт в Telegram только клиентам с согласием', en: 'Sent via Telegram to consenting customers only' }}>
              <Textarea rows={4} placeholder={L({ ru: 'Текст рассылки…', en: 'Broadcast text…' })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setCompose(false)}>{L({ ru: 'Отмена', en: 'Cancel' })}</Button>
            <Button onClick={() => { setCompose(false); toast({ ru: 'Кампания сохранена как черновик', en: 'Campaign saved as draft' }) }}>
              {L({ ru: 'Сохранить черновик', en: 'Save draft' })}
            </Button>
          </div>
        </div>
      </Modal>

      {/* send confirm with consent preview */}
      <Modal open={!!sendModal} onClose={() => setSendModal(null)} title={{ ru: 'Отправка кампании', en: 'Send campaign' }}>
        <SectionTitle>{promo?.title}</SectionTitle>
        <div className="mb-4 rounded-xl bg-ivory-100 p-4 text-sm dark:bg-ink-800">
          <div className="flex justify-between py-1">
            <span className="text-ink-500">{L({ ru: 'В аудитории', en: 'Audience size' })}</span>
            <span className="font-mono font-bold">1 214</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink-500">{L({ ru: 'С согласием на маркетинг', en: 'With marketing consent' })}</span>
            <span className="font-mono font-bold text-sage-600 dark:text-sage-400">986</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-ink-500">{L({ ru: 'Скорость доставки', en: 'Delivery rate' })}</span>
            <span className="font-mono">~20 msg/s</span>
          </div>
        </div>
        <p className="mb-4 text-xs text-ink-400">
          {L({ ru: 'Операция идемпотентна: повторная отправка не продублирует сообщения.', en: 'Idempotent operation: re-sending will not duplicate messages.' })}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSendModal(null)}>{L({ ru: 'Отмена', en: 'Cancel' })}</Button>
          <Button onClick={() => { setSendModal(null); toast({ ru: 'Отправка запущена: 986 в очереди', en: 'Broadcast started: 986 queued' }) }}>
            <Send size={14} /> {L({ ru: 'Отправить 986 клиентам', en: 'Send to 986 customers' })}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
