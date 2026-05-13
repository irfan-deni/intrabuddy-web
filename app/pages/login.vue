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
      <div v-if="showLoginDebug" class="mt-4">
        <details>
          <summary class="text-sm text-slate-500">Debug: last raw error (dev only)</summary>
          <pre class="whitespace-pre-wrap bg-slate-50 border p-2 text-xs text-slate-700">{{ JSON.stringify(lastErrorRaw, null, 2) }}</pre>
        </details>
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
/** Must match seeded Auth email in your Supabase project (`coordinator@intrabuddy.my`). Avoid `.local` — Supabase Auth rejects it as invalid. */
const DEMO_COORDINATOR_EMAIL = 'coordinator@intrabuddy.my'
const isLoading = ref(false)
const errorMessage = ref('')
const isCheckingSession = ref(false)
const lastErrorRaw = useState<unknown>('login-last-error', () => null)
const showLoginDebug = import.meta.dev

const isInvalidCredentialsError = (message: string) => {
  return message.toLowerCase().includes('invalid login credentials')
}

const isEmailNotConfirmedError = (message: string) => {
  return message.toLowerCase().includes('email not confirmed')
}

const maybeProvisionDemoCoordinator = async () => {
  const email = form.value.email.trim().toLowerCase()
  if (email !== DEMO_COORDINATOR_EMAIL) {
    return false
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: form.value.password,
    options: {
      data: {
        full_name: 'Demo Coordinator'
      }
    }
  })

  if (!error) {
    return true
  }

  const normalized = error.message.toLowerCase()
  if (normalized.includes('already') || normalized.includes('exists')) {
    return true
  }

  throw error
}

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
  } catch (error: unknown) {
    if (showLoginDebug) {
      lastErrorRaw.value = {
        error,
        userObject: user.value,
        userId: user.value?.id,
        userType: typeof user.value
      }
    }
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
    const emailTrimmed = form.value.email.trim()

    const { error } = await supabase.auth.signInWithPassword({
      email: emailTrimmed,
      password: form.value.password
    })

    if (error) {
      throw error
    }

    await navigateTo('/')
  } catch (error: unknown) {
    if (showLoginDebug) {
      lastErrorRaw.value = error
    }
    const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'

    if (!isInvalidCredentialsError(message)) {
      errorMessage.value = message
      return
    }

    try {
      const created = await maybeProvisionDemoCoordinator()
      if (!created) {
        errorMessage.value = 'Invalid login credentials. Check email/password or create the account in Supabase Auth.'
        return
      }

      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: form.value.email.trim(),
        password: form.value.password
      })

      if (retryError) {
        if (isEmailNotConfirmedError(retryError.message)) {
          errorMessage.value = 'Demo account created, but email confirmation is required. Confirm the user in Supabase Auth and try again.'
          return
        }

        throw retryError
      }

      await navigateTo('/')
    } catch (provisionError: unknown) {
      const provisionMessage = provisionError instanceof Error ? provisionError.message : ''
      if (provisionMessage.toLowerCase().includes('signup')) {
        errorMessage.value = 'Demo account auto-creation is blocked by Supabase Auth settings. Create coordinator@intrabuddy.my manually in Supabase Auth.'
      } else {
        errorMessage.value = provisionMessage || 'Unable to create demo account automatically. Create it manually in Supabase Auth.'
      }
    }
  } finally {
    isLoading.value = false
  }
}
</script>
