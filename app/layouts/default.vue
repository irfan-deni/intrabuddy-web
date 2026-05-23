<template>
  <div class="min-h-screen bg-brand-bg flex font-sans selection:bg-brand-azure selection:text-white">
    <aside
      class="hidden lg:flex bg-slate-900 text-white flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out"
      :class="collapsed ? 'w-20' : 'w-72'"
    >
      <div :class="collapsed ? 'p-5' : 'p-8'">
        <div class="flex items-center gap-3" :class="collapsed ? 'justify-center' : ''">
          <div class="bg-white p-1.5 flex-shrink-0">
            <i class="pi pi-graduation-cap text-slate-900 text-xl"></i>
          </div>
          <Transition name="fade-text">
            <div v-if="!collapsed" class="flex flex-col">
              <span class="text-lg font-black tracking-[0.3em] uppercase text-white whitespace-nowrap">INTRA BUDDY</span>
              <span class="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">COORDINATOR PORTAL</span>
            </div>
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
            collapsed ? 'justify-center px-0' : '',
            route.path === item.path
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          ]"
        >
          <i :class="[item.icon, 'text-lg flex-shrink-0']"></i>
          <Transition name="fade-text">
            <span v-if="!collapsed">{{ item.name }}</span>
          </Transition>
        </NuxtLink>
      </nav>

      <div class="px-4 pb-2">
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

      <div class="p-6 border-t border-white/10" :class="collapsed ? 'p-4 flex justify-center' : ''">
        <div
          class="flex items-center gap-4 group cursor-pointer"
          :class="collapsed ? 'justify-center' : ''"
          @click="handleLogout"
        >
          <div class="h-10 w-10 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors rounded-lg flex-shrink-0">
            <i class="pi pi-sign-out text-sm"></i>
          </div>
          <Transition name="fade-text">
            <div v-if="!collapsed" class="flex flex-col">
              <span class="text-xs font-bold tracking-wider text-white/50 group-hover:text-white transition-colors">Sign Out</span>
              <span class="text-[10px] text-white/30 tracking-wide">{{ profile?.email || 'System' }}</span>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      @click="mobileOpen = false"
    ></div>

    <div
      class="fixed top-0 left-0 h-full z-50 flex flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:hidden"
      :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
      style="width: 288px"
    >
      <div class="flex items-center justify-between p-6 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="bg-white p-1.5 flex-shrink-0">
            <i class="pi pi-graduation-cap text-slate-900 text-xl"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-black tracking-[0.3em] uppercase text-white whitespace-nowrap">INTRA BUDDY</span>
            <span class="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">COORDINATOR PORTAL</span>
          </div>
        </div>
        <button class="h-8 w-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all rounded-lg" @click="mobileOpen = false">
          <i class="pi pi-times text-sm"></i>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-4 px-4 py-4 text-sm font-bold uppercase tracking-wider transition-all rounded-lg min-h-[48px]"
          :class="[
            route.path === item.path
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          ]"
          @click="mobileOpen = false"
        >
          <i :class="[item.icon, 'text-lg flex-shrink-0']"></i>
          <span>{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <div class="p-6 border-t border-white/10">
        <div class="flex items-center gap-4 group cursor-pointer min-h-[48px]" @click="handleLogout">
          <div class="h-10 w-10 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors rounded-lg flex-shrink-0">
            <i class="pi pi-sign-out text-sm"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-bold tracking-wider text-white/50 group-hover:text-white transition-colors">Sign Out</span>
            <span class="text-[10px] text-white/30 tracking-wide">{{ profile?.email || 'System' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
      :class="collapsed ? 'lg:ml-20' : 'lg:ml-72'"
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

      <main class="flex-1 p-4 lg:p-12 max-w-[1600px] mx-auto w-full">
        <slot />
      </main>

      <footer class="p-4 lg:p-12 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 text-center sm:text-left">
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

watch(route, () => { mobileOpen.value = false })

watch(mobileOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') mobileOpen.value = false
  }
  document.addEventListener('keydown', handler)
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const navigation = computed(() => [
  { name: 'Dashboard', path: '/', icon: 'pi pi-chart-bar' },
  { name: 'Students', path: '/students', icon: 'pi pi-users' },
  ...(isSuperCoordinator.value ? [{ name: 'Coordinators', path: '/coordinators', icon: 'pi pi-user-plus' }] : []),
  { name: 'Broadcasts', path: '/broadcasts', icon: 'pi pi-megaphone' },
  { name: 'Logbook Status', path: '/logbooks', icon: 'pi pi-file' },
  { name: 'Master Checklist', path: '/checklists', icon: 'pi pi-check-square' },
  { name: 'Knowledge Base', path: '/faqs', icon: 'pi pi-book' },
  { name: 'Cohorts', path: '/cohorts', icon: 'pi pi-calendar' },
  { name: 'Notifications', path: '/notifications', icon: 'pi pi-bell' },
  { name: 'Settings', path: '/settings', icon: 'pi pi-cog' }
])

const currentPageName = computed(() => {
  const item = navigation.value.find(n => n.path === route.path)
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

nav {
  -webkit-overflow-scrolling: touch;
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
