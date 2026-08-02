import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, SectionTitle, Status } from '../components/ui'
import { CalendarClock, Wallet, Users2, Server, Bot, MonitorSmartphone, Database, ShieldCheck, Rocket, Sparkles, ExternalLink, MessageCircle, ShoppingBag, Gauge, TrendingUp, Layers, BookOpen, BarChart3 } from 'lucide-react'

const demoQuestions: Bi[] = [
  { uk: 'Як доглядати за шкірою після пілінгу?', ru: 'Как ухаживать за кожей после пилинга?', en: 'How should I care for skin after a peeling?' },
  { uk: 'Які засоби DEMAX є для проблемної шкіри?', ru: 'Какие средства DEMAX есть для проблемной кожи?', en: 'Which DEMAX products are for problem skin?' },
  { uk: 'Які засоби для догляду за тілом є у DEMAX?', ru: 'Какие средства для ухода за телом есть у DEMAX?', en: 'What body-care products does DEMAX have?' },
  { uk: 'Які семінари DEMAX проводить для косметологів?', ru: 'Какие семинары DEMAX проводит для косметологов?', en: 'What seminars does DEMAX run for cosmetologists?' },
  { uk: 'Навіщо потрібен SPF і які засоби із захистом є у DEMAX?', ru: 'Зачем нужен SPF и какие средства с защитой есть у DEMAX?', en: 'Why is SPF needed and which DEMAX products have it?' },
  { uk: 'Чим професійна лінійка DEMAX відрізняється від домашнього догляду?', ru: 'Чем профессиональная линейка DEMAX отличается от домашнего ухода?', en: 'How does the DEMAX professional line differ from home care?' },
  { uk: 'Які пептидні засоби пропонує DEMAX?', ru: 'Какие пептидные средства предлагает DEMAX?', en: 'Which peptide products does DEMAX offer?' },
  { uk: 'Який крем DEMAX підійде для сухої шкіри взимку?', ru: 'Какой крем DEMAX подойдёт для сухой кожи зимой?', en: 'Which DEMAX cream suits dry skin in winter?' },
  { uk: 'Що таке карбокситерапія і як вона працює?', ru: 'Что такое карбокситерапия и как она работает?', en: 'What is carboxytherapy and how does it work?' },
  { uk: 'Розкажи про лінійку Anti-Age', ru: 'Расскажи про линейку Anti-Age', en: 'Tell me about the Anti-Age line' },
]

const workstreams: { icon: typeof Server; name: Bi; scope: Bi; days: string }[] = [
  { icon: Server, name: { uk: 'Backend (FastAPI + PostgreSQL)', ru: 'Backend (FastAPI + PostgreSQL)', en: 'Backend (FastAPI + PostgreSQL)' }, scope: { uk: '84 ендпоінти, 19 таблиць, аудит, ідемпотентність, RBAC, GDPR', ru: '84 эндпоинта, 19 таблиц, аудит, идемпотентность, RBAC, GDPR', en: '84 endpoints, 19 tables, audit, idempotency, RBAC, GDPR' }, days: '55–65' },
  { icon: Bot, name: { uk: 'AI-підсистема (RAG)', ru: 'AI-подсистема (RAG)', en: 'AI subsystem (RAG)' }, scope: { uk: 'pgvector + FTS, цитати, пороги впевненості, ескалації, eval', ru: 'pgvector + FTS, цитаты, пороги уверенности, эскалации, eval', en: 'pgvector + FTS, citations, confidence gates, escalation, evals' }, days: '18–22' },
  { icon: MonitorSmartphone, name: { uk: 'Telegram-бот', ru: 'Telegram-бот', en: 'Telegram bot' }, scope: { uk: 'OTP-реєстрація, меню, семінари, каталог, верифікація, чат', ru: 'OTP-регистрация, меню, семинары, каталог, верификация, чат', en: 'OTP sign-up, menus, seminars, catalog, verification, chat' }, days: '14–18' },
  { icon: Database, name: { uk: 'Адмін-панель (SPA)', ru: 'Админ-панель (SPA)', en: 'Admin panel (SPA)' }, scope: { uk: '12 модулів, ~30 екранів, ru/en, світла й темна теми', ru: '12 модулей, ~30 экранов, ru/en, светлая и тёмная темы', en: '12 modules, ~30 screens, ru/en, light & dark themes' }, days: '45–55' },
  { icon: ShieldCheck, name: { uk: 'DevOps + QA', ru: 'DevOps + QA', en: 'DevOps + QA' }, scope: { uk: 'CI/CD, моніторинг, бекапи PITR, E2E + AI-eval у пайплайні', ru: 'CI/CD, мониторинг, бэкапы PITR, E2E + AI-eval в пайплайне', en: 'CI/CD, monitoring, PITR backups, E2E + AI-eval in the pipeline' }, days: '30–38' },
]

