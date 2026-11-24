<template>
  <div class="app-surface-ui min-h-screen flex flex-col md:flex-row">
    <div class="relative isolate hidden overflow-hidden md:flex md:w-1/2 bg-slate-900 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white items-center justify-center p-12 lg:p-16 min-h-screen">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 280 210" fill="none" class="pointer-events-none absolute left-0 top-0 -z-10 w-48 text-sky-300/20 lg:w-72">
        <path d="M-30 147C66 147 144 69 144-27M-30 174C81 174 171 84 171-27M-30 201C96 201 198 99 198-27" stroke="currentColor"/>
        <circle cx="118" cy="64" r="4" fill="currentColor"/>
        <circle cx="155" cy="47" r="7" stroke="currentColor"/>
        <path d="M211 49h12m-6-6v12M79 175h8m-4-4v8" stroke="currentColor" stroke-linecap="round"/>
      </svg>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 640 340" fill="none" class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 w-full text-sky-300/20">
        <path d="M-48 340C154 330 317 246 391 166S531 53 658 21" stroke="currentColor" stroke-width="2"/>
        <path d="M-28 378C166 358 331 279 411 194S550 85 675 51M-8 414C192 385 348 313 433 224S567 119 689 83" stroke="currentColor"/>
        <path d="M361 193C371 185 381 176 391 166S413 144 424 134" stroke="currentColor" stroke-width="2" stroke-dasharray="2 6" transform="translate(-27 -18)"/>
        <circle cx="391" cy="166" r="4" fill="currentColor"/>
      </svg>
      <div class="max-w-lg">
        <div class="flex items-center gap-4">
          <img src="/icons/icon-128.png" alt="" width="64" height="64" class="h-16 w-16 shrink-0 rounded-xl">
          <div>
            <h1 class="text-4xl lg:text-5xl font-black tracking-tight leading-tight">INTRA Buddy</h1>
            <p class="text-white/60 mt-1 text-base font-medium leading-relaxed">
              Coordinator Administration Portal
            </p>
          </div>
        </div>
        <div class="flex items-center gap-6 mt-14 text-slate-300 text-sm font-bold uppercase tracking-widest">
          <span>Placement</span>
          <span class="h-px w-6 bg-white/10"></span>
          <span>Logbooks</span>
          <span class="h-px w-6 bg-white/10"></span>
          <span>Compliance</span>
        </div>
      </div>
    </div>

    <div class="relative isolate overflow-hidden bg-surface-canvas bg-gradient-to-br from-blue-100 via-sky-50 to-teal-50 md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 320 220" fill="none" class="pointer-events-none absolute right-0 top-0 -z-10 w-48 text-sky-700/20 md:w-64 lg:w-80">
        <path d="M80 184C158 174 200 127 227 82L259 34m-25 9 25-9 2 27" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M38 203C151 194 207 153 249 92S306 35 335 22M114 212C171 200 229 171 269 115S314 70 335 57" stroke="currentColor"/>
        <circle cx="80" cy="184" r="3" fill="currentColor"/>
        <circle cx="281" cy="64" r="7" stroke="currentColor"/>
        <path d="M147 105h14m-7-7v14M295 140h10m-5-5v10" stroke="currentColor" stroke-linecap="round"/>
        <circle cx="178" cy="70" r="2" fill="currentColor"/>
        <circle cx="274" cy="166" r="2" fill="currentColor"/>
      </svg>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 300 240" fill="none" class="pointer-events-none absolute bottom-0 left-0 -z-10 hidden w-64 text-teal-700/20 md:block lg:w-72">
        <path d="M-20 193C62 180 81 145 118 103S193 42 253 38" stroke="currentColor" stroke-width="2"/>
        <path d="M-16 217C74 200 102 168 137 127S203 67 272 59M-12 240C91 223 120 190 155 149S218 90 291 82" stroke="currentColor"/>
        <circle cx="253" cy="38" r="3" fill="currentColor"/>
        <circle cx="78" cy="104" r="6" stroke="currentColor"/>
        <path d="M38 140h12m-6-6v12M211 132h10m-5-5v10" stroke="currentColor" stroke-linecap="round"/>
        <circle cx="148" cy="62" r="2" fill="currentColor"/>
        <circle cx="174" cy="171" r="2" fill="currentColor"/>
      </svg>
      <div class="w-full max-w-md mx-auto">
        <div class="mb-10 flex items-center justify-center gap-3 md:hidden">
          <img src="/icons/icon-128.png" alt="" width="48" height="48" class="h-12 w-12 shrink-0 rounded-lg">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-800">INTRA Buddy</h2>
            <p class="text-text-muted mt-1 text-sm font-medium">Coordinator portal</p>
          </div>
        </div>

        <div class="bg-white border border-surface-border shadow-sm rounded-card p-8">
          <h2 class="text-2xl font-bold tracking-tight text-text-primary">Coordinator login</h2>

          <div v-if="errorMessage" class="rounded-card mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium text-center">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleLogin" class="mt-6 space-y-5">
            <div class="space-y-1.5">
              <label for="email" class="text-sm font-semibold text-text-muted mb-1">Email address</label>
              <InputText
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="name@university.edu"
                :class="inputClass"
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
              class="bg-sky-700 bg-gradient-to-r from-sky-700 to-cyan-700 enabled:hover:from-sky-800 enabled:hover:to-cyan-800 text-white font-semibold text-sm py-3 px-4 rounded-control w-full flex justify-center items-center disabled:opacity-50 gap-2"
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

const inputClass = 'w-full px-4 py-3 bg-white border border-surface-control rounded-control outline-none focus:border-sky-700 focus:ring-0 text-base font-medium text-text-primary placeholder:text-text-muted transition-all'

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
