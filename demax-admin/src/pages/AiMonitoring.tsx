import { useApp } from '../lib/app'
import { PageHeader, Card, SectionTitle, Stat } from '../components/ui'
import { TrendChart, BarsChart, RankList } from '../components/charts'
import { convPerDay, confidenceDist, topQuestions, notFoundTopics, articles } from '../lib/mock'

const latency = [
  { d: '25.07', retrieval: 210, generation: 1650 },
  { d: '26.07', retrieval: 195, generation: 1580 },
  { d: '27.07', retrieval: 188, generation: 1490 },
  { d: '28.07', retrieval: 240, generation: 1710 },
  { d: '29.07', retrieval: 231, generation: 1820 },
  { d: '30.07', retrieval: 205, generation: 1660 },
  { d: '31.07', retrieval: 218, generation: 1700 },
  { d: '01.08', retrieval: 199, generation: 1540 },
]

export default function AiMonitoring() {
  const { L } = useApp()
  const topCited = articles.filter((a) => a.cited > 0).sort((a, b) => b.cited - a.cited).slice(0, 5)

  return (
    <div>
      <PageHeader
        title={{ ru: 'AI-мониторинг', en: 'AI Monitoring' }}
        subtitle={{ ru: 'Качество ответов, задержки и пробелы в базе знаний. Только чтение.', en: 'Answer quality, latency and knowledge coverage gaps. Read-only.' }}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label={{ ru: 'Ответов за 7 дней', en: 'Answers, 7 days' }} value="862" accent />
        <Stat label={{ ru: 'Средняя уверенность', en: 'Avg confidence' }} value="0.79" />
        <Stat label={{ ru: 'Эскалаций', en: 'Escalation rate' }} value="8.2%" />
        <Stat label={{ ru: 'С цитатами', en: 'With citations' }} value="96%" />
        <Stat label={{ ru: 'p95 задержка', en: 'p95 latency' }} value="2.1s" hint={L({ ru: 'бюджет ≤ 3.0s', en: 'budget ≤ 3.0s' })} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-rise-1">
          <SectionTitle>{L({ ru: 'Задержка по этапам, мс (p95)', en: 'Latency by stage, ms (p95)' })}</SectionTitle>
          <TrendChart
            data={latency}
            xKey="d"
            series={[
              { key: 'generation', name: L({ ru: 'Генерация', en: 'Generation' }) },
              { key: 'retrieval', name: L({ ru: 'Поиск', en: 'Retrieval' }) },
            ]}
          />
        </Card>

        <Card className="animate-rise-1">
          <SectionTitle>{L({ ru: 'Распределение уверенности', en: 'Confidence distribution' })}</SectionTitle>
          <BarsChart data={confidenceDist} xKey="bucket" yKey="count" name={L({ ru: 'Ответов', en: 'Answers' })} highlightLast />
        </Card>

        <Card className="animate-rise-2">
          <SectionTitle>{L({ ru: 'Диалоги и эскалации', en: 'Conversations & escalations' })}</SectionTitle>
          <TrendChart
            data={convPerDay}
            xKey="d"
            series={[
              { key: 'conversations', name: L({ ru: 'Диалоги', en: 'Conversations' }) },
              { key: 'escalations', name: L({ ru: 'Эскалации', en: 'Escalations' }) },
            ]}
          />
        </Card>

        <div className="animate-rise-2 space-y-4">
          <Card>
            <SectionTitle>{L({ ru: 'Топ цитируемых статей', en: 'Most cited articles' })}</SectionTitle>
            <RankList items={topCited.map((a) => ({ label: a.title, n: a.cited }))} />
          </Card>
          <Card className="border-amber-300/60 dark:border-amber-500/30">
            <SectionTitle>{L({ ru: 'Пробелы в базе знаний', en: 'Coverage gaps' })}</SectionTitle>
            <p className="mb-3 text-xs text-ink-500 dark:text-ink-400">
              {L({ ru: 'Темы, где AI не нашёл ответ — кандидаты на новые статьи', en: 'Topics where the AI found no answer — candidates for new articles' })}
            </p>
            <RankList items={notFoundTopics.map((t) => ({ label: L(t.q), n: t.n }))} />
          </Card>
        </div>

        <Card className="animate-rise-3 lg:col-span-2">
          <SectionTitle>{L({ ru: 'Популярные вопросы клиентов', en: 'Top customer questions' })}</SectionTitle>
          <RankList items={topQuestions.map((t) => ({ label: L(t.q), n: t.n }))} />
        </Card>
      </div>
    </div>
  )
}
