import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      borderRadius: {
        card: '12px',
        dialog: '16px',
        control: '8px',
        badge: '6px'
      },
      colors: {
        brand: {
          navy: '#0F172A',
          azure: '#0284C7',
          gold: '#F59E0B',
          emerald: '#10B981',
          red: '#DC2626',
          bg: '#EEF1F4'
        },
        surface: {
          DEFAULT: '#F8FAFC',
          canvas: '#EEF1F4',
          muted: '#F1F5F9',
          hover: '#E2E8F0',
          selected: '#E0F2FE',
          border: '#CBD5E1',
          control: '#7C8A9C'
        },
        text: {
          primary: '#1E293B',
          muted: '#475569',
          veryMuted: '#64748B'
        }
      }
    }
  },
  plugins: []
}
