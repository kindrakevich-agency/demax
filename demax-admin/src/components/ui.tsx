import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Inbox, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'

/* ---------- Page scaffolding ---------- */

export function PageHeader({ title, subtitle, actions }: { title: Bi; subtitle?: Bi; actions?: ReactNode }) {
  const { L } = useApp()
  return (
    <div className="animate-rise mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 dark:text-ivory-50">{L(title)}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{L(subtitle)}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '', pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <div className={`rounded-2xl border border-ink-200/60 bg-white shadow-card dark:border-ink-700/60 dark:bg-ink-900 ${pad ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-display text-lg font-semibold text-ink-950 dark:text-ivory-50">{children}</h2>
}

/* ---------- Buttons ---------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper-500 disabled:cursor-not-allowed disabled:opacity-50'
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4.5 py-2 text-sm'
  const variants = {
    primary: 'bg-copper-600 text-ivory-50 shadow-sm hover:bg-copper-700 active:scale-[.98]',
    secondary: 'border border-ink-300 bg-transparent text-ink-800 hover:border-copper-500 hover:text-copper-700 dark:border-ink-600 dark:text-ivory-100 dark:hover:border-copper-400 dark:hover:text-copper-300',
    ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ivory-100',
    danger: 'bg-rose-700 text-white hover:bg-rose-800',
  }
  return <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...rest} />
}

/* ---------- Status badges ---------- */

const tone: Record<string, string> = {
  // greens
  approved: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  published: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  delivered: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  resolved: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  active: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  open: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  ready: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  attended: 'bg-sage-100 text-sage-700 dark:bg-sage-700/25 dark:text-sage-400',
  // ambers
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  queued: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  assigned: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  sent: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  escalated: 'bg-copper-300/40 text-copper-800 dark:bg-copper-700/30 dark:text-copper-300',
  // reds
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400',
  failed: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400',
  dismissed: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400',
  no_show: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400',
  // neutrals
  draft: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  closed: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  archived: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  finished: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  none: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
}

const statusLabels: Record<string, Bi> = {
  approved: { uk: 'Схвалено', ru: 'Одобрено', en: 'Approved' },
  published: { uk: 'Опубліковано', ru: 'Опубликовано', en: 'Published' },
  delivered: { uk: 'Доставлено', ru: 'Доставлено', en: 'Delivered' },
  resolved: { uk: 'Вирішено', ru: 'Решено', en: 'Resolved' },
  active: { uk: 'Активно', ru: 'Активно', en: 'Active' },
  open: { uk: 'Відкрито', ru: 'Открыто', en: 'Open' },
  ready: { uk: 'Готово', ru: 'Готово', en: 'Ready' },
  attended: { uk: 'Відвідав', ru: 'Посетил', en: 'Attended' },
  pending: { uk: 'Очікує', ru: 'Ожидает', en: 'Pending' },
  in_review: { uk: 'На перевірці', ru: 'На проверке', en: 'In review' },
  queued: { uk: 'У черзі', ru: 'В очереди', en: 'Queued' },
  assigned: { uk: 'Призначено', ru: 'Назначено', en: 'Assigned' },
  sent: { uk: 'Надіслано', ru: 'Отправлено', en: 'Sent' },
  escalated: { uk: 'Ескалація', ru: 'Эскалация', en: 'Escalated' },
  rejected: { uk: 'Відхилено', ru: 'Отклонено', en: 'Rejected' },
  failed: { uk: 'Помилка', ru: 'Ошибка', en: 'Failed' },
  cancelled: { uk: 'Скасовано', ru: 'Отменено', en: 'Cancelled' },
  dismissed: { uk: 'Знято', ru: 'Снято', en: 'Dismissed' },
  no_show: { uk: 'Не прийшов', ru: 'Не пришёл', en: 'No-show' },
  draft: { uk: 'Чернетка', ru: 'Черновик', en: 'Draft' },
  closed: { uk: 'Закрито', ru: 'Закрыто', en: 'Closed' },
  archived: { uk: 'Архів', ru: 'Архив', en: 'Archived' },
  finished: { uk: 'Завершено', ru: 'Завершено', en: 'Finished' },
  none: { uk: '—', ru: '—', en: '—' },
}

export function Status({ s }: { s: string }) {
  const { L } = useApp()
  const label = statusLabels[s] ? L(statusLabels[s]) : s
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${tone[s] ?? tone.none}`}>
      {label}
    </span>
  )
}

export function Chip({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ivory-50 px-2.5 py-1 text-xs font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="text-ink-400 hover:text-ink-700 dark:hover:text-ivory-100" aria-label="remove">
          <X size={12} />
        </button>
      )}
    </span>
  )
}

/* ---------- KPI stat ---------- */