const weeks: { w: string; title: Bi; items: Bi }[] = [
  { w: '1–2', title: { uk: 'Фундамент', ru: 'Фундамент', en: 'Foundation' }, items: { uk: 'Схема БД, auth (OTP/JWT/MFA), каркас API, CI/CD, середовища, вибір ембединг-моделі', ru: 'Схема БД, auth (OTP/JWT/MFA), каркас API, CI/CD, среды, выбор эмбеддинг-модели', en: 'DB schema, auth (OTP/JWT/MFA), API skeleton, CI/CD, environments, embedding model decision' } },
  { w: '3–4', title: { uk: 'Ядро', ru: 'Ядро', en: 'Core' }, items: { uk: 'Бот: реєстрація та меню · RAG v1 з цитатами · адмінка: база знань, клієнти, ескалації', ru: 'Бот: регистрация и меню · RAG v1 с цитатами · админка: база знаний, клиенты, эскалации', en: 'Bot: sign-up & menus · RAG v1 with citations · admin: KB, customers, escalations' } },
  { w: '5–6', title: { uk: 'Бізнес-флоу', ru: 'Бизнес-флоу', en: 'Business flows' }, items: { uk: 'Семінари з контролем місць, верифікація дипломів, каталоги, розсилки з тротлінгом', ru: 'Семинары с контролем мест, верификация дипломов, каталоги, рассылки с тротлингом', en: 'Seminars with seat control, diploma verification, catalogs, throttled broadcasts' } },
  { w: '7', title: { uk: 'Аналітика та полірування', ru: 'Аналитика и полировка', en: 'Analytics & polish' }, items: { uk: 'Дашборд, AI-моніторинг, аудит-в’юер, i18n, темна тема, наповнення бази знань', ru: 'Дашборд, AI-мониторинг, аудит-вьюер, i18n, тёмная тема, наполнение базы знаний', en: 'Dashboard, AI monitoring, audit viewer, i18n, dark theme, KB content load' } },
  { w: '8', title: { uk: 'Запуск', ru: 'Запуск', en: 'Launch' }, items: { uk: 'E2E + AI-eval, навантажувальний тест 50 rps, security-чек, прод-чекліст, go-live', ru: 'E2E + AI-eval, нагрузочный тест 50 rps, security-чек, прод-чеклист, go-live', en: 'E2E + AI-eval, 50 rps load test, security check, production checklist, go-live' } },
]

