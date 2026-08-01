import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts'
import { useApp } from '../lib/app'

/* Кольори серій — насичені відповідники бежевого кольору бренду DEMAX
   (#C6A48A сам по собі надто приглушений і на графіку читається як сірий).
   Перевірено валідатором dataviz: світла тема на #FFFFFF, темна на #141312. */
export function useChartTheme() {
  const { dark } = useApp()
  return {
    s1: dark ? '#B57F3C' : '#A66A2E',
    s2: dark ? '#2E9DC4' : '#0F80A8',
    grid: dark ? 'rgba(195,186,175,0.12)' : 'rgba(50,47,43,0.10)',
    ink: dark ? '#9A9188' : '#736C63',
    tooltipBg: dark ? '#201E1C' : '#FFFFFF',
    tooltipBorder: dark ? '#322F2B' : '#DED5C9',
    text: dark ? '#EDE7DE' : '#141312',
  }
}

function useTooltipStyle() {
  const t = useChartTheme()
  return {
    contentStyle: {
      background: t.tooltipBg,
      border: `1px solid ${t.tooltipBorder}`,
      borderRadius: 12,
      fontSize: 12,
      color: t.text,
      boxShadow: '0 4px 12px rgba(23,20,18,.12)',
    },
    labelStyle: { color: t.text, fontWeight: 700 },
    cursor: { stroke: t.ink, strokeDasharray: '3 3' },
  }
}

export function TrendChart({ data, xKey, series, height = 240 }: {
  data: Record<string, unknown>[]
  xKey: string
  series: { key: string; name: string }[]
  height?: number
}) {
  const t = useChartTheme()
  const tt = useTooltipStyle()
  const colors = [t.s1, t.s2]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={colors[i]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: t.ink }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.ink }} axisLine={false} tickLine={false} />
        <Tooltip {...tt} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: t.ink }} iconType="plainline" />}
        {series.map((s, i) => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={colors[i]} strokeWidth={2} fill={`url(#g-${s.key})`} dot={false} activeDot={{ r: 4 }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BarsChart({ data, xKey, yKey, name, height = 240, highlightLast }: {
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  name: string
  height?: number
  highlightLast?: boolean
}) {
  const t = useChartTheme()
  const tt = useTooltipStyle()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="28%">
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: t.ink }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: t.ink }} axisLine={false} tickLine={false} />
        <Tooltip {...tt} cursor={{ fill: t.grid }} />
        <Bar dataKey={yKey} name={name} radius={[4, 4, 0, 0]} maxBarSize={44}>
          {data.map((_, i) => (
            <Cell key={i} fill={highlightLast && i === data.length - 1 ? t.s2 : t.s1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* Horizontal ranked list with proportional bars — for "top questions" style data. */
export function RankList({ items }: { items: { label: string; n: number }[] }) {
  const t = useChartTheme()
  const max = Math.max(...items.map((i) => i.n))
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-700 dark:text-ink-200">{it.label}</span>
            <span className="font-mono text-xs font-semibold text-ink-500 dark:text-ink-400">{it.n}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div className="h-full rounded-full" style={{ width: `${(it.n / max) * 100}%`, background: t.s1 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
