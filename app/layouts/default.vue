<template>
  <slot v-if="isAuthRoute" />

  <div v-else class="flex h-screen overflow-hidden bg-brand-bg font-sans text-slate-900">
    <aside class="z-20 flex w-72 flex-shrink-0 flex-col bg-brand-navy text-white shadow-[0_24px_60px_rgba(10,22,40,0.28)]">
      <div class="border-b border-white/10 px-6 py-5">
        <NuxtLink to="/" class="flex items-center gap-3">
<<<<<<< HEAD
          <img src="/icons/icon-48.png" alt="INTRA Buddy" class="h-11 w-11 rounded-xl bg-white/5 object-contain p-1" />
          <div class="leading-tight">
            <p class="text-lg font-black tracking-wide text-white">
              <span>INTRA</span>
              <span class="text-brand-teal"> Buddy</span>
            </p>
            <p class="text-xs font-medium uppercase tracking-[0.32em] text-white/55">Guide · Support · Grow</p>
          </div>
=======
          <div class="flex items-center justify-center h-10 w-10 rounded-lg bg-cyan-500 text-white">
            <i class="pi pi-graduation-cap text-xl"></i>
          </div>
          <span class="font-bold text-xl text-white tracking-wider">INTRA Buddy</span>
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
        </NuxtLink>
      </div>

      <nav class="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
<<<<<<< HEAD
          class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition duration-200 hover:bg-white/10 hover:text-white"
          active-class="bg-gradient-to-r from-brand-blue to-brand-teal text-white shadow-lg shadow-brand-blue/20"
=======
          class="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-slate-800 hover:text-white"
          active-class="bg-cyan-600 text-white hover:bg-cyan-700"
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

<<<<<<< HEAD
      <div class="border-t border-white/10 p-4">
        <div class="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-teal text-sm font-bold text-white">
=======
      <div class="p-4 border-t border-slate-800">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
>>>>>>> fb6c239 (feat: enhance UI with cyan color scheme, add Master Checklist page, and implement wallet document management for students)
            {{ profileInitial }}
          </div>
          <div class="text-sm">
            <p class="font-semibold text-white">{{ profileLabel }}</p>
            <p class="text-xs capitalize text-white/60">{{ roleLabel }}</p>
          </div>
          <button
            class="ml-auto rounded-xl p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
            title="Sign out"
            @click="signOut"
          >
            <i class="pi pi-sign-out" />
          </button>
        </div>
      </div>
    </aside>

    <main class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur">
        <div class="flex items-center gap-4 text-slate-400">
          <i class="pi pi-search" />
          <input
            type="text"
            placeholder="Quick search..."
            class="w-64 border-none bg-transparent text-sm text-slate-700 outline-none focus:ring-0"
            disabled
          >
        </div>
        <button class="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" type="button">
          <i class="pi pi-bell text-xl" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCurrentProfile } from '../composables/useCurrentProfile'
import { useCoordinatorPrivileges } from '../composables/useCoordinatorPrivileges'

const supabase = useSupabaseClient()
const { profile, role, clearProfile } = useCurrentProfile()
const { isSuperCoordinator } = useCoordinatorPrivileges()
const route = useRoute()

const isAuthRoute = computed(() => route.path === '/login')

const coordinatorNavigationBase = [
  { to: '/', label: 'Dashboard', icon: 'pi pi-home' },
  { to: '/students', label: 'Student Directory', icon: 'pi pi-users' },
  { to: '/broadcasts', label: 'Broadcasts', icon: 'pi pi-send' },
  { to: '/checklists', label: 'Master Checklist', icon: 'pi pi-check-square' },
  { to: '/faqs', label: 'Knowledge Base', icon: 'pi pi-question-circle' }
]

const studentNavigation = [
  { to: '/student', label: 'Overview', icon: 'pi pi-home' }
]

const navigation = computed(() => {
  if (role.value === 'student') {
    return studentNavigation
  }

  return coordinatorNavigationBase.filter((item) => {
    if (item.to === '/students') {
      return isSuperCoordinator.value
    }

    return true
  })
})

const profileInitial = computed(() => {
  return profile.value?.full_name?.slice(0, 1).toUpperCase() || 'U'
})

const profileLabel = computed(() => {
  return profile.value?.full_name || 'User'
})

const roleLabel = computed(() => {
  if (role.value === 'coordinator' && isSuperCoordinator.value) {
    return 'super coordinator'
  }

  return role.value || 'coordinator'
})

const signOut = async () => {
  await supabase.auth.signOut()
  clearProfile()
  await navigateTo('/login')
}
</script>
