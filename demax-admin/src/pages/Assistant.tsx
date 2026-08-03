import { useEffect, useState } from 'react'
import { Bot, Database, Globe, FileText, RefreshCw, Sparkles, MessageCircle } from 'lucide-react'
import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, SectionTitle, Button, Status, Mono, Input } from '../components/ui'
import { RAG_ORIGIN } from '../assistant/lib'

type Ready = {
  status: string
  dependencies: {
    postgresql: boolean
    knowledge_chunks: number
    ingest: { status: string; done: number; total: number; error: string | null }
    llm_provider: boolean
  }
}
type Stats = { data: { category: string; articles: number; chunks: number }[]; total_chunks: number }
type SearchHit = { article_id: string; title: string; chunk: string; score: number; url: string | null }

const catLabel: Record<string, Bi> = {
  products: { uk: 'Товари (домашній догляд)', ru: 'Товары (домашний уход)', en: 'Products (home care)' },
  professional: { uk: 'Проф. препарати', ru: 'Проф. препараты', en: 'Professional preparations' },
  blog: { uk: 'Статті блогу', ru: 'Статьи блога', en: 'Blog articles' },
  pages: { uk: 'Сторінки сайту', ru: 'Страницы сайта', en: 'Site pages' },
  catalog_pdf: { uk: 'Каталог PDF (2021)', ru: 'Каталог PDF (2021)', en: 'PDF catalog (2021)' },
}

