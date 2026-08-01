import { useEffect, useMemo, useState } from 'react'
import { Languages, Save, Search } from 'lucide-react'
import { useApp } from '../lib/app'
import { PageHeader, Card, Table, Tr, Td, Input, Select, Button, EmptyState, Mono, Stat, applySort } from '../components/ui'
import type { SortState } from '../components/ui'
import { RAG_ORIGIN } from '../assistant/lib'

type Row = { namespace: string; key: string; uk: string; ru: string; en: string }

export default function Translations() {
  const { L, toast } = useApp()
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [ns, setNs] = useState('')
  const [sort, setSort] = useState<SortState>(null)
  const [edit, setEdit] = useState<Row | null>(null)
  const [offline, setOffline] = useState(false)

  const load = async () => {
    try {
      const r = await fetch(`${RAG_ORIGIN}/v1/admin/translations`)
      setRows((await r.json()).data)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const namespaces = useMemo(() => [...new Set(rows.map((r) => r.namespace))].sort(), [rows])

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!ns || r.namespace === ns) &&
          (!q ||
            [r.key, r.uk, r.ru, r.en].some((v) => v.toLowerCase().includes(q.toLowerCase()))),
      ),
    [rows, q, ns],
  )

  const sorted = useMemo(
    () => applySort(filtered, sort, (r, k) => (r as unknown as Record<string, string>)[k]),
    [filtered, sort],
  )

  const save = async () => {
    if (!edit) return
    try {
      await fetch(`${RAG_ORIGIN}/v1/admin/translations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      })
      setRows((rs) => rs.map((r) => (r.namespace === edit.namespace && r.key === edit.key ? edit : r)))
      setEdit(null)
      toast({ uk: 'Переклад збережено', ru: 'Перевод сохранён', en: 'Translation saved' })
    } catch {
      toast({ uk: 'Не вдалося зберегти', ru: 'Не удалось сохранить', en: 'Save failed' })
    }
  }

  return (
    <div>
      <PageHeader
        title={{ uk: 'Переклади інтерфейсу', ru: 'Переводы интерфейса', en: 'Interface translations' }}
        subtitle={{
          uk: 'Усі рядки адмінки зберігаються в базі даних і редагуються тут — без правок у коді та без релізу.',
          ru: 'Все строки админки хранятся в базе данных и редактируются здесь — без правок в коде и без релиза.',
          en: 'Every admin string lives in the database and is edited here — no code changes, no release needed.',
        }}
      />

      {offline && (
        <Card className="animate-rise mb-4 border-rose-300/60 dark:border-rose-500/30">
          <p className="text-sm text-rose-700 dark:text-rose-400">
            {L({ uk: 'API перекладів недоступний.', ru: 'API переводов недоступен.', en: 'Translations API is unreachable.' })}
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={{ uk: 'Рядків', ru: 'Строк', en: 'Strings' }} value={String(rows.length)} accent />
        <Stat label={{ uk: 'Розділів', ru: 'Разделов', en: 'Namespaces' }} value={String(namespaces.length)} />
        <Stat label={{ uk: 'Мов', ru: 'Языков', en: 'Languages' }} value="3" hint="uk · ru · en" />
        <Stat
          label={{ uk: 'Покриття', ru: 'Покрытие', en: 'Coverage' }}
          value={`${rows.length ? Math.round((rows.filter((r) => r.uk && r.ru && r.en).length / rows.length) * 100) : 0}%`}
        />
      </div>

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4 dark:border-ink-800">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-400" />
            <Input
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={L({ uk: 'Пошук по будь-якій мові…', ru: 'Поиск по любому языку…', en: 'Search any language…' })}
            />
          </div>
          <Select value={ns} onChange={(e) => setNs(e.target.value)} className="w-56">
            <option value="">{L({ uk: 'Розділ: усі', ru: 'Раздел: все', en: 'Namespace: all' })}</option>
            {namespaces.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
          <span className="ml-auto text-xs text-ink-400">
            {L({ uk: 'Знайдено', ru: 'Найдено', en: 'Found' })}: {filtered.length}
          </span>
        </div>

        {sorted.length === 0 ? (
          <EmptyState text={{ uk: 'Рядків не знайдено', ru: 'Строк не найдено', en: 'No strings found' }} />
        ) : (
          <Table
            sort={sort}
            onSort={setSort}
            head={[
              { uk: 'Розділ', ru: 'Раздел', en: 'Namespace', sortKey: 'namespace' },
              { uk: 'Ключ', ru: 'Ключ', en: 'Key', sortKey: 'key' },
              { uk: 'Українська', ru: 'Украинский', en: 'Ukrainian', sortKey: 'uk' },
              { uk: 'Російська', ru: 'Русский', en: 'Russian', sortKey: 'ru' },
              { uk: 'Англійська', ru: 'Английский', en: 'English', sortKey: 'en' },
              { uk: '', ru: '', en: '' },
            ]}
          >
            {sorted.slice(0, 120).map((r) => {
              const editing = edit?.namespace === r.namespace && edit?.key === r.key
              return (
                <Tr key={`${r.namespace}:${r.key}`}>
                  <Td><Mono>{r.namespace}</Mono></Td>
                  <Td><Mono>{r.key}</Mono></Td>
                  {(['uk', 'ru', 'en'] as const).map((code) => (
                    <Td key={code} className="max-w-64">
                      {editing ? (
                        <Input
                          value={edit![code]}
                          onChange={(e) => setEdit({ ...edit!, [code]: e.target.value })}
                          className="text-xs"
                        />
                      ) : (
                        <span className="line-clamp-2 text-ink-700 dark:text-ink-200">{r[code]}</span>
                      )}
                    </Td>
                  ))}
                  <Td>
                    {editing ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={save}><Save size={13} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEdit(null)}>
                          {L({ uk: 'Скасувати', ru: 'Отмена', en: 'Cancel' })}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setEdit(r)}>
                        <Languages size={13} /> {L({ uk: 'Змінити', ru: 'Изменить', en: 'Edit' })}
                      </Button>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Table>
        )}
      </Card>

      {sorted.length > 120 && (
        <p className="mt-3 text-xs text-ink-400">
          {L({
            uk: `Показано перші 120 із ${sorted.length}. Звузьте пошук або оберіть розділ.`,
            ru: `Показаны первые 120 из ${sorted.length}. Сузьте поиск или выберите раздел.`,
            en: `Showing the first 120 of ${sorted.length}. Narrow the search or pick a namespace.`,
          })}
        </p>
      )}
    </div>
  )
}
