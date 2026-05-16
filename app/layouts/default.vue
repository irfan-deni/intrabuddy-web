<template>
  <div class="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-brand-blue selection:text-white">
    <!-- Fixed Sidebar -->
    <aside
      class="bg-brand-navy text-white flex flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out"
      :class="collapsed ? 'w-20' : 'w-72'"
    >
      <!-- Brand / Logo -->
      <div class="mb-4" :class="collapsed ? 'p-5' : 'p-8'">
        <div class="flex items-center" :class="collapsed ? 'justify-center' : 'gap-3'">
          <div class="bg-white p-1.5 flex-shrink-0">
            <i class="pi pi-graduation-cap text-brand-navy text-xl"></i>
          </div>
          <Transition name="fade-text">
            <span v-if="!collapsed" class="text-lg font-black tracking-tighter uppercase text-white whitespace-nowrap">IntraBuddy</span>
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
            collapsed ? 'justify-center' : '',
            route.path === item.path
              ? 'bg-white text-brand-navy shadow-xl shadow-black/20'
              : 'text-slate-400 hover:text-white'
          ]"
        >
          <i :class="[item.icon, 'text-base flex-shrink-0']"></i>
          <Transition name="fade-text">
            <span v-if="!collapsed">{{ item.name }}</span>
          </Transition>
        </NuxtLink>
      </nav>

      <!-- Collapse Toggle -->
      <div class="px-4 pb-2">
        <button
          class="w-full flex items-center justify-center gap-3 px-4 py-3 text-slate-500 hover:text-white hover:bg-blue-900/30 transition-all cursor-pointer"
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
      <div class="p-6 border-t border-blue-900/50" :class="collapsed ? 'p-4 flex justify-center' : ''">
        <div
          class="flex items-center gap-4 group cursor-pointer"
          :class="collapsed ? 'justify-center' : ''"
          @click="handleLogout"
        >
          <div class="h-10 w-10 bg-blue-900/50 flex items-center justify-center group-hover:bg-white group-hover:text-brand-navy transition-colors flex-shrink-0">
            <i class="pi pi-sign-out text-sm"></i>
          </div>
          <Transition name="fade-text">
            <div v-if="!collapsed" class="flex flex-col">
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
      :class="collapsed ? 'ml-20' : 'ml-72'"
    >
      <!-- Top Header -->
      <header class="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div class="flex items-center gap-4">
          <div class="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-3">
            <span>Internal</span>
            <i class="pi pi-chevron-right text-[8px]"></i>
            <span class="text-black">{{ currentPageName }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-8">
          <div class="flex flex-col items-end">
            <span class="text-[10px] font-black text-black uppercase tracking-widest">{{ profile?.full_name || 'Coordinator' }}</span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{{ role || 'Access Denied' }}</span>
          </div>
          <div class="h-10 w-10 bg-black flex items-center justify-center text-white text-xs font-black">
            {{ (profile?.full_name || 'U').charAt(0).toUpperCase() }}
          </div>
        </div>
      </header>

      <!-- Page Canvas -->
      <main class="flex-1 p-12 max-w-[1600px] mx-auto w-full">
        <slot />
      </main>

      <!-- Minimal Footer -->
      <footer class="p-12 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest">
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
  background: #f8fafc;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
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
