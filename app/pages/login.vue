<template>
  <div class="min-h-screen flex items-center justify-center bg-white px-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center h-12 w-12 rounded border border-slate-200 mb-4 text-slate-900">
          <i class="pi pi-graduation-cap text-2xl"></i>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">INTRA Buddy</h1>
        <p class="text-slate-500 mt-2">Sign in to manage your cohort</p>
      </div>

      <div v-if="errorMessage" class="mb-6 p-4 rounded bg-red-50 border border-red-100 text-sm text-red-700 text-center">
        {{ errorMessage }}
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="name@university.edu"
            class="w-full px-4 py-2 border border-slate-200 rounded outline-none focus:border-slate-400 text-sm transition"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2 border border-slate-200 rounded outline-none focus:border-slate-400 text-sm transition"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 bg-slate-900 text-white rounded font-medium text-sm hover:bg-slate-800 transition disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
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
