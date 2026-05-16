<template>
  <slot v-if="isAuthRoute" />

  <div v-else class="flex h-screen bg-slate-50/50 font-sans text-slate-900 antialiased">
    <!-- Modern Sidebar -->
    <aside class="w-64 bg-white border-r border-slate-200/60 flex flex-col">
      <div class="h-16 flex items-center px-6 border-b border-slate-100">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <i class="pi pi-graduation-cap text-lg"></i>
          </div>
          <span class="font-bold text-slate-900 tracking-tight">INTRA Buddy</span>
        </NuxtLink>
      </div>

      <nav class="flex-1 px-3 py-6 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group"
          active-class="bg-slate-100 text-slate-900 shadow-sm"
          inactive-class="text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        >
          <i :class="[item.icon, 'text-lg transition-colors group-hover:text-slate-900']" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-slate-100 bg-slate-50/30">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm">
            {{ profileInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-900 truncate">{{ profileLabel }}</p>
            <p class="text-[10px] uppercase tracking-wider font-bold text-slate-400 truncate">{{ roleLabel }}</p>
          </div>
          <button
            class="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
            title="Sign out"
            @click="signOut"
          >
            <i class="pi pi-sign-out" />
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar / Header Info -->
      <header class="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-8">
        <div class="flex items-center gap-2 text-slate-400 text-sm">
          <span class="hover:text-slate-600 transition cursor-default">Internal</span>
          <i class="pi pi-chevron-right text-[10px]"></i>
          <span class="font-medium text-slate-900 capitalize">{{ currentPathLabel }}</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="h-8 w-8 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400">
            <i class="pi pi-bell text-sm"></i>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-y-auto p-8 lg:p-12">
        <div class="max-w-6xl mx-auto">
          <slot />
        </div>
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

const currentPathLabel = computed(() => {
  const path = route.path.split('/')[1]
  return path || 'dashboard'
})

const coordinatorNavigationBase = [
  { to: '/', label: 'Dashboard', icon: 'pi pi-home' },
  { to: '/students', label: 'Students', icon: 'pi pi-users' },
  { to: '/broadcasts', label: 'Broadcasts', icon: 'pi pi-send' },
  { to: '/checklists', label: 'Master Checklist', icon: 'pi pi-check-square' },
  { to: '/faqs', label: 'FAQ Base', icon: 'pi pi-question-circle' }
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
    return 'super'
  }

  return role.value || 'coordinator'
})

const signOut = async () => {
  await supabase.auth.signOut()
  clearProfile()
  await navigateTo('/login')
}
</script>
