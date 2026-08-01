import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Bold, Italic, List, Link2, Heading2, RefreshCw } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Status, Button, Tabs, Field, Input, Select, SectionTitle, Mono } from '../components/ui'
import { articleById } from '../lib/mock'
import type { Bi } from '../lib/app'

const sampleMd = `## Сухая кожа: базовый протокол

Сухая кожа теряет влагу из-за нарушенного липидного барьера.

**Утро:**
1. Мягкое очищение без сульфатов
2. Тонизирование
3. Hydra Rich Cream — за 30 минут до выхода

**Вечер:**
1. Двухэтапное очищение
2. Питательная маска — 2 раза в неделю

> Важно: при шелушении и зуде — консультация косметолога.`

function mdPreview(md: string) {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
}

type Tab = 'editor' | 'versions' | 'chunks' | 'audit'

export default function ArticleEditor() {
  const { id } = useParams()
  const { L, lang, toast } = useApp()
  const a = articleById(id ?? '')
  const [tab, setTab] = useState<Tab>('editor')
  const [md, setMd] = useState(sampleMd)
  const [title, setTitle] = useState(a?.title ?? '')
  const isPublished = a?.status === 'published'

  const tabs: { key: Tab; label: Bi }[] = [
    { key: 'editor', label: { uk: 'Редактор', ru: 'Редактор', en: 'Editor' } },
    { key: 'versions', label: { uk: 'Версії', ru: 'Версии', en: 'Versions' } },
    { key: 'chunks', label: { uk: 'Чанки', ru: 'Чанки', en: 'Chunks' } },
    { key: 'audit', label: { uk: 'Аудит', ru: 'Аудит', en: 'Audit' } },
  ]

  return (
    <div>
      <Link to="/knowledge" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-copper-700 dark:hover:text-copper-300">
        <ArrowLeft size={15} /> {L({ uk: 'База знань', ru: 'База знаний', en: 'Knowledge Base' })}
      </Link>

      <PageHeader
        title={{ uk: a ? 'Редагування статті' : 'Нова стаття', ru: a ? 'Редактирование статьи' : 'Новая статья', en: a ? 'Edit article' : 'New article' }}
        actions={
          <>
            {a && <Status s={a.status} />}
            <Button variant="secondary" size="sm" onClick={() => toast({ uk: 'Чернетку збережено', ru: 'Черновик сохранён', en: 'Draft saved' })}>
              {L({ uk: 'Зберегти', ru: 'Сохранить', en: 'Save' })}
            </Button>
            <Button size="sm" onClick={() => toast({ uk: 'Надіслано на перевірку', ru: 'Отправлено на проверку', en: 'Submitted for review' })}>
              {L({ uk: 'На перевірку', ru: 'На проверку', en: 'Submit for review' })}
            </Button>
          </>
        }
      />

      {isPublished && (
        <div className="animate-rise mb-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {L({
            uk: 'Статтю опубліковано. Зміна тексту поверне її в статус «на перевірці» та підніме версію (v' + ((a?.version ?? 0) + 1) + ').',
            ru: 'Статья опубликована. Изменение текста вернёт её в статус «на проверке» и поднимет версию (v' + ((a?.version ?? 0) + 1) + ').',
            en: 'This article is live. Editing the content resets it to “in review” and bumps the version (v' + ((a?.version ?? 0) + 1) + ').',
          })}
        </div>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'editor' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label={{ uk: 'Заголовок', ru: 'Заголовок', en: 'Title' }}>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={250} />
                  </Field>
                </div>
                <Field label={{ uk: 'Категорія', ru: 'Категория', en: 'Category' }}>
                  <Select defaultValue={a?.category ?? 'skincare'}>
                    {['skincare', 'protocols', 'products', 'faq'].map((c) => <option key={c}>{c}</option>)}
                  </Select>
                </Field>
              </div>
            </Card>

            <Card pad={false}>
              <div className="flex items-center gap-1 border-b border-ink-100 px-3 py-2 dark:border-ink-800">
                {[Bold, Italic, Heading2, List, Link2].map((I, i) => (
                  <button key={i} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ivory-100" onClick={() => toast({ uk: 'Демо: форматування', ru: 'Демо: форматирование', en: 'Demo: formatting' })}>
                    <I size={15} />
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-ink-400">Markdown</span>
              </div>
              <div className="grid md:grid-cols-2 md:divide-x md:divide-ink-100 dark:md:divide-ink-800">
                <textarea
                  value={md}
                  onChange={(e) => setMd(e.target.value)}
                  rows={18}
                  className="w-full resize-none border-0 bg-transparent p-4 font-mono text-[13px] leading-relaxed text-ink-800 focus:ring-0 dark:text-ivory-100"
                />
                <div
                  className="prose-sm hidden overflow-y-auto p-4 text-sm leading-relaxed text-ink-800 md:block dark:text-ink-100 [&_blockquote]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-copper-500 [&_blockquote]:pl-3 [&_blockquote]:text-ink-500 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-decimal"
                  dangerouslySetInnerHTML={{ __html: mdPreview(md) }}
                />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <SectionTitle>{L({ uk: 'Workflow', ru: 'Workflow', en: 'Workflow' })}</SectionTitle>
              <ol className="space-y-2 text-sm">
                {(['draft', 'in_review', 'approved', 'published'] as const).map((s, i) => {
                  const reached = a ? ['draft', 'in_review', 'approved', 'published'].indexOf(a.status) >= i : i === 0
                  return (
                    <li key={s} className="flex items-center gap-2.5">
                      <span className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${reached ? 'bg-copper-600 text-ivory-50' : 'bg-ink-100 text-ink-400 dark:bg-ink-800'}`}>{i + 1}</span>
                      <Status s={s} />
                    </li>
                  )
                })}
              </ol>
            </Card>
            {a && (
              <Card>
                <SectionTitle>{L({ uk: 'Мета', ru: 'Мета', en: 'Meta' })}</SectionTitle>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-400">{L({ uk: 'Версія', ru: 'Версия', en: 'Version' })}</dt><dd className="font-mono">v{a.version}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-400">{L({ uk: 'Мова', ru: 'Язык', en: 'Language' })}</dt><dd className="font-mono uppercase">{a.language}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-400">{L({ uk: 'Цитувань', ru: 'Цитирований', en: 'Citations' })}</dt><dd className="font-mono">{a.cited}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-400">{L({ uk: 'Оновлена', ru: 'Обновлена', en: 'Updated' })}</dt><dd>{fmtDate(a.updated, lang)}</dd></div>
                </dl>
                <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => toast({ uk: 'Переіндексація в черзі (ембединг: pending)', ru: 'Реиндексация в очереди (эмбеддинг: pending)', en: 'Re-index queued (embedding: pending)' })}>
                  <RefreshCw size={13} /> {L({ uk: 'Переіндексувати', ru: 'Реиндексировать', en: 'Re-index' })}
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <Card pad={false}>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {Array.from({ length: a?.version ?? 1 }, (_, i) => (a?.version ?? 1) - i).map((v) => (
              <div key={v} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <span className="font-mono font-bold text-copper-700 dark:text-copper-300">v{v}</span>
                <span className="flex-1 text-ink-500">{v === a?.version ? L({ uk: 'Поточна версія', ru: 'Текущая версия', en: 'Current version' }) : L({ uk: 'Опублікована та замінена', ru: 'Опубликована и заменена', en: 'Published, then superseded' })}</span>
                <span className="text-xs text-ink-400">{fmtDate(a?.updated ?? '', lang)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'chunks' && (
        <div className="space-y-3">
          <p className="text-xs text-ink-400">{L({ uk: 'Чанки генеруються автоматично під час публікації. Лише для читання.', ru: 'Чанки генерируются автоматически при публикации. Только чтение.', en: 'Chunks are generated on publish. Read-only.' })}</p>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <div className="mb-1.5 flex items-center justify-between">
                <Mono>chunk_{i} · 214 tokens</Mono>
                <Status s="ready" />
              </div>
              <p className="text-sm text-ink-600 dark:text-ink-300">
                {L({ uk: 'Суха шкіра втрачає вологу через порушений ліпідний бар’єр. Ранковий догляд: м’яке очищення…', ru: 'Сухая кожа теряет влагу из-за нарушенного липидного барьера. Утренний уход: мягкое очищение…', en: 'Dry skin loses moisture through a damaged lipid barrier. Morning routine: gentle cleansing…' })}
              </p>
            </Card>
          ))}
        </div>
      )}

      {tab === 'audit' && (
        <Card pad={false}>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {['kb.article_published', 'kb.article_updated', 'kb.article_created'].map((act, i) => (
              <div key={act} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="font-mono text-xs text-copper-700 dark:text-copper-300">{act}</span>
                <span className="flex-1 text-ink-500">Ольга Коваль</span>
                <span className="text-xs text-ink-400">{fmtDate(new Date(Date.parse(a?.updated ?? '2026-07-01') - i * 86400000 * 9).toISOString(), lang, true)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
