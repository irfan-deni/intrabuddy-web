<template>
  <div class="min-h-screen bg-brand-bg flex font-sans selection:bg-brand-azure selection:text-white" :class="{ 'dashboard-layout': route.path === '/' }">
    <aside
      class="hidden lg:flex bg-slate-900 text-white flex-col fixed h-screen z-50 overflow-hidden transition-[width] duration-[240ms] ease-out motion-reduce:transition-none"
      :class="collapsed ? 'w-20 sidebar--collapsed' : 'w-72'"
    >
      <div class="shrink-0 flex min-h-20 items-center gap-2 border-b border-white/10 px-4 py-4" :class="collapsed ? 'justify-center' : ''">
        <div v-show="!collapsed" class="sidebar-brand flex min-w-0 flex-1 items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-900">
            <i class="pi pi-graduation-cap text-lg"></i>
          </div>
          <div class="sidebar-copy flex flex-col">
            <span class="text-sm font-bold tracking-wide text-white whitespace-nowrap">INTRA BUDDY</span>
            <span class="mt-0.5 text-xs font-medium text-slate-400 whitespace-nowrap">Coordinator portal</span>
          </div>
        </div>
        <button
          type="button"
          class="sidebar-collapse-control flex h-11 w-11 shrink-0 items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-expanded="!collapsed"
          :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="collapsed = !collapsed"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path :d="collapsed ? 'm14 10 2 2-2 2' : 'm16 10-2 2 2 2'" />
          </svg>
        </button>
      </div>

      <nav class="flex-1 min-h-0 px-4 py-4 space-y-3 overflow-x-hidden overflow-y-auto" aria-label="Primary navigation">
        <div v-for="group in navigationGroups" :key="group.id">
          <div
            v-if="group.label"
            class="sidebar-section-label px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
          >
            {{ group.label }}
          </div>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              :aria-label="collapsed ? item.name : undefined"
              :title="collapsed ? item.name : undefined"
              :aria-current="isActive(item) ? 'page' : undefined"
              class="sidebar-nav-link relative flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium tracking-normal transition-colors"
              :class="[
                isActive(item)
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              ]"
              @mouseenter="prefetchRoute(item.path)"
              @focus="prefetchRoute(item.path)"
            >
              <i aria-hidden="true" :class="[item.icon, 'w-5 text-center text-lg flex-shrink-0']"></i>
              <span class="sidebar-copy min-w-0">{{ item.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </nav>

    </aside>

    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      @click="mobileOpen = false"
    ></div>

    <div
      id="mobile-sidebar"
      :inert="!mobileOpen"
      class="fixed top-0 left-0 h-dvh z-50 flex flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out motion-reduce:transition-none lg:hidden"
      :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
      style="width: 288px"
    >
      <div class="flex min-h-20 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-900">
            <i class="pi pi-graduation-cap text-lg"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold tracking-wide text-white whitespace-nowrap">INTRA BUDDY</span>
            <span class="mt-0.5 text-xs font-medium text-slate-400">Coordinator portal</span>
          </div>
        </div>
        <button type="button" aria-label="Close navigation" class="sidebar-collapse-control h-11 w-11 shrink-0 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors rounded-lg" @click="mobileOpen = false">
          <i class="pi pi-times text-sm"></i>
        </button>
      </div>

      <nav class="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3" aria-label="Primary navigation">
        <div v-for="group in navigationGroups" :key="group.id">
          <div v-if="group.label" class="sidebar-section-label px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {{ group.label }}
          </div>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              :aria-current="isActive(item) ? 'page' : undefined"
              class="sidebar-nav-link flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium tracking-normal transition-colors"
              :class="[
                isActive(item)
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              ]"
              @mouseenter="prefetchRoute(item.path)"
              @focus="prefetchRoute(item.path)"
              @click="mobileOpen = false"
            >
              <i aria-hidden="true" :class="[item.icon, 'w-5 text-center text-lg flex-shrink-0']"></i>
              <span>{{ item.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </nav>

    </div>

    <div
      class="flex-1 min-w-0 flex flex-col min-h-screen transition-[margin] duration-[240ms] ease-out motion-reduce:transition-none"
      :class="collapsed ? 'lg:ml-20' : 'lg:ml-72'"
    >
      <header class="h-16 bg-surface border-b border-surface-border flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30">
        <div class="flex min-w-0 items-center gap-3 lg:gap-4">
          <button type="button" aria-label="Open navigation" aria-controls="mobile-sidebar" :aria-expanded="mobileOpen" class="lg:hidden h-11 w-11 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all rounded-lg" @click="mobileOpen = !mobileOpen">
            <i class="pi pi-bars text-lg"></i>
          </button>
          <div v-if="activeSemesterName !== null" class="min-w-0 truncate text-sm text-text-muted">
            <span class="hidden sm:inline">Active semester · </span><span class="font-semibold text-slate-800">{{ activeSemesterName || 'No active semester' }}</span>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <NuxtLink
            to="/inbox"
            aria-label="Notifications"
            :aria-current="route.path === '/inbox' ? 'page' : undefined"
            class="relative flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
            @mouseenter="prefetchRoute('/inbox')"
            @focus="prefetchRoute('/inbox')"
          >
            <i aria-hidden="true" class="pi pi-bell text-lg"></i>
            <span v-if="unreadCount > 0" class="absolute right-0 top-0 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </NuxtLink>
          <div ref="accountMenuRoot" class="relative shrink-0">
          <button
            ref="accountMenuTrigger"
            type="button"
            class="flex h-11 items-center gap-2 rounded-lg px-1.5 sm:px-2 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors"
            aria-label="Open account menu"
            aria-controls="account-menu"
            :aria-expanded="accountMenuOpen"
            @click="toggleAccountMenu"
            @keydown.arrow-down.prevent="openAccountMenu(true)"
          >
            <div class="h-9 w-9 bg-slate-800 flex items-center justify-center text-white text-sm font-bold rounded-lg flex-shrink-0">
              {{ (profile?.full_name || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="hidden sm:flex min-w-0 max-w-40 flex-col items-start text-left">
              <span class="max-w-full truncate text-sm font-semibold text-slate-800">{{ profile?.full_name || 'Coordinator' }}</span>
              <span class="max-w-full truncate text-xs font-medium text-text-muted">{{ isSuperCoordinator ? 'Super coordinator' : (role || 'Coordinator') }}</span>
            </div>
            <i aria-hidden="true" class="hidden sm:block pi pi-chevron-down ml-1 text-[10px] text-text-muted transition-transform duration-150" :class="accountMenuOpen ? 'rotate-180' : ''" />
          </button>

          <Transition name="account-menu">
            <div
              v-if="accountMenuOpen"
              id="account-menu"
              class="rounded-card absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden border border-surface-border bg-surface shadow-xl"
              @keydown="handleAccountMenuKeydown"
            >
              <div class="p-4 border-b border-surface-border">
                <p class="text-sm font-bold text-slate-800 truncate">{{ profile?.full_name || 'Coordinator' }}</p>
                <p class="mt-1 text-xs text-text-muted truncate">{{ profile?.email || '' }}</p>
                <p class="mt-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {{ role || 'Coordinator' }}<span v-if="isSuperCoordinator"> · Super</span>
                </p>
              </div>
              <div class="p-2">
                <button ref="accountSettingsButton" type="button" class="rounded-control w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-surface-hover focus-visible:outline-none focus-visible:bg-surface-hover" @click="goToSettings">
                  <i aria-hidden="true" class="pi pi-cog text-sm text-text-muted" />
                  Account settings
                </button>
                <button ref="accountSignOutButton" type="button" class="rounded-control w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:bg-red-50 disabled:opacity-50" :disabled="isSigningOut" @click="handleLogout">
                  <i aria-hidden="true" class="pi pi-sign-out text-sm" />
                  {{ isSigningOut ? 'Signing out...' : 'Sign out' }}
                </button>
              </div>
            </div>
          </Transition>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 lg:p-12 max-w-[1600px] mx-auto w-full">
        <slot />
      </main>

      <footer class="p-4 lg:p-12 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted text-center sm:text-left">
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
const { unreadCount, fetchInitialCount, setupRealtimeListener, cleanup } = useNotifications()
const pageCache = usePageCache()
const activeSemesterName = useState<string | null>('active-semester-name', () => null)

const loadActiveSemester = async () => {
  const { data, error } = await supabase.from('semesters').select('name').eq('is_active', true).maybeSingle()
  if (!error) activeSemesterName.value = data?.name || ''
}

const collapsed = ref(false)
const mobileOpen = ref(false)
const accountMenuOpen = ref(false)
const isSigningOut = ref(false)
const accountMenuRoot = ref<HTMLElement | null>(null)
const accountMenuTrigger = ref<HTMLButtonElement | null>(null)
const accountSettingsButton = ref<HTMLButtonElement | null>(null)
const accountSignOutButton = ref<HTMLButtonElement | null>(null)

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  mobileOpen.value = false
  if (accountMenuOpen.value) closeAccountMenu(true)
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (accountMenuRoot.value && !accountMenuRoot.value.contains(event.target as Node)) closeAccountMenu()
}

const prefetchRoute = (path: string) => {
  const requests: Record<string, string[]> = {
    '/': ['/api/dashboard'],
    '/students': ['/api/students'],
    '/logbooks': ['/api/logbooks'],
    '/communications': ['/api/broadcasts'],
    '/inbox': ['/api/notifications'],
    '/checklists': ['/api/checklists'],
    '/faqs': ['/api/faqs']
  }
  for (const url of requests[path] || []) void pageCache.fetch(url).catch(() => {})
}

watch(route, () => {
  mobileOpen.value = false
  accountMenuOpen.value = false
  void loadActiveSemester()
})

watch(mobileOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(async () => {
  void loadActiveSemester()
  await fetchInitialCount()
  setupRealtimeListener()
  document.addEventListener('keydown', handleDocumentKeydown)
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleDocumentKeydown)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  cleanup()
})

const navigationGroups = computed(() => [
  {
    id: 'dashboard',
    label: null,
    items: [
      { name: 'Dashboard', path: '/', icon: 'pi pi-chart-bar' }
    ]
  },
  {
    id: 'student-management',
    label: 'Student management',
    items: [
      { name: 'Students', path: '/students', icon: 'pi pi-users' },
      { name: 'Logbooks', path: '/logbooks', icon: 'pi pi-file' },
      { name: 'Checklists', path: '/checklists', icon: 'pi pi-check-square' }
    ]
  },
  {
    id: 'communication',
    label: 'Student communications',
    items: [
      { name: 'Announcements', path: '/communications', icon: 'pi pi-megaphone' },
      { name: 'FAQs', path: '/faqs', icon: 'pi pi-book' }
    ]
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { name: 'Semesters', path: '/semesters', icon: 'pi pi-calendar' },
      ...(isSuperCoordinator.value ? [{ name: 'Coordinators', path: '/coordinators', icon: 'pi pi-user-plus' }] : [])
    ]
  }
].filter(group => group.items.length > 0))

const isActive = (item: { path: string }) => {
  if (item.path === '/') return route.path === '/'
  return route.path === item.path || route.path.startsWith(`${item.path}/`)
}

const handleLogout = async () => {
  if (isSigningOut.value) return
  isSigningOut.value = true
  accountMenuOpen.value = false
  try {
    await supabase.auth.signOut()
    clearProfile()
    await navigateTo('/login')
  } finally {
    isSigningOut.value = false
  }
}

const closeAccountMenu = (restoreFocus = false) => {
  if (!accountMenuOpen.value) return
  accountMenuOpen.value = false
  if (restoreFocus) nextTick(() => accountMenuTrigger.value?.focus())
}

const openAccountMenu = async (focusFirstAction = false) => {
  accountMenuOpen.value = true
  if (focusFirstAction) {
    await nextTick()
    accountSettingsButton.value?.focus()
  }
}

const toggleAccountMenu = () => {
  if (accountMenuOpen.value) closeAccountMenu()
  else openAccountMenu()
}

const goToSettings = async () => {
  closeAccountMenu()
  await navigateTo('/settings')
}

const handleAccountMenuKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  const actions = [accountSettingsButton.value, accountSignOutButton.value].filter((action): action is HTMLButtonElement => Boolean(action))
  const current = actions.indexOf(document.activeElement as HTMLButtonElement)
  const next = event.key === 'ArrowDown'
    ? actions[(current + 1) % actions.length]
    : actions[(current - 1 + actions.length) % actions.length]
  next?.focus()
}
</script>

<style>
@media (min-width: 1024px) {
  .dashboard-layout main {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .dashboard-layout footer {
    padding: 0.75rem 1.5rem;
  }
}

.sidebar-copy {
  max-width: 12rem;
  min-width: 0;
  overflow: hidden;
  opacity: 1;
  transform: translateX(0) scale(1);
  transform-origin: left center;
  transition: opacity 120ms ease-out, transform 180ms ease-out;
}

.sidebar--collapsed .sidebar-copy {
  position: absolute;
  width: 0;
  max-width: 0;
  opacity: 0;
  transform: translateX(-0.25rem) scale(0.98);
  pointer-events: none;
}

.sidebar--collapsed .sidebar-nav-link,
.sidebar--collapsed .sidebar-collapse-control {
  justify-content: center;
  gap: 0;
}

.sidebar--collapsed .sidebar-nav-link,
.sidebar--collapsed .sidebar-collapse-control {
  padding-left: 0;
  padding-right: 0;
}

.sidebar-nav-link:focus-visible,
.sidebar-collapse-control:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: -2px;
}

.sidebar-section-label {
  height: 1.5rem;
  position: relative;
  opacity: 1;
  transition: color 120ms ease-out;
  white-space: nowrap;
}

.sidebar-section-label::after {
  content: '';
  position: absolute;
  top: 0.65rem;
  left: 0.5rem;
  right: 0.5rem;
  border-top: 1px solid rgb(255 255 255 / 0);
  transition: border-color 120ms ease-out;
}

.sidebar--collapsed .sidebar-section-label {
  color: transparent;
}

.sidebar--collapsed .sidebar-section-label::after {
  border-color: rgb(255 255 255 / 0.1);
}

.account-menu-enter-active,
.account-menu-leave-active {
  transition: opacity 120ms ease-out, transform 120ms ease-out;
}

.account-menu-enter-from,
.account-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-copy,
  .sidebar-section-label,
  .sidebar-section-label::after {
    transition: none;
  }

  .account-menu-enter-active,
  .account-menu-leave-active {
    transition: none;
  }
}

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
  background: #EEF1F4;
}
::-webkit-scrollbar-thumb {
  background: #94A3B8;
}
::-webkit-scrollbar-thumb:hover {
  background: #64748B;
}

</style>
