import { createContext, useContext, type ReactNode } from "react"
import type { AppLocale } from "@/lib/i18n"
import { getTranslations, type Translations } from "@/lib/i18n"

const I18nContext = createContext<{ locale: AppLocale; t: Translations }>({
  locale: "ru",
  t: getTranslations("ru"),
})

export function I18nProvider({
  locale,
  children,
}: {
  locale: AppLocale
  children: ReactNode
}) {
  const t = getTranslations(locale)
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
