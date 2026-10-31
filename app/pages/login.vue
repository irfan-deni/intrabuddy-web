<template>
  <div class="app-surface-ui min-h-screen flex flex-col md:flex-row">
    <div class="hidden md:flex md:w-1/2 bg-slate-900 text-white items-center justify-center p-12 lg:p-16 min-h-screen">
      <div class="max-w-lg">
        <div class="rounded-control inline-flex items-center justify-center h-16 w-16 bg-surface mb-10">
          <i class="pi pi-graduation-cap text-slate-900 text-3xl"></i>
        </div>
        <h1 class="text-4xl lg:text-5xl font-black tracking-[0.05em] leading-tight">INTRA Buddy</h1>
        <p class="text-white/60 mt-4 text-base font-medium leading-relaxed max-w-md">
          Coordinator Administration Portal
        </p>
        <div class="flex items-center gap-6 mt-14 text-slate-300 text-sm font-bold uppercase tracking-widest">
          <span>Placement</span>
          <span class="h-px w-6 bg-white/10"></span>
          <span>Logbooks</span>
          <span class="h-px w-6 bg-white/10"></span>
          <span>Compliance</span>
        </div>
      </div>
    </div>

    <div class="bg-surface-canvas md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen">
      <div class="w-full max-w-md mx-auto">
        <div class="md:hidden text-center mb-10">
          <div class="rounded-control inline-flex items-center justify-center h-12 w-12 bg-slate-900 text-white mb-4">
            <i class="pi pi-graduation-cap text-xl"></i>
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-800">INTRA Buddy</h2>
          <p class="text-text-muted mt-1 text-sm font-medium">Coordinator portal</p>
        </div>

        <div class="bg-surface border border-surface-border shadow-sm rounded-card p-8">
          <h2 class="text-2xl font-bold tracking-tight text-text-primary">Coordinator login</h2>

          <div v-if="errorMessage" class="rounded-card mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium text-center">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleLogin" class="mt-8 space-y-5">
            <div class="space-y-1.5">
              <label for="email" class="text-sm font-semibold text-text-muted mb-1">Email address</label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="name@university.edu"
                class="w-full px-4 py-3 bg-surface-muted border border-surface-control rounded-control outline-none focus:border-sky-700 focus:ring-0 text-base font-medium text-text-primary placeholder:text-text-muted transition-all"
              />
            </div>

            <div class="space-y-1.5">
              <label for="password" class="text-sm font-semibold text-text-muted mb-1">Password</label>
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
                <span class="text-sm font-medium text-text-muted group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
              <button type="button" class="rounded-control text-sm font-semibold text-sky-700 hover:text-sky-800 transition-colors">Forgot password?</button>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm py-3 px-4 rounded-control transition-colors w-full flex justify-center items-center disabled:opacity-50 gap-2"
            >
              <i v-if="loading" class="pi pi-spin pi-spinner"></i>
              {{ loading ? 'Logging in...' : 'Log in' }}
            </button>
          </form>
        </div>

        <p class="mt-10 text-center text-sm font-medium text-text-muted">
          &copy; 2026 INTRA Buddy. Professional placement management.
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
const route = useRoute()
const { loadProfile, clearProfile } = useCurrentProfile()
const mobileOnlyMessage = 'This portal is for coordinators. Students should use the INTRA Buddy mobile app.'

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const errorMessage = ref(route.query.reason === 'mobile-only' ? mobileOnlyMessage : '')

const inputClass = 'w-full px-4 py-3 bg-surface-muted border border-surface-control rounded-control outline-none focus:border-sky-700 focus:ring-0 text-base font-medium text-text-primary placeholder:text-text-muted transition-all'

const checkboxPt = computed(() => ({
  root: { class: 'cursor-pointer rounded-badge focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-700' },
  box: { class: ['h-[18px] w-[18px] rounded-badge border-2 flex items-center justify-center transition-all shrink-0', remember.value ? 'bg-sky-700 border-sky-700' : 'bg-surface-muted border-surface-control'] },
  input: { class: 'sr-only' }
}))

const passwordPt = {
  root: { class: 'relative w-full' },
  pcInputText: {
    root: { class: [inputClass, 'pr-12'] }
  },
  maskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-slate-800 transition-colors w-5 h-5' },
  unmaskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-slate-800 transition-colors w-5 h-5' }
}

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    clearProfile()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    })

    if (error) {
      throw error
    }

    if (!data.user || !data.session) {
      throw new Error('Unable to establish your session. Please try logging in again.')
    }

    const profile = await loadProfile(data.user.id, data.session.access_token)
    if (profile?.role === 'student') {
      await supabase.auth.signOut({ scope: 'local' })
      clearProfile()
      errorMessage.value = mobileOnlyMessage
      return
    }
    if (profile?.role !== 'coordinator') {
      throw new Error('Your account does not have coordinator access. Please contact your administrator.')
    }
    await navigateTo('/')
  } catch (error: any) {
    await supabase.auth.signOut({ scope: 'local' })
    clearProfile()
    errorMessage.value = error.message || 'Authentication failed'
  } finally {
    loading.value = false
  }
}
</script>
