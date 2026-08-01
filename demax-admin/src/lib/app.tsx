import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'uk' | 'ru' | 'en'
/** Локалізований рядок. `uk` — основна мова (український ринок). */
export type Bi = { uk: string; ru: string; en: string }

export const LANGS: Lang[] = ['uk', 'ru', 'en']

type AppCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  L: (b: Bi) => string
  dark: boolean
  toggleDark: () => void
  toast: (msg: Bi) => void
}

const Ctx = createContext<AppCtx | null>(null)

export function AppProviders({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('demax-lang') as Lang | null
    return stored && LANGS.includes(stored) ? stored : 'uk'
  })
  const [dark, setDark] = useState<boolean>(() => document.documentElement.classList.contains('dark'))
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('demax-lang', l)
    document.documentElement.lang = l
  }, [])

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('demax-theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  const L = useCallback((b: Bi) => b[lang], [lang])

  const toast = useCallback(
    (msg: Bi) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, text: msg[lang] }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
    },
    [lang],
  )

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, L, dark, toggleDark, toast }), [lang, setLang, L, dark, toggleDark, toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-100 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast pointer-events-auto rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-ivory-100 shadow-pop dark:bg-ivory-100 dark:text-ink-900"
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside AppProviders')
  return ctx
}

const LOCALES: Record<Lang, string> = { uk: 'uk-UA', ru: 'ru-RU', en: 'en-GB' }

export const fmtDate = (iso: string, lang: Lang, withTime = false) =>
  new Date(iso).toLocaleString(LOCALES[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })

export const fmtNum = (n: number, lang: Lang) => n.toLocaleString(lang === 'en' ? 'en-US' : LOCALES[lang])
