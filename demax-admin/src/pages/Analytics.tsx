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
        title={{ uk: 'Аналітика', ru: 'Аналитика', en: 'Analytics' }}
        subtitle={{ uk: 'Бізнес-метрики платформи', ru: 'Бизнес-метрики платформы', en: 'Business metrics across the platform' }}
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
            <Button variant="secondary" size="sm" onClick={() => toast({ uk: 'Демо: CSV вивантажено', ru: 'Демо: CSV выгружен', en: 'Demo: CSV exported' })}>
              <Download size={14} /> CSV
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={{ uk: 'Усього клієнтів', ru: 'Всего клиентов', en: 'Total customers' }} value="768" hint="+37 / 30d" accent />
        <Stat label={{ uk: 'Professional', ru: 'Professional', en: 'Professional' }} value="214" hint="28%" />
        <Stat label={{ uk: 'Реєстрацій на семінари', ru: 'Регистраций на семинары', en: 'Seminar sign-ups' }} value="432" hint="30d" />
        <Stat label={{ uk: 'Доставлюваність розсилок', ru: 'Доставляемость рассылок', en: 'Broadcast delivery' }} value="96.4%" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-rise-1">
          <SectionTitle>{L({ uk: 'Зростання клієнтської бази', ru: 'Рост клиентской базы', en: 'Customer growth' })}</SectionTitle>
          <TrendChart data={growth} xKey="m" series={[{ key: 'customers', name: L({ uk: 'Клієнти', ru: 'Клиенты', en: 'Customers' }) }]} />
        </Card>

        <Card className="animate-rise-1">
          <SectionTitle>{L({ uk: 'Заповнюваність семінарів, %', ru: 'Заполняемость семинаров, %', en: 'Seminar fill rate, %' })}</SectionTitle>
          <BarsChart data={seminarFill} xKey="name" yKey="fill" name="%" />
        </Card>

        <Card className="animate-rise-2" pad={false}>
          <div className="px-5 pt-5 pb-2"><SectionTitle>{L({ uk: 'Ефективність менеджерів', ru: 'Эффективность менеджеров', en: 'Manager performance' })}</SectionTitle></div>
          <Table
            head={[
              { uk: 'Менеджер', ru: 'Менеджер', en: 'Manager' },
              { uk: 'Клієнтів', ru: 'Клиентов', en: 'Customers' },
              { uk: 'Вирішено ескалацій', ru: 'Решено эскалаций', en: 'Resolved' },
              { uk: 'Сер. час відповіді', ru: 'Ср. время ответа', en: 'Avg response' },
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
            <SectionTitle>{L({ uk: 'Популярні запитання', ru: 'Популярные вопросы', en: 'Popular questions' })}</SectionTitle>
            <RankList items={topQuestions.slice(0, 4).map((t) => ({ label: L(t.q), n: t.n }))} />
          </Card>
          <Card>
            <SectionTitle>{L({ uk: 'Кампанії', ru: 'Кампании', en: 'Campaigns' })}</SectionTitle>
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
