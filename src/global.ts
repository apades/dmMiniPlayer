import type messages from './a.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en'
    Messages: typeof messages
  }
}
