<template>
  <section class="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
    <div class="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <header class="mb-8">
        <p class="mb-2 text-xs uppercase tracking-[0.3em] text-slate-500">INTRA Buddy</p>
        <h1 class="text-2xl font-bold text-slate-900">Sign in</h1>
        <p class="mt-2 text-sm text-slate-600">Use your registered account to access the dashboard.</p>
      </header>

      <form class="space-y-4" @submit.prevent="signIn">
        <label class="block text-sm font-medium text-slate-700">
          Email
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
        </label>

        <label class="block text-sm font-medium text-slate-700">
          Password
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
        </label>

        <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="isLoading"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i v-if="isLoading" class="pi pi-spin pi-spinner" />
          <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { role, loadProfile, clearProfile } = useCurrentProfile()
const demoAuthCookie = useCookie('intrabuddy_demo_auth', {
  default: () => '0',
  sameSite: 'lax'
})
const demoRoleCookie = useCookie('intrabuddy_demo_role', {
  default: () => '',
  sameSite: 'lax'
})
const demoSuperCookie = useCookie('intrabuddy_demo_super', {
  default: () => '0',
  sameSite: 'lax'
})

const DEMO_EMAIL = 'coordinator@intrabuddy.local'
const DEMO_PASSWORD = 'IntraBuddy123!'

const form = ref({
  email: '',
  password: ''
})
const isLoading = ref(false)
const errorMessage = ref('')
const isCheckingSession = ref(false)

const handleExistingSession = async () => {
  if (!user.value || isCheckingSession.value) {
    return
  }

  isCheckingSession.value = true
  errorMessage.value = ''

  try {
    await loadProfile()

    if (role.value) {
      await navigateTo('/')
      return
    }

    throw new Error('Profile record not found in users table.')
  } catch {
    await supabase.auth.signOut()
    clearProfile()
    errorMessage.value = 'Account profile missing. Ask admin to add your user record in public.users.'
  } finally {
    isCheckingSession.value = false
  }
}

watch(user, async () => {
  await handleExistingSession()
}, { immediate: true })

const signIn = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    // Temporary local demo bypass for offline UI testing.
    if (form.value.email.trim().toLowerCase() === DEMO_EMAIL && form.value.password === DEMO_PASSWORD) {
      demoAuthCookie.value = '1'
      demoRoleCookie.value = 'coordinator'
      demoSuperCookie.value = '1'

      const demoRole = useState<'student' | 'coordinator' | null>('current-role', () => null)
      const demoProfile = useState<Record<string, unknown> | null>('current-profile', () => null)
      demoRole.value = 'coordinator'
      demoProfile.value = {
        id: 'demo-coordinator',
        full_name: 'Demo Coordinator',
        role: 'coordinator',
        student_id: null,
        internship_status: 'preparing',
        is_active: true,
        deleted_at: null,
        created_at: new Date().toISOString()
      }

      await navigateTo('/')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password
    })

    if (error) {
      throw error
    }

    await navigateTo('/')
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