export function Stat({ label, value, hint, accent }: { label: Bi; value: string; hint?: string; accent?: boolean }) {
  const { L } = useApp()
  return (
    <Card className="animate-rise relative overflow-hidden">
      {accent && <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-copper-500 to-copper-300" />}
      <div className="text-xs font-bold tracking-widest text-ink-400 uppercase dark:text-ink-500">{L(label)}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-ink-950 dark:text-ivory-50">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{hint}</div>}
    </Card>
  )
}

/* ---------- Table kit ---------- */

export type SortState = { key: string; dir: 'asc' | 'desc' } | null

/**
 * Таблиця з сортуванням по кліку на заголовок.
 * Колонка стає сортовною, якщо для неї передано `sortKey` — клік перемикає
 * asc → desc → без сортування.
 */
export function Table({
  head,
  children,
  sort,
  onSort,
}: {
  head: (Bi & { sortKey?: string })[]
  children: ReactNode
  sort?: SortState
  onSort?: (s: SortState) => void
}) {
  const { L } = useApp()

  const toggle = (key: string) => {
    if (!onSort) return
    if (!sort || sort.key !== key) onSort({ key, dir: 'asc' })
    else if (sort.dir === 'asc') onSort({ key, dir: 'desc' })
    else onSort(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-200/70 dark:border-ink-700/70">
            {head.map((h, i) => {
              const key = h.sortKey
              const sortable = !!key && !!onSort
              const active = sortable && sort?.key === key
              return (
                <th
                  key={i}
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className="sticky top-0 px-3 py-2.5 text-left text-[11px] font-bold tracking-widest whitespace-nowrap text-ink-400 uppercase dark:text-ink-500"
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggle(key!)}
                      className={`inline-flex items-center gap-1 rounded transition-colors hover:text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper-500 dark:hover:text-ivory-100 ${active ? 'text-copper-700 dark:text-copper-300' : ''}`}
                    >
                      {L(h)}
                      {active ? (
                        sort!.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    L(h)
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-ink-800">{children}</tbody>
      </table>
    </div>
  )
}

/** Сортує масив за поточним станом заголовка (числа, дати й рядки). */
export function applySort<T>(rows: T[], sort: SortState, get: (row: T, key: string) => unknown): T[] {
  if (!sort) return rows
  const dir = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = get(a, sort.key)
    const vb = get(b, sort.key)
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb), 'uk') * dir
  })
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-ivory-100/80 dark:hover:bg-ink-800/60' : ''}`}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${className}`}>{children}</td>
}

export function LoadMore({ onClick }: { onClick?: () => void }) {
  const { L, toast } = useApp()
  return (
    <div className="flex justify-center border-t border-ink-100 py-3 dark:border-ink-800">
      <Button variant="ghost" size="sm" onClick={onClick ?? (() => toast({ uk: 'Демо: всі дані завантажено', ru: 'Демо: все данные загружены', en: 'Demo: all data loaded' }))}>
        {L({ uk: 'Завантажити ще', ru: 'Загрузить ещё', en: 'Load more' })}
      </Button>
    </div>
  )
}

export function EmptyState({ text }: { text: Bi }) {
  const { L } = useApp()
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-ink-400">
      <Inbox size={28} strokeWidth={1.5} />
      <div className="text-sm">{L(text)}</div>
    </div>
  )
}

/* ---------- Form controls ---------- */

export function Field({ label, error, children, hint }: { label: Bi; error?: string; hint?: Bi; children: ReactNode }) {
  const { L } = useApp()
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold tracking-wider text-ink-500 uppercase dark:text-ink-400">{L(label)}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{L(hint)}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-700 dark:text-rose-400">{error}</span>}
    </label>
  )
}

const ctl =
  'block rounded-xl border-ink-300 bg-white text-sm text-ink-900 shadow-none transition-colors placeholder:text-ink-300 focus:border-copper-500 focus:ring-copper-500/30 dark:border-ink-600 dark:bg-ink-800 dark:text-ivory-100 dark:placeholder:text-ink-500 dark:focus:border-copper-400'

/**
 * `w-full` додається лише тоді, коли ширину не задано ззовні: у Tailwind
 * конфлікт `w-full` і `w-44` вирішується порядком у CSS, а не в атрибуті
 * class, тож фільтри з власною шириною інакше розтягувались на всю ширину.
 */
const widthOf = (cls?: string) => (/(^|\s)(w-|max-w-|flex-1)/.test(cls ?? '') ? '' : 'w-full')

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${ctl} ${widthOf(props.className)} ${props.className ?? ''}`} />
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${ctl} pr-9 ${widthOf(props.className)} ${props.className ?? ''}`} />
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${ctl} ${widthOf(props.className)} ${props.className ?? ''}`} />
}

/* ---------- Tabs ---------- */

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: Bi; count?: number }[]; value: T; onChange: (t: T) => void }) {
  const { L } = useApp()
  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-ink-200/70 dark:border-ink-700/70" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={`-mb-px flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            value === t.key
              ? 'border-copper-600 text-copper-700 dark:border-copper-400 dark:text-copper-300'
              : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ivory-100'
          }`}
        >
          {L(t.label)}
          {t.count !== undefined && (
            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ---------- Modal ---------- */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: Bi; children: ReactNode; wide?: boolean }) {
  const { L } = useApp()
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  // Портал у body: будь-який предок із backdrop-filter / transform стає
  // контейнером для position:fixed, і затемнення накрило б лише його.
  return createPortal(
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="animate-fade absolute inset-0 bg-ink-950/60 backdrop-blur-lg" onClick={onClose} />
      <div className={`animate-rise relative max-h-[88vh] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} overflow-y-auto rounded-2xl border border-ink-200/60 bg-white p-6 shadow-pop dark:border-ink-700 dark:bg-ink-900`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-semibold text-ink-950 dark:text-ivory-50">{L(title)}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-ink-800 dark:hover:text-ivory-100" aria-label="close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Misc ---------- */

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-ink-500 dark:text-ink-400">{children}</span>
}

export function Avatar({ name, size = 8 }: { name: string; size?: 8 | 9 | 10 }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  const cls = size === 10 ? 'size-10 text-sm' : size === 9 ? 'size-9 text-sm' : 'size-8 text-xs'
  return (
    <span className={`inline-flex ${cls} shrink-0 items-center justify-center rounded-full bg-copper-600/15 font-display font-semibold text-copper-700 dark:bg-copper-400/20 dark:text-copper-300`}>
      {initials}
    </span>
  )
}

export function Confidence({ v }: { v: number }) {
  const color = v >= 0.7 ? 'text-sage-600 dark:text-sage-400' : v >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
  return <span className={`font-mono text-xs font-semibold ${color}`}>{v.toFixed(2)}</span>
}
