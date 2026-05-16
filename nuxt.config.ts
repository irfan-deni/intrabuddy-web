// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
    redirect: false 
  },

  app: {
    head: {
      link: []
    }
  },

  runtimeConfig: {
    public: {
      superCoordinatorEmails: process.env.NUXT_PUBLIC_SUPER_COORDINATOR_EMAILS || 'coordinator@intrabuddy.my'
    }
  },

  devtools: { enabled: true },
  compatibilityDate: '2026-03-17'
})
