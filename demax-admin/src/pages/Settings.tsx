import { Link } from 'react-router-dom'
import { Lock, Globe, Bot, Send, BookOpen, UserCog, ArrowRight } from 'lucide-react'
import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, SectionTitle, Mono } from '../components/ui'

function ReadonlyRow({ k, v }: { k: Bi; v: string }) {
  const { L } = useApp()
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-2.5 text-sm last:border-0 dark:border-ink-800">
      <span className="text-ink-500 dark:text-ink-400">{L(k)}</span>
      <Mono>{v}</Mono>
    </div>
  )
}

export default function SettingsPage() {
  const { L } = useApp()
  return (
    <div>
      <PageHeader
        title={{ ru: 'Настройки', en: 'Settings' }}
        subtitle={{ ru: 'Параметры платформы задаются на уровне деплоя (12-factor). Здесь — только просмотр.', en: 'Platform parameters are set at deployment level (12-factor). Read-only here.' }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-rise border-copper-500/40">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-copper-600/12 text-copper-700 dark:text-copper-300"><UserCog size={19} /></span>
            <div className="flex-1">
              <SectionTitle>{L({ ru: 'Персонал и роли', en: 'Staff & roles' })}</SectionTitle>
              <p className="-mt-2 text-xs text-ink-400">{L({ ru: 'Единственный редактируемый раздел', en: 'The only editable section' })}</p>
            </div>
            <Link to="/staff" className="flex items-center gap-1 text-xs font-bold text-copper-700 hover:underline dark:text-copper-300">
              {L({ ru: 'Открыть', en: 'Open' })} <ArrowRight size={13} />
            </Link>
          </div>
        </Card>

        <Card className="animate-rise">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300"><Globe size={19} /></span>
            <SectionTitle>{L({ ru: 'Общие', en: 'General' })}</SectionTitle>
            <Lock size={13} className="ml-auto text-ink-300" />
          </div>
          <ReadonlyRow k={{ ru: 'Домен', en: 'Domain' }} v="demax.kindrakevich.com" />
          <ReadonlyRow k={{ ru: 'Среда', en: 'Environment' }} v="demo" />
          <ReadonlyRow k={{ ru: 'Языки', en: 'Languages' }} v="ru, en" />
          <ReadonlyRow k={{ ru: 'Часовой пояс', en: 'Timezone' }} v="UTC (display: local)" />
        </Card>

        <Card className="animate-rise-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300"><Send size={19} /></span>
            <SectionTitle>Telegram</SectionTitle>
            <Lock size={13} className="ml-auto text-ink-300" />
          </div>
          <ReadonlyRow k={{ ru: 'Бот', en: 'Bot' }} v="@demax_assistant_bot" />
          <ReadonlyRow k={{ ru: 'Webhook', en: 'Webhook' }} v="/v1/integrations/telegram/webhook" />
          <ReadonlyRow k={{ ru: 'Тротлинг рассылок', en: 'Broadcast throttle' }} v="20 msg/s" />
        </Card>

        <Card className="animate-rise-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300"><Bot size={19} /></span>
            <SectionTitle>{L({ ru: 'AI-параметры', en: 'AI parameters' })}</SectionTitle>
            <Lock size={13} className="ml-auto text-ink-300" />
          </div>
          <ReadonlyRow k={{ ru: 'Провайдер', en: 'Provider' }} v="Claude API (replaceable)" />
          <ReadonlyRow k={{ ru: 'Порог ответа', en: 'Answer threshold' }} v="confidence ≥ 0.60" />
          <ReadonlyRow k={{ ru: 'Порог эскалации', en: 'Escalation threshold' }} v="confidence < 0.45" />
          <ReadonlyRow k={{ ru: 'Retrieval top-k', en: 'Retrieval top-k' }} v="5" />
        </Card>

        <Card className="animate-rise-2">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300"><BookOpen size={19} /></span>
            <SectionTitle>{L({ ru: 'База знаний', en: 'Knowledge Base' })}</SectionTitle>
            <Lock size={13} className="ml-auto text-ink-300" />
          </div>
          <ReadonlyRow k={{ ru: 'Эмбеддинг-модель', en: 'Embedding model' }} v="TBC (блокер OQ-7)" />
          <ReadonlyRow k={{ ru: 'Чанк', en: 'Chunk size' }} v="~800 tokens" />
          <ReadonlyRow k={{ ru: 'Поиск', en: 'Retrieval' }} v="pgvector HNSW + FTS" />
        </Card>

        <Card className="animate-rise-2 bg-ivory-50 dark:bg-ink-900/60">
          <SectionTitle>{L({ ru: 'Почему тут нельзя ничего менять?', en: 'Why is everything locked?' })}</SectionTitle>
          <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            {L({
              ru: 'По спецификации v1.0 таблицы настроек нет (OQ-15): конфигурация задаётся переменными окружения при деплое. Это исключает случайную поломку продакшена из UI и делает каждую смену параметра проверяемой через CI/CD.',
              en: 'Per the v1.0 spec there is no settings table (OQ-15): configuration comes from environment variables at deploy time. This prevents accidental production breakage from the UI and makes every parameter change reviewable through CI/CD.',
            })}
          </p>
        </Card>
      </div>
    </div>
  )
}
