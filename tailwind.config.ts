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
      colors: {
        brand: {
          navy: '#0A1628',
          blue: '#1E4FD8',
          cyan: '#00C2CB',
          gold: '#F59E0B',
          bg: '#F4F6FB'
        },
        text: {
          primary: '#0F172A',
          muted: '#64748B',
          veryMuted: '#94A3B8'
        }
      }
    }
  },
  plugins: []
}