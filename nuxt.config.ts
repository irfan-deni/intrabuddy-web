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

  runtimeConfig: {
    public: {
      superCoordinatorEmails: process.env.NUXT_PUBLIC_SUPER_COORDINATOR_EMAILS || 'coordinator@intrabuddy.local'
    }
  },

  devtools: { enabled: true },
  compatibilityDate: '2026-03-17'
})