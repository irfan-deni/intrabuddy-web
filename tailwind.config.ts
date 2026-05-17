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
          navy: '#0F172A',
          azure: '#2563EB',
          gold: '#F59E0B',
          emerald: '#10B981',
          red: '#DC2626',
          bg: '#FAFAF9'
        },
        text: {
          primary: '#292524',
          muted: '#57534E',
          veryMuted: '#78716C'
        }
      }
    }
  },
  plugins: []
}