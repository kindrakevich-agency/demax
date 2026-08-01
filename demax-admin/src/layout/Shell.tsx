import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, MessagesSquare, Flame, BadgeCheck, GraduationCap,
  Megaphone, Activity, BarChart3, UserCog, ScrollText, Settings, Search, Sun, Moon,
  Bell, ChevronDown, FileSpreadsheet, Menu, X, Bot,
} from 'lucide-react'
import { useApp } from '../lib/app'
import type { Bi } from '../lib/app'
import { escalations, verifications } from '../lib/mock'
import AssistantWidget from '../assistant/Widget'

type Item = { to: string; label: Bi; icon: typeof LayoutDashboard; count?: number }

const openEsc = escalations.filter((e) => e.status === 'open' || e.status === 'assigned').length
const pendingVer = verifications.filter((v) => v.status === 'pending').length

const groups: { title: Bi; items: Item[] }[] = [
  {
    title: { ru: 'Обзор', en: 'Overview' },
    items: [
      { to: '/', label: { ru: 'Дашборд', en: 'Dashboard' }, icon: LayoutDashboard },
      { to: '/assistant', label: { ru: 'AI-ассистент', en: 'AI Assistant' }, icon: Bot },
      { to: '/analysis', label: { ru: 'Анализ проекта', en: 'Project Analysis' }, icon: FileSpreadsheet },
    ],
  },
  {
    title: { ru: 'Операции', en: 'Operations' },
    items: [
      { to: '/customers', label: { ru: 'Клиенты', en: 'Customers' }, icon: Users },
      { to: '/conversations', label: { ru: 'Диалоги', en: 'Conversations' }, icon: MessagesSquare },
      { to: '/escalations', label: { ru: 'Эскалации', en: 'Escalations' }, icon: Flame, count: openEsc },
      { to: '/verifications', label: { ru: 'Верификация', en: 'Verification' }, icon: BadgeCheck, count: pendingVer },
    ],
  },
  {
    title: { ru: 'Контент', en: 'Content' },
    items: [
      { to: '/knowledge', label: { ru: 'База знаний', en: 'Knowledge Base' }, icon: BookOpen },
      { to: '/seminars', label: { ru: 'Семинары', en: 'Seminars' }, icon: GraduationCap },
      { to: '/marketing', label: { ru: 'Рассылки', en: 'Campaigns' }, icon: Megaphone },
    ],
  },
  {
    title: { ru: 'Аналитика', en: 'Insights' },
    items: [
      { to: '/ai-monitoring', label: { ru: 'AI-мониторинг', en: 'AI Monitoring' }, icon: Activity },
      { to: '/analytics', label: { ru: 'Аналитика', en: 'Analytics' }, icon: BarChart3 },
    ],
  },
  {
    title: { ru: 'Система', en: 'System' },
    items: [
      { to: '/staff', label: { ru: 'Персонал', en: 'Staff & Roles' }, icon: UserCog },
      { to: '/audit', label: { ru: 'Аудит', en: 'Audit Log' }, icon: ScrollText },
      { to: '/settings', label: { ru: 'Настройки', en: 'Settings' }, icon: Settings },
    ],
  },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { L } = useApp()
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-3 px-6 pt-6 pb-7">
        <div className="flex size-9 items-center justify-center rounded-xl bg-copper-600 font-display text-lg font-bold text-ivory-50 shadow-sm">D</div>
        <div>
          <div className="font-display text-xl leading-none font-semibold tracking-wide text-ink-950 dark:text-ivory-50">DEMAX</div>
          <div className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-copper-600 uppercase dark:text-copper-400">AI Assistant</div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 px-3 pb-6">
        {groups.map((g) => (
          <div key={g.title.en}>
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.18em] text-ink-400 uppercase dark:text-ink-500">{L(g.title)}</div>
            {g.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-copper-600/10 text-copper-800 dark:bg-copper-400/15 dark:text-copper-300'
                      : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ivory-50'
                  }`
                }
              >
                <it.icon size={17} strokeWidth={2} />
                <span className="flex-1">{L(it.label)}</span>
                {it.count ? (
                  <span className="rounded-full bg-copper-600 px-1.5 py-0.5 text-[10px] font-bold text-ivory-50">{it.count}</span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-ink-200/60 px-6 py-4 text-[10px] leading-relaxed text-ink-400 dark:border-ink-700/60 dark:text-ink-500">
        demax.kindrakevich.com
        <br />v1.0 demo · build 2026-08-01
      </div>
    </div>
  )
}

export default function Shell() {
  const { L, lang, setLang, dark, toggleDark, toast } = useApp()
  const [mobileNav, setMobileNav] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const nav = useNavigate()

  return (
    <div className="grain min-h-screen">
      {/* sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-ink-200/60 bg-ivory-50 lg:block dark:border-ink-700/60 dark:bg-ink-900">
        <Sidebar />
      </aside>

      {/* sidebar mobile */}
      {mobileNav && (
        <div className="fixed inset-0 z-80 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileNav(false)} />
          <aside className="animate-rise absolute inset-y-0 left-0 w-72 bg-ivory-50 shadow-pop dark:bg-ink-900">
            <button className="absolute top-5 right-4 text-ink-400" onClick={() => setMobileNav(false)} aria-label="close">
              <X size={20} />
            </button>
            <Sidebar onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* topbar */}
        <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b border-ink-200/60 bg-ivory-100/85 px-4 backdrop-blur-md sm:px-6 dark:border-ink-700/60 dark:bg-ink-950/85">
          <button className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800" onClick={() => setMobileNav(true)} aria-label="menu">
            <Menu size={20} />
          </button>

          <div className="relative max-w-md flex-1">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" />
            <input
              placeholder={L({ ru: 'Поиск: клиенты, статьи, товары…', en: 'Search customers, articles, products…' })}
              className="w-full rounded-full border-transparent bg-white/70 py-2 pr-4 pl-9.5 text-sm shadow-none placeholder:text-ink-400 focus:border-copper-500 focus:bg-white focus:ring-copper-500/25 dark:bg-ink-800/70 dark:text-ivory-100 dark:focus:bg-ink-800"
              onKeyDown={(e) => e.key === 'Enter' && toast({ ru: 'Демо: глобальный поиск', en: 'Demo: global search' })}
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="mr-1 hidden rounded-full border border-copper-500/40 bg-copper-500/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-copper-700 uppercase sm:block dark:text-copper-300">
              Demo
            </span>

            {/* language switch */}
            <div className="flex overflow-hidden rounded-full border border-ink-200 text-xs font-bold dark:border-ink-700">
              {(['ru', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 uppercase transition-colors ${
                    lang === l ? 'bg-ink-900 text-ivory-50 dark:bg-ivory-100 dark:text-ink-900' : 'text-ink-500 hover:text-ink-900 dark:hover:text-ivory-100'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button onClick={toggleDark} className="rounded-full p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ivory-100" aria-label="theme">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              onClick={() => toast({ ru: '3 новых уведомления', en: '3 new notifications' })}
              className="relative rounded-full p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ivory-100"
              aria-label="notifications"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-copper-500 ring-2 ring-ivory-100 dark:ring-ink-950" />
            </button>

            {/* user */}
            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-ink-100 dark:hover:bg-ink-800">
                <span className="flex size-8 items-center justify-center rounded-full bg-copper-600/15 font-display text-xs font-semibold text-copper-700 dark:bg-copper-400/20 dark:text-copper-300">ОК</span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs leading-tight font-bold text-ink-900 dark:text-ivory-100">Ольга Коваль</span>
                  <span className="block text-[10px] leading-tight text-ink-400">{L({ ru: 'Администратор', en: 'Administrator' })}</span>
                </span>
                <ChevronDown size={14} className="text-ink-400" />
              </button>
              {userMenu && (
                <div className="animate-rise absolute right-0 mt-2 w-48 rounded-xl border border-ink-200/60 bg-white p-1.5 shadow-pop dark:border-ink-700 dark:bg-ink-900">
                  {[
                    { b: { ru: 'Мой профиль', en: 'My profile' } as Bi, act: () => { nav('/staff'); } },
                    { b: { ru: 'Настройки', en: 'Settings' } as Bi, act: () => { nav('/settings'); } },
                    { b: { ru: 'Выйти', en: 'Sign out' } as Bi, act: () => toast({ ru: 'Демо: выход отключён', en: 'Demo: sign-out disabled' }) },
                  ].map((m) => (
                    <button
                      key={m.b.en}
                      onClick={() => { setUserMenu(false); m.act() }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                      {L(m.b)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* DEMAX Assistant — Polylog widget ported 1:1, backed by the local RAG */}
      <AssistantWidget />
    </div>
  )
}
