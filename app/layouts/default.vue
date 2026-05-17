<template>
  <div class="min-h-screen bg-brand-bg flex font-sans selection:bg-brand-azure selection:text-white">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      @click="mobileOpen = false"
    ></div>

    <aside
      class="bg-slate-900 text-white flex flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out"
      :class="[isLgScreen ? (collapsed ? 'w-20' : 'w-72') : mobileOpen ? 'left-0' : '-left-80']"
    >
      <div :class="collapsed && isLgScreen ? 'p-5' : 'p-8'">
        <div class="flex items-center" :class="collapsed && isLgScreen ? 'justify-center' : 'gap-3'">
          <div class="bg-white p-1.5 flex-shrink-0">
            <i class="pi pi-graduation-cap text-slate-900 text-xl"></i>
          </div>
          <Transition name="fade-text">
            <span v-if="!collapsed || !isLgScreen" class="text-lg font-black tracking-[0.3em] uppercase text-white whitespace-nowrap">INTRA Buddy</span>
          </Transition>
        </div>
      </div>

      <nav class="flex-1 px-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all rounded-lg"
          :class="[
            collapsed && isLgScreen ? 'justify-center px-0' : '',
            route.path === item.path
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          ]"
          @click="mobileOpen = false"
        >
          <i :class="[item.icon, 'text-lg flex-shrink-0']"></i>
          <Transition name="fade-text">
            <span v-if="!collapsed || !isLgScreen">{{ item.name }}</span>
          </Transition>
        </NuxtLink>
      </nav>

      <div class="px-4 pb-2 hidden lg:block">
        <button
          class="w-full flex items-center justify-center gap-3 px-4 py-3 text-white/50 hover:text-white hover:bg-white/10 transition-all rounded-lg"
          :class="collapsed ? 'px-0' : ''"
          @click="collapsed = !collapsed"
        >
          <i class="pi text-sm transition-transform duration-300" :class="collapsed ? 'pi-chevron-right' : 'pi-chevron-left'"></i>
          <Transition name="fade-text">
            <span v-if="!collapsed" class="text-[10px] font-bold uppercase tracking-wider">Collapse</span>
          </Transition>
        </button>
      </div>

      <div class="p-6 border-t border-white/10" :class="collapsed && isLgScreen ? 'p-4 flex justify-center' : ''">
        <div
          class="flex items-center gap-4 group cursor-pointer"
          :class="collapsed && isLgScreen ? 'justify-center' : ''"
          @click="handleLogout"
        >
          <div class="h-10 w-10 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors rounded-lg flex-shrink-0">
            <i class="pi pi-sign-out text-sm"></i>
          </div>
          <Transition name="fade-text">
            <div v-if="!collapsed || !isLgScreen" class="flex flex-col">
              <span class="text-xs font-bold tracking-wider text-white/50 group-hover:text-white transition-colors">Sign Out</span>
              <span class="text-[10px] text-white/30 tracking-wide">{{ profile?.email || 'System' }}</span>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <div
      class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
      :class="isLgScreen ? (collapsed ? 'ml-20' : 'ml-72') : 'ml-0'"
    >
      <header class="h-16 lg:h-20 bg-white border-b border-stone-200 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30">
        <div class="flex items-center gap-3 lg:gap-4">
          <button class="lg:hidden h-10 w-10 flex items-center justify-center text-stone-400 hover:text-slate-800 hover:bg-stone-100 transition-all rounded-lg" @click="mobileOpen = !mobileOpen">
            <i class="pi pi-bars text-lg"></i>
          </button>
          <div class="hidden sm:flex text-xs font-semibold tracking-wider text-stone-500 items-center gap-2">
            <span>Internal</span>
            <i class="pi pi-chevron-right text-[10px]"></i>
            <span class="text-slate-800">{{ currentPageName }}</span>
          </div>
        </div>

        <div class="flex items-center gap-4 lg:gap-6">
          <div class="hidden sm:flex flex-col items-end">
            <span class="text-sm font-bold text-slate-800">{{ profile?.full_name || 'Coordinator' }}</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-stone-500 font-medium">{{ role || '' }}</span>
              <span v-if="isSuperCoordinator" class="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">Super</span>
            </div>
          </div>
          <div class="h-10 w-10 bg-slate-800 flex items-center justify-center text-white text-sm font-bold rounded-lg flex-shrink-0">
            {{ (profile?.full_name || 'U').charAt(0).toUpperCase() }}
          </div>
        </div>
      </header>

      <main class="flex-1 p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
        <slot />
      </main>

      <footer class="p-6 lg:p-12 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 text-center sm:text-left">
        <span>&copy; 2026 INTRA Buddy Management System</span>
        <span>Version 2.4.0</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const { profile, role, clearProfile } = useCurrentProfile()
const { isSuperCoordinator } = useCoordinatorPrivileges()

const collapsed = ref(false)
const mobileOpen = ref(false)
const isLgScreen = ref(false)

const checkScreen = () => {
  isLgScreen.value = window.innerWidth >= 1024
}

onMounted(() => {
  checkScreen()
  window.addEventListener('resize', checkScreen)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreen)
})

const navigation = [
  { name: 'Dashboard', path: '/', icon: 'pi pi-chart-bar' },
  { name: 'Students', path: '/students', icon: 'pi pi-users' },
  { name: 'Broadcasts', path: '/broadcasts', icon: 'pi pi-megaphone' },
  { name: 'Master Checklist', path: '/checklists', icon: 'pi pi-check-square' },
  { name: 'Knowledge Base', path: '/faqs', icon: 'pi pi-book' }
]

const currentPageName = computed(() => {
  const item = navigation.find(n => n.path === route.path)
  return item ? item.name : 'View'
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  clearProfile()
  navigateTo('/login')
}
</script>

<style>
.pi {
  vertical-align: middle;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #FAFAF9;
}
::-webkit-scrollbar-thumb {
  background: #e7e5e4;
}
::-webkit-scrollbar-thumb:hover {
  background: #000;
}

.fade-text-enter-active,
.fade-text-leave-active {
  transition: opacity 0.2s ease;
}
.fade-text-enter-from,
.fade-text-leave-to {
  opacity: 0;
}
</style>
