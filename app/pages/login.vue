<template>
  <section class="relative min-h-screen overflow-hidden bg-brand-bg px-6 py-10">
    <div class="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(30,79,216,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(0,194,203,0.16),_transparent_28%)]" />

    <div class="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
      <div class="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div class="hidden rounded-[2rem] border border-white/60 bg-white/75 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:block">
          <div class="flex items-center gap-4">
            <img src="/icons/icon-96.png" alt="INTRA Buddy" class="h-16 w-16 rounded-2xl bg-white object-contain p-2 shadow-sm" />
            <div>
              <p class="text-3xl font-black tracking-tight text-brand-navy">
                <span>INTRA</span>
                <span class="text-brand-teal"> Buddy</span>
              </p>
              <p class="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Guide · Support · Grow</p>
            </div>
          </div>

          <div class="mt-10 space-y-4">
            <h2 class="text-4xl font-black leading-tight text-brand-navy">Coordinator Portal · UniKL MIIT</h2>
            <p class="max-w-lg text-base leading-7 text-slate-600">
              Manage student placements, logbook compliance, broadcasts, and knowledge base content from one branded dashboard.
            </p>
          </div>

          <div class="mt-10 grid grid-cols-3 gap-4 text-sm">
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Brand</p>
              <p class="mt-2 font-semibold text-brand-navy">Navy + Teal</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Portal</p>
              <p class="mt-2 font-semibold text-brand-navy">Coordinator</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Support</p>
              <p class="mt-2 font-semibold text-brand-navy">Guide · Grow</p>
            </div>
          </div>
        </div>

        <div class="mx-auto w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
          <header class="mb-8 text-center">
            <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-teal p-2 shadow-lg shadow-brand-blue/20">
              <img src="/icons/icon-96.png" alt="INTRA Buddy" class="h-12 w-12 object-contain" />
            </div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-brand-blue">INTRA Buddy</p>
            <h1 class="mt-2 text-3xl font-black tracking-tight text-brand-navy">
              <span>INTRA</span>
              <span class="text-brand-teal"> Buddy</span>
            </h1>
            <p class="mt-2 text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Guide · Support · Grow</p>
            <p class="mt-3 text-sm text-slate-600">Coordinator Portal · UniKL MIIT</p>
          </header>

          <form class="space-y-4" @submit.prevent="signIn">
            <label class="block text-sm font-medium text-slate-700">
              Email
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                :aria-invalid="Boolean(fieldErrors.email)"
                class="mt-1 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2"
                :class="fieldErrors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-brand-blue focus:ring-brand-blue/20'"
              >
            </label>
            <p v-if="fieldErrors.email" class="-mt-2 text-xs font-medium text-red-600">{{ fieldErrors.email }}</p>

            <label class="block text-sm font-medium text-slate-700">
              Password
              <input
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                :aria-invalid="Boolean(fieldErrors.password)"
                class="mt-1 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2"
                :class="fieldErrors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-brand-blue focus:ring-brand-blue/20'"
              >
            </label>
            <p v-if="fieldErrors.password" class="-mt-2 text-xs font-medium text-red-600">{{ fieldErrors.password }}</p>

            <p v-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              :disabled="isLoading"
              class="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-teal px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i v-if="isLoading" class="pi pi-spin pi-spinner" />
              <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
            </button>
          </form>

          <div v-if="showLoginDebug" class="mt-4">
            <details>
              <summary class="cursor-pointer text-sm text-slate-500">Debug: last raw error (dev only)</summary>
              <pre class="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{{ JSON.stringify(lastErrorRaw, null, 2) }}</pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { role, loadProfile, clearProfile } = useCurrentProfile()

const form = ref({
  email: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<{ email?: string; password?: string }>({})
const isCheckingSession = ref(false)
const lastErrorRaw = useState<unknown>('login-last-error', () => null)
const showLoginDebug = import.meta.dev

const validateForm = () => {
  const nextErrors: { email?: string; password?: string } = {}

  if (!form.value.email.trim()) {
    nextErrors.email = 'Email is required.'
  }

  if (!form.value.password.trim()) {
    nextErrors.password = 'Password is required.'
  }

  fieldErrors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

const handleExistingSession = async () => {
  if (!user.value || isCheckingSession.value) {
    return
  }

  isCheckingSession.value = true
  errorMessage.value = ''

  try {
    await loadProfile()

    if (role.value === 'coordinator') {
      await navigateTo('/')
      return
    }

    throw new Error('Access denied. This portal is for coordinators only.')
  } catch {
    await supabase.auth.signOut()
    clearProfile()
    errorMessage.value = 'Access denied. This portal is for coordinators only.'
  } finally {
    isCheckingSession.value = false
  }
}

watch(user, async () => {
  await handleExistingSession()
}, { immediate: true })

const signIn = async () => {
  errorMessage.value = ''
  fieldErrors.value = {}
  isLoading.value = true

  if (!validateForm()) {
    isLoading.value = false
    return
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password
    })

    if (error) {
      throw error
    }

    await loadProfile()

    if (role.value !== 'coordinator') {
      await supabase.auth.signOut()
      clearProfile()
      errorMessage.value = 'Access denied. This portal is for coordinators only.'
      return
    }

    await navigateTo('/')
  } catch (error: unknown) {
    if (showLoginDebug) {
      lastErrorRaw.value = error
    }

    const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
    errorMessage.value = message.toLowerCase().includes('invalid login credentials')
      ? 'Invalid email or password.'
      : message
  } finally {
    isLoading.value = false
  }
}
</script>
