import { useState } from 'react'
import { FileText, Check, X } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Avatar, Tabs, Modal, Button, Textarea, EmptyState } from '../components/ui'
import { verifications, customerById, managerById } from '../lib/mock'
import type { Verification } from '../lib/mock'

type Tab = 'pending' | 'approved' | 'rejected'

export default function Verifications() {
  const { L, lang, toast } = useApp()
  const [tab, setTab] = useState<Tab>('pending')
  const [items, setItems] = useState(verifications)
  const [review, setReview] = useState<Verification | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  const by = (s: Tab) => items.filter((v) => v.status === s)
  const rows = by(tab)

  const decide = (id: string, status: 'approved' | 'rejected', r?: string) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status, reviewedBy: 'm1', reason: r } : x)))
    setReview(null); setRejecting(false); setReason('')
    toast(status === 'approved'
      ? { uk: 'Схвалено. Роль клієнта підвищено до Professional', ru: 'Одобрено. Роль клиента повышена до Professional', en: 'Approved. Customer elevated to Professional' }
      : { uk: 'Відхилено. Клієнта повідомлено про причину', ru: 'Отклонено. Клиент уведомлён с причиной', en: 'Rejected. Customer notified with the reason' })
  }

  return (
    <div>
      <PageHeader
        title={{ uk: 'Верифікація спеціалістів', ru: 'Верификация специалистов', en: 'Professional verification' }}
        subtitle={{ uk: 'Перевірка дипломів косметологів. Схвалення відкриває професійний каталог.', ru: 'Проверка дипломов косметологов. Одобрение открывает профессиональный каталог.', en: 'Diploma review for cosmetologists. Approval unlocks the professional catalog.' }}
      />

      <Tabs
        tabs={[
          { key: 'pending', label: { uk: 'Черга', ru: 'Очередь', en: 'Queue' }, count: by('pending').length },
          { key: 'approved', label: { uk: 'Схвалені', ru: 'Одобренные', en: 'Approved' }, count: by('approved').length },
          { key: 'rejected', label: { uk: 'Відхилені', ru: 'Отклонённые', en: 'Rejected' }, count: by('rejected').length },
        ]}
        value={tab}
        onChange={setTab}
      />

      <Card pad={false}>
        {rows.length === 0 ? (
          <EmptyState text={{ uk: 'Черга порожня — чудова робота', ru: 'Очередь пуста — отличная работа', en: 'Queue is empty — great job' }} />
        ) : (
          <Table
            head={[
              { uk: 'Клієнт', ru: 'Клиент', en: 'Customer' },
              { uk: 'Документ', ru: 'Документ', en: 'Document' },
              { uk: 'Подано', ru: 'Подано', en: 'Submitted' },
              { uk: 'Перевірив', ru: 'Проверил', en: 'Reviewed by' },
              { uk: 'Статус', ru: 'Статус', en: 'Status' },
              { uk: '', ru: '', en: '' },
            ]}
          >
            {rows.map((v) => {
              const c = customerById(v.customerId)
              return (
                <Tr key={v.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c?.name ?? '?'} />
                      <div>
                        <div className="font-semibold">{c?.name}</div>
                        <div className="text-xs text-ink-400">{c?.city}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                      <FileText size={14} className="text-copper-600" />
                      {v.docType === 'diploma' ? L({ uk: 'Диплом', ru: 'Диплом', en: 'Diploma' }) : L({ uk: 'Сертифікат', ru: 'Сертификат', en: 'Certificate' })}
                    </span>
                  </Td>
                  <Td className="text-xs whitespace-nowrap text-ink-400">{fmtDate(v.submitted, lang, true)}</Td>
                  <Td className="text-ink-600 dark:text-ink-300">{managerById(v.reviewedBy)?.name ?? '—'}</Td>
                  <Td><Status s={v.status} /></Td>
                  <Td>
                    {v.status === 'pending' && (
                      <Button size="sm" onClick={() => setReview(v)}>{L({ uk: 'Перевірити', ru: 'Проверить', en: 'Review' })}</Button>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Table>
        )}
      </Card>

      <Modal open={!!review} onClose={() => { setReview(null); setRejecting(false) }} title={{ uk: 'Перевірка документа', ru: 'Проверка документа', en: 'Document review' }} wide>
        {review && (
          <div>
            <div className="mb-4 rounded-xl border border-dashed border-ink-300 bg-ivory-100 p-10 text-center dark:border-ink-600 dark:bg-ink-800">
              <FileText size={40} className="mx-auto mb-3 text-copper-600" strokeWidth={1.2} />
              <div className="font-mono text-xs text-ink-500">verif/{review.customerId}/diploma.pdf · 2.4 MB</div>
              <div className="mt-1 text-xs text-ink-400">
                {L({ uk: 'Перегляд за підписаним URL (діє 5 хвилин). Доступ записано в аудит.', ru: 'Просмотр по подписанному URL (истекает через 5 минут). Доступ записан в аудит.', en: 'Viewed via signed URL (expires in 5 min). Access is audited.' })}
              </div>
            </div>
            <div className="mb-4 text-sm">
              <span className="font-semibold">{customerById(review.customerId)?.name}</span>
              <span className="text-ink-400"> · {fmtDate(review.submitted, lang, true)}</span>
            </div>
            {rejecting ? (
              <>
                <Textarea rows={2} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder={L({ uk: 'Причина відмови (обов’язково, надійде клієнту)…', ru: 'Причина отказа (обязательно, уйдёт клиенту)…', en: 'Rejection reason (required, sent to the customer)…' })} />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setRejecting(false)}>{L({ uk: 'Назад', ru: 'Назад', en: 'Back' })}</Button>
                  <Button variant="danger" disabled={!reason.trim()} onClick={() => decide(review.id, 'rejected', reason.trim())}>
                    <X size={15} /> {L({ uk: 'Відхилити', ru: 'Отклонить', en: 'Reject' })}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setRejecting(true)}>
                  <X size={15} /> {L({ uk: 'Відхилити…', ru: 'Отклонить…', en: 'Reject…' })}
                </Button>
                <Button onClick={() => decide(review.id, 'approved')}>
                  <Check size={15} /> {L({ uk: 'Схвалити та підвищити роль', ru: 'Одобрить и повысить роль', en: 'Approve & elevate role' })}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
