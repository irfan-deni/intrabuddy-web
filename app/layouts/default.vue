<template>
  <slot v-if="isAuthRoute" />

  <div v-else class="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
    <aside class="z-20 flex w-64 flex-shrink-0 flex-col bg-slate-900 text-slate-300 shadow-xl">
      <div class="h-16 flex items-center px-6 border-b border-slate-800">
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="/icons/icon-48.png" alt="INTRA Buddy" class="h-10 w-10 object-contain" />
          <span class="font-bold text-xl text-white tracking-wider">INTRA Buddy</span>
        </NuxtLink>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-slate-800 hover:text-white"
          active-class="bg-blue-600 text-white hover:bg-blue-700"
        >
          <i :class="item.icon" />
          <span class="font-medium">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-slate-800">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {{ profileInitial }}
          </div>
          <div class="text-sm">
            <p class="text-white font-medium">{{ profileLabel }}</p>
            <p class="text-slate-400 text-xs capitalize">{{ roleLabel }}</p>
          </div>
          <button
            class="ml-auto rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Sign out"
            @click="signOut"
          >
            <i class="pi pi-sign-out" />
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
         <div class="flex items-center gap-4 text-slate-400">
            <i class="pi pi-search"></i>
          <input
            type="text"
            placeholder="Quick search..."
            class="w-64 border-none bg-transparent text-sm text-slate-700 outline-none focus:ring-0"
            disabled
          >
         </div>
         <div>
            <i class="pi pi-bell text-slate-400 hover:text-slate-600 cursor-pointer text-xl"></i>
         </div>
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
  { to: '/logbooks', label: 'Logbooks', icon: 'pi pi-book' },
  { to: '/broadcasts', label: 'Broadcasts', icon: 'pi pi-send' },
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