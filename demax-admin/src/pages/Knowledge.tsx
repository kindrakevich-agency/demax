import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Status, Button, Input, Select, LoadMore, EmptyState, Modal, SectionTitle } from '../components/ui'
import { articles } from '../lib/mock'

export default function Knowledge() {
  const { L, lang, toast } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [st, setSt] = useState('')
  const [cat, setCat] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchOpen, setSearchOpen] = useState(false)
  const [semQuery, setSemQuery] = useState('')

  const rows = useMemo(
    () =>
      articles.filter(
        (a) => (!q || a.title.toLowerCase().includes(q.toLowerCase())) && (!st || a.status === st) && (!cat || a.category === cat),
      ),
    [q, st, cat],
  )

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div>
      <PageHeader
        title={{ ru: 'База знаний', en: 'Knowledge Base' }}
        subtitle={{ ru: 'Единственный источник ответов AI. Публикация запускает чанкинг и эмбеддинги.', en: 'The only source of AI answers. Publishing triggers chunking and embeddings.' }}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSearchOpen(true)}>
              <Search size={14} /> {L({ ru: 'Поиск как AI', en: 'Search as AI' })}
            </Button>
            <Button size="sm" onClick={() => nav('/knowledge/a7')}>
              <Plus size={15} /> {L({ ru: 'Новая статья', en: 'New article' })}
            </Button>
          </>
        }
      />

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4 dark:border-ink-800">
          <Input placeholder={L({ ru: 'Поиск по заголовку…', en: 'Search titles…' })} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={st} onChange={(e) => setSt(e.target.value)} className="w-44">
            <option value="">{L({ ru: 'Статус: все', en: 'Status: all' })}</option>
            {['draft', 'in_review', 'approved', 'published', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
            <option value="">{L({ ru: 'Категория: все', en: 'Category: all' })}</option>
            {['skincare', 'protocols', 'products', 'faq'].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 border-b border-copper-500/30 bg-copper-500/8 px-4 py-2.5">
            <span className="text-sm font-bold text-copper-700 dark:text-copper-300">
              {selected.size} {L({ ru: 'выбрано', en: 'selected' })}
            </span>
            <Button size="sm" variant="secondary" onClick={() => { toast({ ru: `Реиндексация ${selected.size} статей поставлена в очередь`, en: `Re-index queued for ${selected.size} articles` }); setSelected(new Set()) }}>
              <RefreshCw size={13} /> {L({ ru: 'Реиндексировать', en: 'Re-index' })}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { toast({ ru: 'Демо: статьи в архиве', en: 'Demo: articles archived' }); setSelected(new Set()) }}>
              {L({ ru: 'В архив', en: 'Archive' })}
            </Button>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState text={{ ru: 'Статей не найдено', en: 'No articles found' }} />
        ) : (
          <>
            <Table
              head={[
                { ru: '', en: '' },
                { ru: 'Статья', en: 'Article' },
                { ru: 'Категория', en: 'Category' },
                { ru: 'Версия', en: 'Version' },
                { ru: 'Статус', en: 'Status' },
                { ru: 'Эмбеддинг', en: 'Embedding' },
                { ru: 'Цитирований', en: 'Cited' },
                { ru: 'Обновлена', en: 'Updated' },
              ]}
            >
              {rows.map((a) => (
                <Tr key={a.id} onClick={() => nav(`/knowledge/${a.id}`)}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggle(a.id)}
                      className="rounded border-ink-300 text-copper-600 focus:ring-copper-500/40"
                    />
                  </Td>
                  <Td><span className="font-semibold">{a.title}</span></Td>
                  <Td><span className="font-mono text-xs text-ink-500">{a.category}</span></Td>
                  <Td><span className="font-mono text-xs">v{a.version}</span></Td>
                  <Td><Status s={a.status} /></Td>
                  <Td><Status s={a.embedding === '—' ? 'none' : a.embedding} /></Td>
                  <Td><span className="font-mono text-xs">{a.cited}</span></Td>
                  <Td className="text-xs whitespace-nowrap text-ink-400">{fmtDate(a.updated, lang)}</Td>
                </Tr>
              ))}
            </Table>
            <LoadMore />
          </>
        )}
      </Card>

      {/* semantic search preview */}
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title={{ ru: 'Поиск глазами AI', en: 'Search as the AI sees it' }} wide>
        <p className="mb-3 text-sm text-ink-500 dark:text-ink-400">
          {L({ ru: 'Гибридный поиск (pgvector + FTS) по опубликованным чанкам — так AI выбирает источники.', en: 'Hybrid retrieval (pgvector + FTS) over published chunks — how the AI picks sources.' })}
        </p>
        <Input autoFocus value={semQuery} onChange={(e) => setSemQuery(e.target.value)} placeholder={L({ ru: 'сухая кожа зимой…', en: 'dry skin in winter…' })} />
        {semQuery.length > 2 && (
          <div className="mt-4 space-y-2">
            {[
              { a: articles[0], score: 0.89 },
              { a: articles[2], score: 0.77 },
              { a: articles[4], score: 0.61 },
            ].map(({ a, score }) => (
              <div key={a.id} className="rounded-xl border border-ink-200/60 p-3 dark:border-ink-700">
                <div className="flex items-center justify-between">
                  <SectionTitle>{a.title}</SectionTitle>
                  <span className="font-mono text-xs font-bold text-sage-600 dark:text-sage-400">{score.toFixed(2)}</span>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {L({ ru: '…плотный крем с керамидами восстанавливает барьер; наносить за 30 минут до выхода…', en: '…rich ceramide cream restores the barrier; apply 30 minutes before going outside…' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
