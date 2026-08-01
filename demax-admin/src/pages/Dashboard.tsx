import { Link } from 'react-router-dom'
import { ArrowRight, Cpu, Database, HardDrive, Wifi } from 'lucide-react'
import { useApp, fmtDate } from '../lib/app'
import { Card, PageHeader, SectionTitle, Stat, Status, Avatar, Confidence } from '../components/ui'
import { TrendChart, BarsChart } from '../components/charts'
import { convPerDay, confidenceDist, escalations, verifications, seminars, articles, customerById, audit } from '../lib/mock'

export default function Dashboard() {
  const { L, lang } = useApp()
  const openEsc = escalations.filter((e) => e.status === 'open')
  const pendingVer = verifications.filter((v) => v.status === 'pending')
  const upcoming = seminars.filter((s) => s.status === 'open')
  const kbPublished = articles.filter((a) => a.status === 'published').length
  const kbReview = articles.filter((a) => a.status === 'in_review').length

  return (
    <div>
      <PageHeader
        title={{ ru: 'Доброе утро, Ольга', en: 'Good morning, Olga' }}
        subtitle={{ ru: 'Суббота, 1 августа 2026 · всё работает штатно', en: 'Saturday, 1 August 2026 · all systems nominal' }}
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={{ ru: 'Диалогов сегодня', en: 'Conversations today' }} value="64" hint={L({ ru: '+18% к прошлой субботе', en: '+18% vs last Saturday' })} accent />
        <Stat label={{ ru: 'AI закрыл сам', en: 'AI resolved' }} value="91%" hint={L({ ru: 'без эскалации', en: 'without escalation' })} />
        <Stat label={{ ru: 'Открытые эскалации', en: 'Open escalations' }} value={String(openEsc.length + escalations.filter(e => e.status === 'assigned').length)} hint={L({ ru: `${openEsc.length} не назначено`, en: `${openEsc.length} unassigned` })} />
        <Stat label={{ ru: 'Ждут верификации', en: 'Pending verification' }} value={String(pendingVer.length)} hint={L({ ru: 'старейшая — 2 дня', en: 'oldest — 2 days' })} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* charts */}
        <Card className="animate-rise-1 lg:col-span-2">
          <SectionTitle>{L({ ru: 'Диалоги и эскалации, 8 дней', en: 'Conversations & escalations, 8 days' })}</SectionTitle>
          <TrendChart
            data={convPerDay}
            xKey="d"
            series={[
              { key: 'conversations', name: L({ ru: 'Диалоги', en: 'Conversations' }) },
              { key: 'escalations', name: L({ ru: 'Эскалации', en: 'Escalations' }) },
            ]}
          />
        </Card>

        <Card className="animate-rise-2">
          <SectionTitle>{L({ ru: 'Уверенность AI', en: 'AI confidence' })}</SectionTitle>
          <BarsChart data={confidenceDist} xKey="bucket" yKey="count" name={L({ ru: 'Ответов', en: 'Answers' })} highlightLast />
          <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
            {L({ ru: '85% ответов с уверенностью выше 0.6', en: '85% of answers above 0.6 confidence' })}
          </p>
        </Card>

        {/* escalations preview */}
        <Card className="animate-rise-1 lg:col-span-2" pad={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <SectionTitle>{L({ ru: 'Требуют внимания', en: 'Needs attention' })}</SectionTitle>
            <Link to="/escalations" className="flex items-center gap-1 text-xs font-bold text-copper-700 hover:underline dark:text-copper-300">
              {L({ ru: 'Все эскалации', en: 'All escalations' })} <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {escalations.filter((e) => e.status !== 'resolved' && e.status !== 'dismissed').map((e) => {
              const c = customerById(e.customerId)
              return (
                <Link key={e.id} to="/escalations" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ivory-100/70 dark:hover:bg-ink-800/50">
                  <Avatar name={c?.name ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{c?.name}</div>
                    <div className="text-xs text-ink-400">
                      {e.id} · {fmtDate(e.created, lang, true)}
                    </div>
                  </div>
                  <Confidence v={e.confidence} />
                  <Status s={e.status} />
                </Link>
              )
            })}
          </div>
        </Card>

        {/* right rail: seminars + KB + health */}
        <div className="animate-rise-2 space-y-4">
          <Card pad={false}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <SectionTitle>{L({ ru: 'Ближайшие семинары', en: 'Upcoming seminars' })}</SectionTitle>
              <Link to="/seminars" className="text-xs font-bold text-copper-700 hover:underline dark:text-copper-300">→</Link>
            </div>
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {upcoming.slice(0, 3).map((s) => (
                <Link key={s.id} to={`/seminars/${s.id}`} className="block px-5 py-3 hover:bg-ivory-100/70 dark:hover:bg-ink-800/50">
                  <div className="truncate text-sm font-semibold">{s.title}</div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-ink-400">
                    <span>{fmtDate(s.start, lang)}</span>
                    <span className="font-mono">{s.capacity === null ? `${s.taken}/∞` : `${s.taken}/${s.capacity}`}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>{L({ ru: 'База знаний', en: 'Knowledge Base' })}</SectionTitle>
            <div className="flex items-end justify-between">
              <div>
                <div className="font-display text-3xl font-semibold">{kbPublished}</div>
                <div className="text-xs text-ink-400">{L({ ru: 'опубликовано', en: 'published' })}</div>
              </div>
              <Link to="/knowledge" className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400">
                {kbReview} {L({ ru: 'на проверке', en: 'in review' })}
              </Link>
            </div>
          </Card>

          <Card>
            <SectionTitle>{L({ ru: 'Состояние системы', en: 'System health' })}</SectionTitle>
            <div className="space-y-2.5 text-sm">
              {[
                { icon: Cpu, name: 'API', v: '99.98%' },
                { icon: Database, name: 'PostgreSQL', v: '12 ms' },
                { icon: HardDrive, name: 'Redis', v: '0.8 ms' },
                { icon: Wifi, name: 'Telegram', v: 'OK' },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-2.5">
                  <r.icon size={15} className="text-ink-400" />
                  <span className="flex-1 text-ink-600 dark:text-ink-300">{r.name}</span>
                  <span className="font-mono text-xs text-sage-600 dark:text-sage-400">{r.v}</span>
                  <span className="size-2 rounded-full bg-sage-500" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* recent activity */}
        <Card className="animate-rise-3 lg:col-span-3" pad={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <SectionTitle>{L({ ru: 'Последние действия', en: 'Recent activity' })}</SectionTitle>
            <Link to="/audit" className="flex items-center gap-1 text-xs font-bold text-copper-700 hover:underline dark:text-copper-300">
              {L({ ru: 'Журнал аудита', en: 'Audit log' })} <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid gap-x-8 px-5 pb-5 sm:grid-cols-2">
            {audit.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center gap-3 border-b border-ink-100 py-2.5 last:border-0 sm:nth-last-[2]:border-0 dark:border-ink-800">
                <span className="font-mono text-[11px] text-copper-700 dark:text-copper-300">{a.action}</span>
                <span className="flex-1 truncate text-xs text-ink-500 dark:text-ink-400">{a.actor}</span>
                <span className="text-[11px] whitespace-nowrap text-ink-400">{fmtDate(a.time, lang, true)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
