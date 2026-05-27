// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: process.env.NUXT_SSR !== 'false',
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/supabase'
  ],

  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css'
  ],

  tailwindcss: {
    config: {
      content: [
        './app/**/*.{vue,js,ts}',
        './components/**/*.{vue,js,ts}',
        './layouts/**/*.{vue,js,ts}',
        './pages/**/*.{vue,js,ts}'
      ]
    }
  },

  primevue: {
    options: {
      ripple: true,
      theme: 'none' 
    }
  },

  supabase: {
    redirect: false,
    types: '~/types/supabase'
  },

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: 'https://nuxt.com/icon.svg' }
      ]
    }
  },

  routeRules: {
    '/api/**': { cors: true }
  },

  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      nodeCompat: false,
      deployConfig: false
    }
  },

  runtimeConfig: {
    public: {
      superCoordinatorEmails: process.env.NUXT_PUBLIC_SUPER_COORDINATOR_EMAILS || ''
    }
  },

  devtools: { enabled: true },
  compatibilityDate: '2026-03-17'
})