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
          teal: '#00C2CB',
          mid: '#1A73E8',
          bg: '#F4F6FB'
        }
      }
    }
  },
  plugins: []
}