export default function Assistant() {
  const { L, toast } = useApp()
  const [ready, setReady] = useState<Ready | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [offline, setOffline] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [searching, setSearching] = useState(false)

  const refresh = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${RAG_ORIGIN}/v1/health/ready`).then((r) => r.json()),
        fetch(`${RAG_ORIGIN}/v1/admin/knowledge/articles`).then((r) => r.json()),
      ])
      setReady(r1)
      setStats(r2)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }

  useEffect(() => {
    void refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  const search = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    try {
      const r = await fetch(`${RAG_ORIGIN}/v1/admin/knowledge/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), top_k: 5 }),
      })
      const j = await r.json()
      setHits(j.results)
    } catch {
      toast({ uk: 'RAG API недоступний', ru: 'RAG API недоступен', en: 'RAG API unreachable' })
    } finally {
      setSearching(false)
    }
  }

  const ingest = ready?.dependencies.ingest

  return (
    <div>
      <PageHeader
        title={{ uk: 'AI-асистент (RAG)', ru: 'AI-ассистент (RAG)', en: 'AI Assistant (RAG)' }}
        subtitle={{
          uk: 'Живий RAG на локальному стенді: PostgreSQL + pgvector, гібридний пошук, відповіді лише з бази знань DEMAX',
          ru: 'Живой RAG на локальном стенде: PostgreSQL + pgvector, гибридный поиск, ответы только из базы знаний DEMAX',
          en: 'Live RAG on the local stand: PostgreSQL + pgvector, hybrid retrieval, answers grounded in the DEMAX knowledge base',
        }}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await fetch(`${RAG_ORIGIN}/v1/admin/knowledge/reindex`, { method: 'POST' }).catch(() => null)
              toast({ uk: 'Переіндексацію запущено', ru: 'Переиндексация запущена', en: 'Re-index started' })
            }}
          >
            <RefreshCw size={14} /> {L({ uk: 'Переіндексувати', ru: 'Реиндексировать', en: 'Re-index' })}
          </Button>
        }
      />

      {offline && (
        <Card className="animate-rise mb-4 border-rose-300/60 dark:border-rose-500/30">
          <p className="text-sm text-rose-700 dark:text-rose-400">
            {L({
              uk: 'RAG API не відповідає на localhost:8100. Запустіть: cd demax-rag && docker compose up -d',
              ru: 'RAG API не отвечает на localhost:8100. Запустите: cd demax-rag && docker compose up -d',
              en: 'RAG API is not responding on localhost:8100. Run: cd demax-rag && docker compose up -d',
            })}
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="animate-rise relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-copper-500 to-copper-300" />
          <Database size={18} className="mb-2 text-copper-600 dark:text-copper-400" />
          <div className="font-display text-3xl font-semibold">{stats?.total_chunks ?? '—'}</div>
          <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{L({ uk: 'чанків з ембедингами', ru: 'чанков с эмбеддингами', en: 'embedded chunks' })}</div>
        </Card>
        <Card className="animate-rise-1">
          <Globe size={18} className="mb-2 text-copper-600 dark:text-copper-400" />
          <div className="font-display text-3xl font-semibold">
            {stats ? stats.data.reduce((s, d) => s + d.articles, 0) : '—'}
          </div>
          <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{L({ uk: 'документів з demax.com.ua + PDF', ru: 'документов из demax.com.ua + PDF', en: 'documents from demax.com.ua + PDF' })}</div>
        </Card>
        <Card className="animate-rise-2">
          <Sparkles size={18} className="mb-2 text-copper-600 dark:text-copper-400" />
          <div className="mt-1"><Status s={ready?.dependencies.llm_provider ? 'active' : 'pending'} /></div>
          <div className="mt-2 text-xs text-ink-500 dark:text-ink-400">
            {ready?.dependencies.llm_provider
              ? L({ uk: 'LLM підключено', ru: 'LLM подключён', en: 'LLM connected' })
              : L({ uk: 'LLM-ключ не задано — екстрактивний режим', ru: 'LLM-ключ не задан — экстрактивный режим', en: 'No LLM key — extractive mode' })}
          </div>
        </Card>
        <Card className="animate-rise-3">
          <Bot size={18} className="mb-2 text-copper-600 dark:text-copper-400" />
          <div className="mt-1"><Status s={ingest?.status === 'running' ? 'pending' : ingest?.status === 'done' || (stats?.total_chunks ?? 0) > 0 ? 'ready' : 'draft'} /></div>
          <div className="mt-2 text-xs text-ink-500 dark:text-ink-400">
            {ingest?.status === 'running'
              ? `${L({ uk: 'Індексація', ru: 'Индексация', en: 'Ingesting' })}: ${ingest.done}/${ingest.total || '…'}`
              : L({ uk: 'Стан індексації', ru: 'Состояние индексации', en: 'Ingest state' })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="animate-rise-1" pad={false}>
          <div className="px-5 pt-5 pb-2"><SectionTitle>{L({ uk: 'База знань за джерелами', ru: 'База знаний по источникам', en: 'Knowledge by source' })}</SectionTitle></div>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {(stats?.data ?? []).map((d) => (
              <div key={d.category} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <FileText size={15} className="text-copper-600 dark:text-copper-400" />
                <span className="flex-1 font-semibold">{catLabel[d.category] ? L(catLabel[d.category]) : d.category}</span>
                <Mono>{d.articles} docs · {d.chunks} chunks</Mono>
              </div>
            ))}
            {!stats?.data.length && (
              <div className="px-5 py-8 text-center text-sm text-ink-400">
                {L({ uk: 'Триває перша індексація: скрейпінг demax.com.ua + каталог PDF…', ru: 'Идёт первая индексация: скрейпинг demax.com.ua + каталог PDF…', en: 'First ingest running: scraping demax.com.ua + the PDF catalog…' })}
              </div>
            )}
          </div>
        </Card>

        <Card className="animate-rise-2">
          <SectionTitle>{L({ uk: 'Пошук очима AI (гібридний)', ru: 'Поиск глазами AI (гибридный)', en: 'Search as the AI (hybrid)' })}</SectionTitle>
          <p className="mb-3 text-xs text-ink-500 dark:text-ink-400">
            {L({ uk: 'pgvector cosine + повнотекстовий пошук, злиття RRF — саме так асистент обирає джерела.', ru: 'pgvector cosine + полнотекстовый поиск, слияние RRF — именно так ассистент выбирает источники.', en: 'pgvector cosine + full-text search fused with RRF — exactly how the assistant picks sources.' })}
          </p>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder={L({ uk: 'крем для сухої шкіри…', ru: 'крем для сухой кожи…', en: 'cream for dry skin…' })}
            />
            <Button onClick={search} disabled={searching || query.trim().length < 2}>
              {L({ uk: 'Знайти', ru: 'Найти', en: 'Search' })}
            </Button>
          </div>
          <div className="mt-4 space-y-2.5">
            {hits?.map((h) => (
              <div key={h.article_id + h.chunk.slice(0, 8)} className="rounded-xl border border-ink-200/60 p-3 dark:border-ink-700">
                <div className="flex items-center justify-between gap-2">
                  <a href={h.url ?? undefined} target="_blank" rel="noreferrer" className={`truncate text-sm font-bold ${h.url ? 'text-copper-700 hover:underline dark:text-copper-300' : ''}`}>
                    {h.title}
                  </a>
                  <span className="font-mono text-xs font-bold text-sage-600 dark:text-sage-400">{h.score.toFixed(3)}</span>
                </div>
                <p className="mt-1 line-clamp-3 text-xs text-ink-500 dark:text-ink-400">{h.chunk}</p>
              </div>
            ))}
            {hits && hits.length === 0 && <p className="text-sm text-ink-400">{L({ uk: 'Нічого не знайдено', ru: 'Ничего не найдено', en: 'Nothing found' })}</p>}
          </div>
        </Card>

        <Card className="animate-rise-3 lg:col-span-2 border-copper-500/40">
          <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-copper-600/12 text-copper-700 dark:text-copper-300"><MessageCircle size={20} /></span>
            <div className="flex-1">
              <SectionTitle>{L({ uk: 'Спробуйте консультанта', ru: 'Попробуйте консультанта', en: 'Try the consultant' })}</SectionTitle>
              <p className="-mt-1 text-sm text-ink-500 dark:text-ink-400">
                {L({
                  uk: 'Натисніть на плаваючу кнопку в правому нижньому куті — це віджет-консультант із живим RAG: відповіді лише з проіндексованої бази DEMAX, із джерелами та ескалацією менеджеру.',
                  ru: 'Нажмите на плавающую кнопку в правом нижнем углу — это виджет-консультант с живым RAG: ответы только из проиндексированной базы DEMAX, с источниками и эскалацией менеджеру.',
                  en: 'Click the floating button in the bottom-right corner — the consultant widget runs on the live RAG: answers only from the indexed DEMAX base, with sources and manager escalation.',
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
