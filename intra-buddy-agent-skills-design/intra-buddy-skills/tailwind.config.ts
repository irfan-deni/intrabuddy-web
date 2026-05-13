import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:       '#0A1628',  // dark sidebar background
          blue:       '#1E4FD8',  // primary blue (gradient start)
          teal:       '#00C2CB',  // accent teal (gradient end, "Buddy" color)
          mid:        '#1A73E8',  // mid gradient
          bg:         '#F4F6FB',  // page background
          muted:      '#8A96A8',  // secondary text
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1E4FD8 0%, #00C2CB 100%)',
        'brand-gradient-r': 'linear-gradient(to right, #1E4FD8, #00C2CB)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 4px 24px 0 rgba(30, 79, 216, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config
