import { useState } from 'react'
import { Download } from 'lucide-react'
import { useApp } from '../lib/app'
import { PageHeader, Card, SectionTitle, Stat, Button, Table, Tr, Td } from '../components/ui'
import { TrendChart, BarsChart, RankList } from '../components/charts'
import { growth, seminars, managers, promotions, topQuestions } from '../lib/mock'

const ranges = ['7d', '30d', '90d'] as const

export default function Analytics() {
  const { L, toast } = useApp()
  const [range, setRange] = useState<(typeof ranges)[number]>('30d')

  const seminarFill = seminars
    .filter((s) => s.capacity !== null)
    .map((s) => ({ name: s.title.slice(0, 18), fill: Math.round((s.taken / (s.capacity ?? 1)) * 100) }))

  return (
    <div>
      <PageHeader
        title={{ ru: 'Аналитика', en: 'Analytics' }}
        subtitle={{ ru: 'Бизнес-метрики платформы', en: 'Business metrics across the platform' }}
        actions={
          <>
            <div className="flex overflow-hidden rounded-full border border-ink-200 text-xs font-bold dark:border-ink-700">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 transition-colors ${range === r ? 'bg-ink-900 text-ivory-50 dark:bg-ivory-100 dark:text-ink-900' : 'text-ink-500 hover:text-ink-900 dark:hover:text-ivory-100'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast({ ru: 'Демо: CSV выгружен', en: 'Demo: CSV exported' })}>
              <Download size={14} /> CSV
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={{ ru: 'Всего клиентов', en: 'Total customers' }} value="768" hint="+37 / 30d" accent />
        <Stat label={{ ru: 'Professional', en: 'Professional' }} value="214" hint="28%" />
        <Stat label={{ ru: 'Регистраций на семинары', en: 'Seminar sign-ups' }} value="432" hint="30d" />
        <Stat label={{ ru: 'Доставляемость рассылок', en: 'Broadcast delivery' }} value="96.4%" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-rise-1">
          <SectionTitle>{L({ ru: 'Рост клиентской базы', en: 'Customer growth' })}</SectionTitle>
          <TrendChart data={growth} xKey="m" series={[{ key: 'customers', name: L({ ru: 'Клиенты', en: 'Customers' }) }]} />
        </Card>

        <Card className="animate-rise-1">
          <SectionTitle>{L({ ru: 'Заполняемость семинаров, %', en: 'Seminar fill rate, %' })}</SectionTitle>
          <BarsChart data={seminarFill} xKey="name" yKey="fill" name="%" />
        </Card>

        <Card className="animate-rise-2" pad={false}>
          <div className="px-5 pt-5 pb-2"><SectionTitle>{L({ ru: 'Эффективность менеджеров', en: 'Manager performance' })}</SectionTitle></div>
          <Table
            head={[
              { ru: 'Менеджер', en: 'Manager' },
              { ru: 'Клиентов', en: 'Customers' },
              { ru: 'Решено эскалаций', en: 'Resolved' },
              { ru: 'Ср. время ответа', en: 'Avg response' },
            ]}
          >
            {managers.filter((m) => m.active).map((m, i) => (
              <Tr key={m.id}>
                <Td><span className="font-semibold">{m.name}</span></Td>
                <Td><span className="font-mono text-xs">{m.assigned}</span></Td>
                <Td><span className="font-mono text-xs">{[34, 41, 28, 19][i] ?? 0}</span></Td>
                <Td><span className="font-mono text-xs text-sage-600 dark:text-sage-400">{['14m', '11m', '22m', '31m'][i] ?? '—'}</span></Td>
              </Tr>
            ))}
          </Table>
        </Card>

        <div className="animate-rise-2 space-y-4">
          <Card>
            <SectionTitle>{L({ ru: 'Популярные вопросы', en: 'Popular questions' })}</SectionTitle>
            <RankList items={topQuestions.slice(0, 4).map((t) => ({ label: L(t.q), n: t.n }))} />
          </Card>
          <Card>
            <SectionTitle>{L({ ru: 'Кампании', en: 'Campaigns' })}</SectionTitle>
            <div className="space-y-2.5 text-sm">
              {promotions.filter((p) => p.sent > 0).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink-600 dark:text-ink-300">{p.title}</span>
                  <span className="font-mono text-xs whitespace-nowrap text-ink-500">
                    {Math.round((p.delivered / p.sent) * 100)}% · {p.delivered}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