export default function Analysis() {
  const { L } = useApp()
  return (
    <div>
      <PageHeader
        title={{ uk: 'Аналіз проєкту DEMAX AI Assistant', ru: 'Анализ проекта DEMAX AI Assistant', en: 'DEMAX AI Assistant — Project Analysis' }}
        subtitle={{ uk: 'Оцінка на основі 5 специфікацій: SAD v2.1 · DBSPEC · API v1.1 · Admin Panel v1.2 · Deployment v1.2', ru: 'Оценка на основе 5 спецификаций: SAD v2.1 · DBSPEC · API v1.1 · Admin Panel v1.2 · Deployment v1.2', en: 'Based on 5 specifications: SAD v2.1 · DBSPEC · API v1.1 · Admin Panel v1.2 · Deployment v1.2' }}
      />

      {/* hero numbers */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="animate-rise relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-copper-500 to-copper-300" />
          <CalendarClock size={20} className="mb-3 text-copper-600 dark:text-copper-400" />
          <div className="font-display text-4xl font-semibold text-ink-950 dark:text-ivory-50">
            2 <span className="text-xl">{L({ uk: 'місяці', ru: 'месяца', en: 'months' })}</span>
          </div>
          <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">{L({ uk: 'до продакшену', ru: 'до продакшена', en: 'to production' })}</div>
        </Card>
        <Card className="animate-rise-1 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-copper-500 to-copper-300" />
          <Wallet size={20} className="mb-3 text-copper-600 dark:text-copper-400" />
          <div className="font-display text-4xl font-semibold text-ink-950 dark:text-ivory-50">$25K</div>
          <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {L({ uk: 'фікс-прайс — у 6 разів нижче за ринкову оцінку ($140–170K)', ru: 'фикс-прайс — в 6 раз ниже рыночной оценки ($140–170K)', en: 'fixed price — 6× below the market estimate ($140–170K)' })}
          </div>
        </Card>
        <Card className="animate-rise-2 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-copper-500 to-copper-300" />
          <Users2 size={20} className="mb-3 text-copper-600 dark:text-copper-400" />
          <div className="font-display text-4xl font-semibold text-ink-950 dark:text-ivory-50">2</div>
          <div className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {L({ uk: 'senior-інженери на проєкті — без прошарку менеджерів і передачі задач', ru: 'senior-инженера на проекте — без прослойки менеджеров и передачи задач', en: 'senior engineers on the project — no manager layer, no task handoffs' })}
          </div>
          <a
            href="https://kindrakevich.com"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-copper-700 hover:underline dark:text-copper-300"
          >
            kindrakevich.com <ExternalLink size={11} />
          </a>
        </Card>
      </div>

      {/* live demo: ask the real RAG consultant */}
      <Card className="animate-rise-1 mb-4 border-copper-500/40">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-copper-600/12 text-copper-700 dark:text-copper-300"><MessageCircle size={19} /></span>
          <div>
            <SectionTitle>{L({ uk: 'Живе демо: запитайте AI-консультанта', ru: 'Живое демо: спросите AI-консультанта', en: 'Live demo: ask the AI consultant' })}</SectionTitle>
            <p className="-mt-2 text-xs text-ink-500 dark:text-ink-400">
              {L({
                uk: 'Це не макет — реальний RAG на цьому стенді: каталог DEMAX 2021 + увесь сайт demax.com.ua. Клікніть на запитання — консультант відкриється й відповість.',
                ru: 'Это не мокап — реальный RAG на этом стенде: каталог DEMAX 2021 + весь сайт demax.com.ua. Кликните вопрос — консультант откроется и ответит.',
                en: 'Not a mock — a real RAG on this stand: the DEMAX 2021 catalog + the whole demax.com.ua site. Click a question — the consultant opens and answers.',
              })}
            </p>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {demoQuestions.map((q) => (
            <button
              key={q.en}
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('demax-assistant-ask', { detail: L(q) }))}
              className="rounded-2xl border border-ink-200/70 bg-ivory-50 px-4 py-3 text-left text-sm leading-snug text-ink-700 transition-all hover:-translate-y-0.5 hover:border-copper-500 hover:text-copper-800 hover:shadow-card dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-copper-400 dark:hover:text-copper-300"
            >
              {L(q)}
            </button>
          ))}
        </div>
      </Card>







      {/* Polylog — the proven platform this assistant is built on */}
      <Card className="animate-rise-2 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-copper-600/12"><Sparkles size={20} className="text-copper-700 dark:text-copper-300" /></span>
          <div className="min-w-64 flex-1">
            <SectionTitle>{L({ uk: 'Готова AI-платформа — вже в нашому портфелі', ru: 'Готовая AI-платформа — уже в нашем портфеле', en: 'A production AI platform — already in our portfolio' })}</SectionTitle>
            <p className="-mt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {L({
                uk: 'Консультант DEMAX побудований на тій самій технології, що й наш власний продукт Polylog: багатомовний AI-асистент з RAG, гібридним пошуком і перевіркою, що відповідь спирається на джерела, а не вигадана. Ми не винаходимо з нуля — переносимо перевірене в продакшені. Над проєктом працюють двоє senior-інженерів; веде його Віталій Кіндракевич, засновник DevMotion Studio: 10+ років у веб-розробці, 40+ проєктів у продакшені, щоденна робота з AI із 2024 року.',
                ru: 'Консультант DEMAX построен на той же технологии, что и наш собственный продукт Polylog: мультиязычный AI-ассистент с RAG, гибридным поиском и проверкой, что ответ опирается на источники, а не выдуман. Мы не изобретаем с нуля — переносим проверенное в продакшене. Над проектом работают двое senior-инженеров; ведёт его Виталий Киндракевич, основатель DevMotion Studio: 10+ лет в веб-разработке, 40+ проектов в продакшене, ежедневная работа с AI с 2024 года.',
                en: 'The DEMAX consultant is built on the same technology as our own product Polylog: a multilingual AI assistant with RAG, hybrid retrieval and a groundedness check that blocks answers not supported by sources. We are not inventing from scratch — we are porting what already runs in production. Two senior engineers work on the project, led by Vitalii Kindrakevych, founder of DevMotion Studio: 10+ years in web development, 40+ production projects, working with AI daily since 2024.',
              })}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2">
            <a
              href="https://polylog.devmotion.studio/en"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-copper-600 px-4.5 py-2 text-sm font-semibold text-ivory-50 shadow-sm transition-all hover:bg-copper-700 active:scale-[.98]"
            >
              polylog.devmotion.studio <ExternalLink size={14} />
            </a>
            <a
              href="https://kindrakevich.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-copper-600/50 px-4.5 py-2 text-sm font-semibold text-copper-700 transition-all hover:border-copper-600 hover:bg-copper-600/10 active:scale-[.98] dark:text-copper-300"
            >
              kindrakevich.com <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* workstreams */}
        <Card className="animate-rise-1 lg:col-span-3" pad={false}>
          <div className="px-5 pt-5 pb-2">
            <SectionTitle>{L({ uk: 'Обсяг робіт', ru: 'Объём работ', en: 'Scope of work' })}</SectionTitle>
          </div>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {workstreams.map((w) => (
              <div key={w.name.en} className="flex items-center gap-4 px-5 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-copper-600/10 text-copper-700 dark:bg-copper-400/15 dark:text-copper-300">
                  <w.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{L(w.name)}</div>
                  <div className="truncate text-xs text-ink-500 dark:text-ink-400">{L(w.scope)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-ink-900 dark:text-ivory-100">{w.days}</div>
                  <div className="text-[10px] tracking-wider text-ink-400 uppercase">{L({ uk: 'люд.-днів', ru: 'чел.-дней', en: 'p-days' })}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-ink-200/70 px-5 py-4 dark:border-ink-700/70">
            <span className="text-sm font-bold">{L({ uk: 'Разом', ru: 'Итого', en: 'Total' })}</span>
            <span className="font-display text-xl font-semibold text-copper-700 dark:text-copper-300">≈ 180 {L({ uk: 'люд.-днів', ru: 'чел.-дней', en: 'person-days' })}</span>
          </div>
        </Card>

        {/* timeline */}
        <Card className="animate-rise-2 lg:col-span-2">
          <SectionTitle>{L({ uk: 'План: 8 тижнів', ru: 'План: 8 недель', en: 'Plan: 8 weeks' })}</SectionTitle>
          <ol className="relative space-y-5 border-l border-ink-200 pl-5 dark:border-ink-700">
            {weeks.map((wk, i) => (
              <li key={wk.w}>
                <span className={`absolute -left-[9px] flex size-[17px] items-center justify-center rounded-full text-[8px] font-bold ${i === weeks.length - 1 ? 'bg-sage-500 text-white' : 'bg-copper-600 text-ivory-50'}`}>
                  {i === weeks.length - 1 ? <Rocket size={9} /> : i + 1}
                </span>
                <div className="text-[10px] font-bold tracking-widest text-copper-700 uppercase dark:text-copper-300">
                  {L({ uk: 'Тижні', ru: 'Недели', en: 'Weeks' })} {wk.w}
                </div>
                <div className="text-sm font-bold">{L(wk.title)}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{L(wk.items)}</p>
              </li>
            ))}
          </ol>
        </Card>

      {/* why cheaper */}
        <Card className="animate-rise-2 lg:col-span-3">
          <SectionTitle>{L({ uk: 'Чому у 6 разів дешевше і у 3 рази швидше', ru: 'Почему в 6 раз дешевле и в 3 раза быстрее', en: 'Why 6× cheaper and 3× faster' })}</SectionTitle>
          <ul className="space-y-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            {([
              { uk: 'AI-ядро не пишеться з нуля: у нас є власна платформа Polylog (RAG, багатомовність, ескалації) — переносимо готове, що знімає найдорожчий блок робіт.', ru: 'AI-ядро не пишется с нуля: у нас есть собственная платформа Polylog (RAG, мультиязычность, эскалации) — переносим готовое, что снимает самый дорогой блок работ.', en: 'The AI core is not written from scratch: our own Polylog platform (RAG, multilingual, escalations) is ported in, removing the most expensive workstream.' },
              { uk: 'Специфікації вже готові та узгоджені між собою — фаза discovery не потрібна, контракти API і схема БД описані до рівня DDL.', ru: 'Спецификации уже готовы и согласованы между собой — фаза discovery не нужна, контракты API и схема БД описаны до уровня DDL.', en: 'The specifications are complete and mutually consistent — no discovery phase; API contracts and the DB schema are specified down to DDL.' },
              { uk: 'AI-інструменти розробки: генерація типового коду (84 ендпоінти, 30 екранів) пришвидшується у 3–4 рази зі збереженням senior-контролю якості.', ru: 'AI-инструменты разработки: генерация типового кода (84 эндпоинта, 30 экранов) ускоряется в 3–4 раза при сохранении senior-контроля качества.', en: 'AI-assisted development: boilerplate-heavy work (84 endpoints, 30 screens) accelerates 3–4× while seniors keep quality control.' },
              { uk: 'Ця демо-панель і живий RAG-консультант — уже працюючий фундамент: дизайн-система, i18n, теми, 12 модулів та проіндексована база знань DEMAX.', ru: 'Эта демо-панель и живой RAG-консультант — уже работающий фундамент: дизайн-система, i18n, темы, 12 модулей и проиндексированная база знаний DEMAX.', en: 'This demo panel and the live RAG consultant are already a working foundation: design system, i18n, themes, 12 modules and an indexed DEMAX knowledge base.' },
              { uk: 'Команда без накладних витрат: двоє senior-інженерів, пряма комунікація із замовником, нульова бюрократія — архітектура вже спланована у ТЗ, тож ті самі люди реалізують специфікацію, пишуть код і випускають реліз, без прошарку менеджерів і передачі задач.', ru: 'Команда без накладных расходов: двое senior-инженеров, прямая коммуникация с заказчиком, нулевая бюрократия — архитектура уже спланирована в ТЗ, поэтому те же люди реализуют спецификацию, пишут код и выпускают релиз, без прослойки менеджеров и передачи задач.', en: 'A team with zero overhead: two senior engineers, direct client communication, no bureaucracy — the architecture is already specified, so the same people implement the spec, write the code and ship the release, with no manager layer and no task handoffs.' },
            ] as Bi[]).map((b, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-copper-500" />
                {L(b)}
              </li>
            ))}
          </ul>
        </Card>

        {/* blockers */}
        <Card className="animate-rise-3 lg:col-span-2">
          <SectionTitle>{L({ uk: 'Що вирішуємо на тижні 1', ru: 'Что решаем на неделе 1', en: 'Decided in week 1' })}</SectionTitle>
          <div className="space-y-3">
            {([
              { s: 'pending', t: { uk: 'Ембединг-модель і розмірність вектора (блокер бази знань)', ru: 'Эмбеддинг-модель и размерность вектора (блокер базы знаний)', en: 'Embedding model & vector dimension (KB blocker)' } },
              { s: 'pending', t: { uk: 'Надійність фонових задач: outbox чи durable Redis', ru: 'Надёжность фоновых задач: outbox или durable Redis', en: 'Job durability: outbox vs durable Redis' } },
              { s: 'pending', t: { uk: 'Хостинг і резиденція даних (ЄС / Україна)', ru: 'Хостинг и резиденция данных (ЕС / Украина)', en: 'Hosting & data residency (EU / Ukraine)' } },
              { s: 'approved', t: { uk: 'Стек фронтенду: React + TS + Tailwind — уже обрано (це демо)', ru: 'Стек фронтенда: React + TS + Tailwind — уже выбран (эта демо)', en: 'Frontend stack: React + TS + Tailwind — already chosen (this demo)' } },
            ] as { s: string; t: Bi }[]).map((b, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <Status s={b.s} />
                <span className="text-ink-600 dark:text-ink-300">{L(b.t)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-400 dark:border-ink-800">
            {L({
              uk: 'Інфраструктура після запуску: ≈ $400–700/міс (хмара + LLM API). Підтримка та розвиток — за окремим ретейнером.',
              ru: 'Инфраструктура после запуска: ≈ $400–700/мес (облако + LLM API). Поддержка и развитие — по отдельному ретейнеру.',
              en: 'Post-launch infrastructure: ≈ $400–700/mo (cloud + LLM API). Support & evolution under a separate retainer.',
            })}
          </p>
        </Card>
      </div>

      {/* окремий скоуп: вітрина на Next.js, товари переїжджають у нашу адмінку */}
      <Card className="animate-rise-3 mt-4 border-copper-500/40 lg:col-span-5">
        <div className="mb-5 flex flex-wrap items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-copper-600/12 text-copper-700 dark:text-copper-300"><ShoppingBag size={19} /></span>
          <div className="min-w-64 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle>{L({ uk: 'Новий сайт: вітрина на Next.js, товари — у цій же адмінці', ru: 'Новый сайт: витрина на Next.js, товары — в этой же админке', en: 'A new site: Next.js storefront, products in this same admin' })}</SectionTitle>
              <span className="mb-3 rounded-full border border-copper-500/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-copper-700 uppercase dark:text-copper-300">
                {L({ uk: 'окремий проєкт', ru: 'отдельный проект', en: 'separate project' })}
              </span>
            </div>
            <p className="-mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {L({
                uk: 'WordPress прибирається повністю. Каталог, контент і замовлення живуть у нашій базі, вітрина — Next.js. Головний виграш не в технології: товари стають рідним джерелом для AI, а продажі опиняються в тій самій панелі, де клієнти, діалоги й семінари.',
                ru: 'WordPress убирается полностью. Каталог, контент и заказы живут в нашей базе, витрина — Next.js. Главный выигрыш не в технологии: товары становятся родным источником для AI, а продажи оказываются в той же панели, где клиенты, диалоги и семинары.',
                en: 'WordPress goes away entirely. Catalog, content and orders live in our database; the storefront is Next.js. The gain is not the technology: products become a native source for the AI, and sales end up in the same panel as customers, conversations and seminars.',
              })}
            </p>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { icon: Sparkles, t: { uk: 'AI бачить каталог одразу', ru: 'AI видит каталог сразу', en: 'The AI sees the catalog instantly' }, d: { uk: 'Зараз консультант зчитує сайт і бореться з чужою розміткою — саме через це фото товарів бралися з каруселі «схожі товари». Коли товар у нашій базі, зміна ціни чи опису доступна асистенту тієї ж миті, без переіндексації.', ru: 'Сейчас консультант считывает сайт и борется с чужой разметкой — именно поэтому фото товаров брались из карусели «похожие товары». Когда товар в нашей базе, изменение цены или описания доступно ассистенту в тот же момент, без переиндексации.', en: 'Today the consultant scrapes the site and fights someone else’s markup — that is exactly why product photos were pulled from the “related products” carousel. With products in our database, a price or copy change reaches the assistant instantly, with no re-indexing.' } },
            { icon: TrendingUp, t: { uk: 'Продажі під контролем', ru: 'Продажи под контролем', en: 'Sales under control' }, d: { uk: 'Замовлення, залишки, оптові ціни для косметологів, промокоди й партнерська програма — в одній панелі з клієнтами. Профіль 360° нарешті стає повним: розмови з AI, семінари й покупки в одному місці.', ru: 'Заказы, остатки, оптовые цены для косметологов, промокоды и партнёрская программа — в одной панели с клиентами. Профиль 360° наконец становится полным: разговоры с AI, семинары и покупки в одном месте.', en: 'Orders, stock, wholesale pricing for cosmetologists, promo codes and the affiliate programme sit in the same panel as customers. The 360° profile finally becomes complete: AI conversations, seminars and purchases in one place.' } },
            { icon: Gauge, t: { uk: 'Швидкість замість 2,2 секунди', ru: 'Скорость вместо 2,2 секунды', en: 'Speed instead of 2.2 seconds' }, d: { uk: 'Ми зміряли поточний сайт: 2,2 с до першого байта і 418 КБ на головній. Статична генерація з миттєвою ревалідацією дає десятки мілісекунд — це прямо впливає на позиції та конверсію.', ru: 'Мы измерили текущий сайт: 2,2 с до первого байта и 418 КБ на главной. Статическая генерация с мгновенной ревалидацией даёт десятки миллисекунд — это прямо влияет на позиции и конверсию.', en: 'We measured the current site: 2.2 s to first byte and 418 KB on the home page. Static generation with instant revalidation gives tens of milliseconds — that moves rankings and conversion directly.' } },
            { icon: ShieldCheck, t: { uk: 'Зникає найбільша поверхня атаки', ru: 'Исчезает крупнейшая поверхность атаки', en: 'The largest attack surface disappears' }, d: { uk: 'Разом із WordPress іде набір плагінів, кожен із яких — окреме джерело вразливостей і оновлень. Лишається один застосунок, який ми контролюємо повністю.', ru: 'Вместе с WordPress уходит набор плагинов, каждый из которых — отдельный источник уязвимостей и обновлений. Остаётся одно приложение, которое мы контролируем полностью.', en: 'WordPress takes its plugin stack with it — each one a separate source of vulnerabilities and updates. What remains is a single application we control end to end.' } },
          ] as { icon: typeof Server; t: Bi; d: Bi }[]).map((b, i) => (
            <div key={i} className="rounded-2xl border border-ink-200/70 p-4 dark:border-ink-700">
              <b.icon size={17} className="mb-2 text-copper-600 dark:text-copper-400" />
              <div className="mb-1 text-sm font-bold text-ink-900 dark:text-ivory-100">{L(b.t)}</div>
              <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">{L(b.d)}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/60">
          <div className="mb-2 text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-ink-400">
            {L({ uk: 'Що ми вже зміряли на вашому сайті', ru: 'Что мы уже измерили на вашем сайте', en: 'What we already measured on your site' })}
          </div>
          <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">
            {L({
              uk: '86 товарів (43 × дві мови), 13 категорій, 39 сторінок, 36 статей і два власні типи контенту. Атрибути вже нормалізовані як таксономії — об’єм, лінія догляду, проблема, тип шкіри, тип товару, — тож фасетні фільтри будуються на готовій структурі. Каталог переноситься імпортом, а не руками.',
              ru: '86 товаров (43 × два языка), 13 категорий, 39 страниц, 36 статей и два собственных типа контента. Атрибуты уже нормализованы как таксономии — объём, линия ухода, проблема, тип кожи, тип товара, — поэтому фасетные фильтры строятся на готовой структуре. Каталог переносится импортом, а не руками.',
              en: '86 products (43 × two languages), 13 categories, 39 pages, 36 posts and two custom content types. Attributes are already normalised as taxonomies — volume, care line, concern, skin type, product type — so faceted filtering builds on an existing structure. The catalog migrates by import, not by hand.',
            })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-[11px] font-bold tracking-widest text-copper-700 uppercase dark:text-copper-300">
              {L({ uk: 'Що треба врахувати чесно', ru: 'Что нужно учесть честно', en: 'What must be accounted for honestly' })}
            </div>
            <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {L({
                uk: 'Разом із WordPress зникає й те, що він робив мовчки: платіжний шлюз, Нова Пошта з накладними, фіскалізація ПРРО, партнерська програма з реальними виплатами, відгуки та історія замовлень. Це не ризик, а перелік робіт — але він має бути в кошторисі від початку, інакше домовимося про вітрину, а зіткнемося з магазином.',
                ru: 'Вместе с WordPress исчезает и то, что он делал молча: платёжный шлюз, Новая Почта с накладными, фискализация ПРРО, партнёрская программа с реальными выплатами, отзывы и история заказов. Это не риск, а перечень работ — но он должен быть в смете с самого начала, иначе договоримся о витрине, а столкнёмся с магазином.',
                en: 'WordPress also takes with it everything it did quietly: the payment gateway, Nova Poshta with waybills, fiscal receipts (PRRO), the affiliate programme with real payouts, reviews and order history. That is not a risk but a work list — and it belongs in the estimate from the start, or we agree on a storefront and meet a shop.',
              })}
            </p>
          </div>
          <div>
            <div className="mb-2 text-[11px] font-bold tracking-widest text-copper-700 uppercase dark:text-copper-300">
              {L({ uk: 'Обсяг і порядок робіт', ru: 'Объём и порядок работ', en: 'Scope and sequence' })}
            </div>
            <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {L({
                uk: 'Вітрина, каталог, контент і SEO-міграція зі збереженням URL — 55–70 людино-днів. Комерційний бекенд: замовлення, оплата, доставка, ПРРО, склад, промо, партнерка — ще 60–90. Разом 120–160 людино-днів, тобто 3–4 місяці вдвох, приблизно $17–22K окремо від $25K. Старий сайт вимикається лише після того, як нова комерція відпрацює на реальних замовленнях.',
                ru: 'Витрина, каталог, контент и SEO-миграция с сохранением URL — 55–70 человеко-дней. Коммерческий бэкенд: заказы, оплата, доставка, ПРРО, склад, промо, партнёрка — ещё 60–90. Итого 120–160 человеко-дней, то есть 3–4 месяца вдвоём, примерно $17–22K отдельно от $25K. Старый сайт выключается только после того, как новая коммерция отработает на реальных заказах.',
                en: 'Storefront, catalog, content and a URL-preserving SEO migration — 55–70 person-days. The commerce backend — orders, payments, shipping, fiscal receipts, stock, promotions, affiliates — another 60–90. That is 120–160 person-days in total: 3–4 months for the two of us, roughly $17–22K on top of the $25K. The old site is switched off only after the new commerce has handled real orders.',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* усе, що можемо зробити понад ТЗ — окремо від ціни, у самому низу */}
      <Card className="animate-rise-3 mt-4 lg:col-span-5">
        <div className="mb-5 flex flex-wrap items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-copper-600/12 text-copper-700 dark:text-copper-300"><Layers size={19} /></span>
          <div className="min-w-64 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle>{L({ uk: 'Що ще можемо зробити', ru: 'Что ещё можем сделать', en: 'What else we can do' })}</SectionTitle>
              <span className="mb-3 rounded-full border border-copper-500/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-copper-700 uppercase dark:text-copper-300">
                {L({ uk: 'не входить у ціну', ru: 'не входит в цену', en: 'not included in the price' })}
              </span>
            </div>
            <p className="-mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {L({
                uk: 'Це не входить у 2 місяці та $25K і не є обіцянкою — це напрями, які ми вміємо робити й пропонуємо обговорити. Задачі непрості, кожна оцінюється окремо; перші дві вже показані в цьому демо, щоб було видно, як вони виглядають у роботі.',
                ru: 'Это не входит в 2 месяца и $25K и не является обещанием — это направления, которые мы умеем делать и предлагаем обсудить. Задачи непростые, каждая оценивается отдельно; первые две уже показаны в этом демо, чтобы было видно, как они выглядят в работе.',
                en: 'None of this is part of the 2 months and $25K, and none of it is a promise — these are directions we know how to build and would like to discuss. The work is non-trivial and each item is quoted separately; the first two are already demonstrated here so you can see how they behave.',
              })}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            {
              icon: ShoppingBag, shown: true,
              t: { uk: 'Картки товарів у відповідях', ru: 'Карточки товаров в ответах', en: 'Product cards in answers' } as Bi,
              d: {
                uk: 'Асистент не просто називає засіб — показує фото з каталогу, ціну й посилання на сторінку товару.',
                ru: 'Ассистент не просто называет средство — показывает фото из каталога, цену и ссылку на страницу товара.',
                en: 'The assistant does not merely name a product — it shows the catalogue photo, the price and a link to the page.',
              } as Bi,
            },
            {
              icon: Sparkles, shown: true,
              t: { uk: 'AI-звіти по системі (⌘K)', ru: 'AI-отчёты по системе (⌘K)', en: 'AI system briefings (⌘K)' } as Bi,
              d: {
                uk: 'Замість рядка пошуку — рядок запитання: менеджер питає «що зараз важливо?» і отримує персональний брифінг.',
                ru: 'Вместо строки поиска — строка вопроса: менеджер спрашивает «что сейчас важно?» и получает персональный брифинг.',
                en: 'The search bar became a question bar: a manager asks “what matters now?” and gets a personal briefing.',
              } as Bi,
            },
            {
              icon: Gauge,
              t: { uk: 'Швидкий і захищений сайт', ru: 'Быстрый и защищённый сайт', en: 'A fast, secured site' } as Bi,
              d: {
                uk: 'Заміри 01.08.2026: головна віддається 2,2 с до першого байта (норма Google — до 0,8) і важить 418 КБ, жодного заголовка безпеки. Вітрина переїжджає на Next.js, WordPress прибирається повністю — деталі у блоці вище.',
                ru: 'Замеры 01.08.2026: главная отдаётся 2,2 с до первого байта (норма Google — до 0,8) и весит 418 КБ, ни одного заголовка безопасности. Витрина переезжает на Next.js, WordPress убирается полностью — детали в блоке выше.',
                en: 'Measured 01.08.2026: the homepage takes 2.2 s to first byte (Google’s bar is 0.8) and weighs 418 KB, with not one security header. The storefront moves to Next.js and WordPress goes away entirely — details in the block above.',
              } as Bi,
            },
            {
              icon: TrendingUp,
              t: { uk: 'Консультант для покупців', ru: 'Консультант для покупателей', en: 'Consultant for shoppers' } as Bi,
              d: {
                uk: 'Той самий асистент на demax.com.ua як продавець: підбір за типом шкіри, картки товарів, шлях у кошик, опт — менеджеру.',
                ru: 'Тот же ассистент на demax.com.ua как продавец: подбор по типу кожи, карточки товаров, путь в корзину, опт — менеджеру.',
                en: 'The same assistant on demax.com.ua as a salesperson: matching by skin type, product cards, a path to the cart, wholesale to a manager.',
              } as Bi,
            },
            {
              icon: MessageCircle,
              t: { uk: 'Нові канали спілкування', ru: 'Новые каналы общения', en: 'More channels' } as Bi,
              d: {
                uk: 'WhatsApp, Instagram Direct і Viber поверх того самого ядра — архітектура вже канал-незалежна.',
                ru: 'WhatsApp, Instagram Direct и Viber поверх того же ядра — архитектура уже канал-независимая.',
                en: 'WhatsApp, Instagram Direct and Viber on the same core — the architecture is already channel-independent.',
              } as Bi,
            },
            {
              icon: BookOpen,
              t: { uk: 'База знань, що росте сама', ru: 'База знаний, растущая сама', en: 'A self-growing knowledge base' } as Bi,
              d: {
                uk: 'Питання без відповіді групуються за темами, асистент готує чернетки статей — адміністратору лишається вичитати.',
                ru: 'Вопросы без ответа группируются по темам, ассистент готовит черновики статей — администратору остаётся вычитать.',
                en: 'Unanswered questions cluster into topics and the assistant drafts the articles — the administrator only reviews.',
              } as Bi,
            },
            {
              icon: Database,
              t: { uk: 'Інтеграція з обліковою системою', ru: 'Интеграция с учётной системой', en: 'Accounting-system integration' } as Bi,
              d: {
                uk: 'Залишки, ціни та статуси замовлень. У ТЗ це свідомо поза MVP, але архітектура під це готова.',
                ru: 'Остатки, цены и статусы заказов. В ТЗ это сознательно вне MVP, но архитектура под это готова.',
                en: 'Stock, prices and order statuses. The specification keeps this out of the MVP, but the architecture is ready.',
              } as Bi,
            },
            {
              icon: BarChart3,
              t: { uk: 'Аналітика продажів', ru: 'Аналитика продаж', en: 'Sales analytics' } as Bi,
              d: {
                uk: 'Які питання ведуть до покупки, які теми лишаються без відповіді й скільки виручки приносить асистент.',
                ru: 'Какие вопросы ведут к покупке, какие темы остаются без ответа и сколько выручки приносит ассистент.',
                en: 'Which questions lead to a purchase, which topics stay unanswered, and how much revenue the assistant brings.',
              } as Bi,
            },
          ] as { icon: typeof Gauge; t: Bi; d: Bi; shown?: boolean }[]).map((f) => (
            <div key={f.t.en} className="relative rounded-2xl border border-ink-200/70 p-4 dark:border-ink-700">
              {f.shown && (
                <span className="absolute top-3 right-3 rounded-full bg-sage-100 px-2 py-0.5 text-[9px] font-bold tracking-wide text-sage-700 uppercase dark:bg-sage-700/25 dark:text-sage-400">
                  {L({ uk: 'у демо', ru: 'в демо', en: 'in demo' })}
                </span>
              )}
              <f.icon size={17} className="mb-2 text-copper-600 dark:text-copper-400" />
              <div className="pr-14 text-sm font-bold">{L(f.t)}</div>
              <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{L(f.d)}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-400 dark:border-ink-800">
          {L({
            uk: 'Готові порахувати будь-який із напрямів після демо — окремим кошторисом і окремими строками.',
            ru: 'Готовы посчитать любое из направлений после демо — отдельной сметой и отдельными сроками.',
            en: 'We are ready to scope any of these after the demo — separate estimate, separate timeline.',
          })}
        </p>
      </Card>
    </div>
  )
}
