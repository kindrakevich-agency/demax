import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'
import { PageHeader, Card, SectionTitle, Status } from '../components/ui'
import { CalendarClock, Wallet, Users2, Server, Bot, MonitorSmartphone, Database, ShieldCheck, Rocket, Sparkles, ExternalLink, MessageCircle, Gift, ShoppingBag } from 'lucide-react'

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
            {L({ uk: 'супер-сеньйори — брати Кіндракевичі, повне занурення', ru: 'супер-сеньора — братья Киндракевичи, полное погружение', en: 'super-seniors — the Kindrakevych brothers, fully dedicated' })}
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


      {/* понад ТЗ — те, чого клієнт не замовляв, але що вирішує його задачі */}
      <Card className="animate-rise-2 mb-4 border-copper-500/40">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-copper-600/12 text-copper-700 dark:text-copper-300"><Gift size={19} /></span>
          <div>
            <SectionTitle>{L({ uk: 'Понад технічне завдання', ru: 'Сверх технического задания', en: 'Beyond the specification' })}</SectionTitle>
            <p className="-mt-2 text-xs text-ink-500 dark:text-ink-400">
              {L({
                uk: 'Цього не було у ваших ТЗ — ми додали, бо це прямо працює на ваші задачі. Обидві функції вже живі в цьому демо.',
                ru: 'Этого не было в ваших ТЗ — мы добавили, потому что это прямо работает на ваши задачи. Обе функции уже живые в этом демо.',
                en: 'None of this was in your specifications — we added it because it directly serves your goals. Both features are already live in this demo.',
              })}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            {
              icon: ShoppingBag,
              t: { uk: 'Картки товарів у відповідях', ru: 'Карточки товаров в ответах', en: 'Product cards in answers' } as Bi,
              d: {
                uk: 'Асистент не просто називає засіб — показує фото з каталогу, ціну й посилання на сторінку товару. Клієнт бачить, що саме йому радять, і одразу переходить на сайт.',
                ru: 'Ассистент не просто называет средство — показывает фото из каталога, цену и ссылку на страницу товара. Клиент видит, что именно ему советуют, и сразу переходит на сайт.',
                en: 'The assistant does not merely name a product — it shows the catalogue photo, the price and a link to the product page, so the customer sees what is recommended and goes straight to the site.',
              } as Bi,
            },
            {
              icon: Sparkles,
              t: { uk: 'AI-звіти по системі (⌘K)', ru: 'AI-отчёты по системе (⌘K)', en: 'AI system briefings (⌘K)' } as Bi,
              d: {
                uk: 'Замість рядка пошуку — рядок запитання. Менеджер питає «що зараз важливо?» і отримує персональний брифінг: свої ескалації, черга дипломів, заповнюваність семінарів, прогалини в базі знань.',
                ru: 'Вместо строки поиска — строка вопроса. Менеджер спрашивает «что сейчас важно?» и получает персональный брифинг: свои эскалации, очередь дипломов, заполняемость семинаров, пробелы в базе знаний.',
                en: 'The search bar became a question bar. A manager asks “what matters now?” and gets a personal briefing: their escalations, the diploma queue, seminar fill rates, knowledge gaps.',
              } as Bi,
            },
          ] as { icon: typeof Gift; t: Bi; d: Bi }[]).map((f) => (
            <div key={f.t.en} className="rounded-2xl border border-ink-200/70 p-4 dark:border-ink-700">
              <f.icon size={17} className="mb-2 text-copper-600 dark:text-copper-400" />
              <div className="text-sm font-bold">{L(f.t)}</div>
              <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{L(f.d)}</p>
            </div>
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
                uk: 'Консультант DEMAX побудований на тій самій технології, що й наш власний продукт Polylog: багатомовний AI-асистент з RAG, відповідями лише з бази знань, цитуванням джерел та ескалацією на людину. Ми не винаходимо з нуля — переносимо перевірене. Команда — два брати-програмісти: kindrakevich.com.',
                ru: 'Консультант DEMAX построен на той же технологии, что и наш собственный продукт Polylog: мультиязычный AI-ассистент с RAG, ответами только из базы знаний, цитированием источников и эскалацией на человека. Мы не изобретаем с нуля — переносим проверенное. Команда — два брата-программиста: kindrakevich.com.',
                en: 'The DEMAX consultant is built on the same technology as our own product Polylog: a multilingual AI assistant with RAG, knowledge-grounded answers, source citations and human handoff. We are not inventing from scratch — we are porting the proven. The team — two programmer brothers: kindrakevich.com.',
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
              { uk: 'Команда без накладних витрат: два супер-сеньйори — брати Кіндракевичі, пряма комунікація із замовником, нульова бюрократія.', ru: 'Команда без накладных расходов: два супер-сеньора — братья Киндракевичи, прямая коммуникация с заказчиком, нулевая бюрократия.', en: 'A team with zero overhead: two super-seniors — the Kindrakevych brothers — direct client communication, no bureaucracy.' },
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
    </div>
  )
}
