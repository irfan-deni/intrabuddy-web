<template>
  <div class="min-h-screen flex flex-col md:flex-row">
    <div class="hidden md:flex md:w-1/2 bg-slate-900 text-white items-center justify-center p-12 lg:p-16 min-h-screen">
      <div class="max-w-lg">
        <div class="inline-flex items-center justify-center h-16 w-16 bg-white mb-10">
          <i class="pi pi-graduation-cap text-slate-900 text-3xl"></i>
        </div>
        <h1 class="text-4xl lg:text-5xl font-black tracking-[0.05em] leading-tight">INTRA Buddy</h1>
        <p class="text-white/60 mt-4 text-base font-medium leading-relaxed max-w-md">
          Coordinator Administration Portal
        </p>
        <div class="flex items-center gap-6 mt-14 text-white/20 text-sm font-bold uppercase tracking-widest">
          <span>Placement</span>
          <span class="h-px w-6 bg-white/10"></span>
          <span>Logbooks</span>
          <span class="h-px w-6 bg-white/10"></span>
          <span>Compliance</span>
        </div>
      </div>
    </div>

    <div class="bg-slate-50 md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen">
      <div class="w-full max-w-md mx-auto">
        <div class="md:hidden text-center mb-10">
          <div class="inline-flex items-center justify-center h-12 w-12 bg-slate-900 text-white mb-4">
            <i class="pi pi-graduation-cap text-xl"></i>
          </div>
          <h2 class="text-xl font-black uppercase tracking-[0.2em] text-slate-800">INTRA Buddy</h2>
          <p class="text-stone-500 mt-1 text-[10px] font-bold uppercase tracking-widest">Coordinator Portal</p>
        </div>

        <div class="bg-white shadow-xl rounded-2xl p-8">
          <h2 class="text-xl font-bold text-slate-800">Sign in to your account</h2>
          <p class="text-stone-500 text-sm mt-1.5">Enter your credentials to access the dashboard.</p>

          <div v-if="errorMessage" class="mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg text-center">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleLogin" class="mt-8 space-y-5">
            <div class="space-y-1.5">
              <label for="email" class="text-xs font-semibold text-slate-700">Email address</label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="name@university.edu"
                class="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-800 placeholder:text-stone-400 transition-all"
              />
            </div>

            <div class="space-y-1.5">
              <label for="password" class="text-xs font-semibold text-slate-700">Password</label>
              <Password
                v-model="password"
                inputId="password"
                :feedback="false"
                toggleMask
                autocomplete="current-password"
                placeholder="Enter your password"
                :pt="passwordPt"
              />
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2.5 cursor-pointer group select-none">
                <Checkbox
                  v-model="remember"
                  :binary="true"
                  inputId="remember-me"
                  :pt="checkboxPt"
                >
                  <template #icon="{ checked }">
                    <i v-if="checked" class="pi pi-check text-white text-[9px] font-bold"></i>
                  </template>
                </Checkbox>
                <span class="text-sm font-medium text-stone-600 group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
              <button type="button" class="text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">Forgot password?</button>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3 bg-sky-600 text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i v-if="loading" class="pi pi-spin pi-spinner"></i>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>
        </div>

        <p class="mt-10 text-center text-xs font-medium text-stone-400">
          &copy; 2026 INTRA Buddy. Professional Placement Management.
        </p>
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
const remember = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const inputClass = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-800 placeholder:text-stone-400 transition-all'

const checkboxPt = computed(() => ({
  root: { class: 'cursor-pointer' },
  box: { class: ['h-[18px] w-[18px] rounded border-2 flex items-center justify-center transition-all shrink-0', remember.value ? 'bg-sky-600 border-sky-600' : 'border-stone-300'] },
  input: { class: 'sr-only' }
}))

const passwordPt = {
  root: { class: 'relative w-full' },
  pcInputText: {
    root: { class: [inputClass, 'pr-12'] }
  },
  maskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-slate-800 transition-colors w-5 h-5' },
  unmaskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-slate-800 transition-colors w-5 h-5' }
}

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
