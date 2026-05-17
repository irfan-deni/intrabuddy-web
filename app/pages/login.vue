<template>
  <div class="min-h-screen flex items-center justify-center bg-brand-bg px-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center h-14 w-14 bg-slate-900 text-white mb-4">
          <i class="pi pi-graduation-cap text-2xl"></i>
        </div>
        <h1 class="text-2xl font-black uppercase tracking-[0.3em] text-slate-800">INTRA Buddy</h1>
        <p class="text-stone-500 mt-2 text-[10px] font-black uppercase tracking-widest">Sign in to manage your cohort</p>
      </div>

      <div v-if="errorMessage" class="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest text-center">
        {{ errorMessage }}
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest block mb-2">Email Address</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="name@university.edu"
            class="w-full px-5 py-4 bg-white border border-stone-200 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 text-sm font-black uppercase tracking-widest text-slate-800 placeholder:text-stone-400 transition"
          >
        </div>

        <div>
          <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest block mb-2">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-5 py-4 bg-white border border-stone-200 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 text-sm font-black uppercase tracking-widest text-slate-800 placeholder:text-stone-400 transition"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-4 bg-sky-600 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:brightness-110 transition disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="mt-8 pt-8 border-t border-stone-200 text-center text-[9px] font-black text-stone-400 uppercase tracking-widest">
        &copy; 2026 INTRA Buddy. Professional Placement Management.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error
    await navigateTo('/')
  } catch (error: any) {
    errorMessage.value = error.message || 'Authentication failed'
  } finally {
    loading.value = false
  }
}
</script>
