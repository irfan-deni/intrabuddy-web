<template>
  <div class="min-h-screen bg-brand-bg flex font-sans selection:bg-brand-azure selection:text-white">
    <!-- Mobile Overlay -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      @click="mobileOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      class="bg-brand-navy text-white flex flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out"
      :class="[
        isLgScreen
          ? collapsed ? 'w-20' : 'w-72'
          : mobileOpen ? 'left-0' : '-left-80'
      ]"
    >
      <!-- Brand / Logo -->
      <div class="mb-4" :class="collapsed && isLgScreen ? 'p-5' : 'p-8'">
        <div class="flex items-center" :class="collapsed && isLgScreen ? 'justify-center' : 'gap-3'">
          <div class="bg-white p-1.5 flex-shrink-0">
            <i class="pi pi-graduation-cap text-brand-navy text-xl"></i>
          </div>
          <Transition name="fade-text">
            <span v-if="!collapsed || !isLgScreen" class="text-lg font-black tracking-tighter uppercase text-white whitespace-nowrap">IntraBuddy</span>
          </Transition>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 space-y-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-4 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all group rounded-none"
          :class="[
            collapsed && isLgScreen ? 'justify-center' : '',
            route.path === item.path
              ? 'bg-white text-brand-navy shadow-xl shadow-black/20'
              : 'text-white/60 hover:text-white'
          ]"
          @click="mobileOpen = false"
        >
          <i :class="[item.icon, 'text-base flex-shrink-0']"></i>
          <Transition name="fade-text">
            <span v-if="!collapsed || !isLgScreen">{{ item.name }}</span>
          </Transition>
        </NuxtLink>
      </nav>

      <!-- Desktop Collapse Toggle (hidden on mobile) -->
      <div class="px-4 pb-2 hidden lg:block">
        <button
          class="w-full flex items-center justify-center gap-3 px-4 py-3 text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          :class="collapsed ? 'px-0' : ''"
          @click="collapsed = !collapsed"
        >
          <i
            class="pi text-sm transition-transform duration-300"
            :class="collapsed ? 'pi-chevron-right' : 'pi-chevron-left'"
          ></i>
          <Transition name="fade-text">
            <span v-if="!collapsed" class="text-[9px] font-black uppercase tracking-widest">Collapse</span>
          </Transition>
        </button>
      </div>

      <!-- Sign Out -->
      <div class="p-6 border-t border-white/10" :class="collapsed && isLgScreen ? 'p-4 flex justify-center' : ''">
        <div
          class="flex items-center gap-4 group cursor-pointer"
          :class="collapsed && isLgScreen ? 'justify-center' : ''"
          @click="handleLogout"
        >
          <div class="h-10 w-10 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-brand-navy transition-colors flex-shrink-0">
            <i class="pi pi-sign-out text-sm"></i>
          </div>
          <Transition name="fade-text">
            <div v-if="!collapsed || !isLgScreen" class="flex flex-col">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Sign Out</span>
              <span class="text-[8px] font-bold text-slate-600 uppercase">{{ profile?.email || 'System User' }}</span>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div
      class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
      :class="isLgScreen ? (collapsed ? 'ml-20' : 'ml-72') : 'ml-0'"
    >
      <!-- Top Header -->
      <header class="h-16 lg:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div class="flex items-center gap-3 lg:gap-4">
          <!-- Hamburger (mobile only) -->
          <button class="lg:hidden h-10 w-10 flex items-center justify-center text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all" @click="mobileOpen = !mobileOpen">
            <i class="pi pi-bars text-lg"></i>
          </button>
          <div class="hidden sm:flex text-[10px] font-black uppercase tracking-widest text-slate-500 items-center gap-3">
            <span>Internal</span>
            <i class="pi pi-chevron-right text-[8px]"></i>
            <span class="text-black">{{ currentPageName }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-3 lg:gap-8">
          <div class="hidden sm:flex flex-col items-end">
            <span class="text-[10px] font-black text-black uppercase tracking-widest">{{ profile?.full_name || 'Coordinator' }}</span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{{ role || 'Access Denied' }}</span>
          </div>
          <div class="h-9 w-9 lg:h-10 lg:w-10 bg-black flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            {{ (profile?.full_name || 'U').charAt(0).toUpperCase() }}
          </div>
        </div>
      </header>

      <!-- Page Canvas -->
      <main class="flex-1 p-4 sm:p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
        <slot />
      </main>

      <!-- Minimal Footer -->
      <footer class="p-4 sm:p-6 lg:p-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center sm:text-left">
        <span>&copy; 2026 INTRA Buddy Management System</span>
        <span>Version 2.4.0 (Stable)</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentProfile } from '~/composables/useCurrentProfile'

const route = useRoute()
const supabase = useSupabaseClient()
const { profile, role, clearProfile } = useCurrentProfile()

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
  { name: 'FAQ Base', path: '/faqs', icon: 'pi pi-book' }
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
