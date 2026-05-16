<template>
  <div class="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-black selection:text-white">
    <!-- Fixed Sidebar -->
    <aside class="w-72 bg-black text-white flex flex-col fixed h-screen z-50">
      <div class="p-8 mb-4">
        <div class="flex items-center gap-3">
          <div class="bg-white p-1.5">
            <i class="pi pi-shield text-black text-xl"></i>
          </div>
          <span class="text-lg font-black tracking-tighter uppercase">IntraBuddy</span>
        </div>
      </div>

      <nav class="flex-1 px-4 space-y-1">
        <NuxtLink 
          v-for="item in navigation" 
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-4 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all group"
          :class="[
            route.path === item.path 
              ? 'bg-white text-black translate-x-1 shadow-xl shadow-black/20' 
              : 'text-slate-500 hover:text-white hover:translate-x-1'
          ]"
        >
          <i :class="[item.icon, 'text-base']"></i>
          {{ item.name }}
        </NuxtLink>
      </nav>

      <div class="p-6 border-t border-slate-900 mt-auto">
        <div class="flex items-center gap-4 group cursor-pointer" @click="handleLogout">
          <div class="h-10 w-10 bg-slate-900 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
            <i class="pi pi-sign-out text-sm"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Sign Out</span>
            <span class="text-[8px] font-bold text-slate-600 uppercase">{{ profile?.email || 'System User' }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="flex-1 ml-72 flex flex-col min-h-screen">
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
/* PrimeIcons in B&W */
.pi {
  vertical-align: middle;
}

/* Custom Scrollbar for Minimalist Look */
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
</style>
