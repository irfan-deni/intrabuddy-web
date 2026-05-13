// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/supabase'
  ],

  // 1. THIS FIXES THE MISSING ICONS
  css: [
    'primeicons/primeicons.css'
  ],

  // 2. THIS TELLS TAILWIND TO SCAN YOUR NEW 'app' FOLDER FOR STYLES
  tailwindcss: {
    config: {
      content: [
        './app/**/*.{vue,js,ts}'
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
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/icon-180.png' },
        { rel: 'icon', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'icon', sizes: '32x32', href: '/icons/icon-32.png' }
      ]
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