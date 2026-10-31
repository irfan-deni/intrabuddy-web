<template>
  <div class="app-surface-ui min-h-screen bg-surface-canvas">
    <div class="max-w-3xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <header>
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Settings</h1>
        <p class="text-text-muted mt-1.5 font-bold uppercase text-[10px] tracking-widest">Account configuration and security.</p>
      </header>

      <div v-if="successMessage" class="rounded-card p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="rounded-card p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
        {{ errorMessage }}
      </div>

      <article class="rounded-card bg-surface border border-surface-border shadow-sm">
        <div class="px-6 md:px-10 py-6 border-b border-surface-border">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Personal Information</h2>
          <p class="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-1">Update your profile details.</p>
        </div>
        <div class="px-6 md:px-10 py-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Email Address</label>
              <input :value="profile?.email" type="text" readonly class="rounded-control w-full bg-surface-muted text-text-muted cursor-not-allowed border border-surface-control px-5 py-4 text-xs font-black uppercase outline-none">
            </div>
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">System Role</label>
              <input :value="role" type="text" readonly class="rounded-control w-full bg-surface-muted text-text-muted cursor-not-allowed border border-surface-control px-5 py-4 text-xs font-black uppercase outline-none">
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Full Name</label>
              <input v-model="profileForm.fullName" type="text" class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-xs font-black uppercase focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
            </div>
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Phone Number</label>
              <input v-model="profileForm.phone" type="text" placeholder="+60 12-345 6789" class="rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-xs font-black uppercase focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
            </div>
          </div>
          <div class="pt-2">
            <button
              class="rounded-control bg-sky-700 text-white h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-800 transition-all disabled:opacity-30"
              :disabled="isSavingProfile"
              @click="saveProfile"
            >
              {{ isSavingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </div>
      </article>

      <article class="rounded-card bg-surface border border-surface-border shadow-sm">
        <div class="px-6 md:px-10 py-6 border-b border-surface-border">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Security</h2>
          <p class="text-text-muted text-[10px] font-bold uppercase tracking-wider mt-1">Change your account password.</p>
        </div>
        <div class="px-6 md:px-10 py-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Current Password</label>
              <Password v-model="passwordForm.currentPassword" toggleMask :feedback="false" :pt="passwordPt" />
            </div>
            <div class="space-y-1.5"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">New Password</label>
              <Password v-model="passwordForm.newPassword" toggleMask :feedback="true" :pt="passwordPt" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Confirm Password</label>
              <Password v-model="passwordForm.confirmPassword" toggleMask :feedback="false" :pt="passwordPt" />
            </div>
          </div>
          <div class="pt-2">
            <button
              class="rounded-control bg-sky-700 text-white h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-800 transition-all disabled:opacity-30"
              :disabled="isUpdatingPassword"
              @click="updatePassword"
            >
              {{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'

definePageMeta({
  requiredRole: 'coordinator'
})

const supabase = useSupabaseClient<Database>()
const { profile, loadProfile } = useCurrentProfile()

const profileForm = reactive({
  fullName: profile.value?.full_name || '',
  phone: profile.value?.phone_number || ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isSavingProfile = ref(false)
const isUpdatingPassword = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const saveProfile = async () => {
  isSavingProfile.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user?.id) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('users')
      .update({
        full_name: profileForm.fullName,
        phone_number: profileForm.phone || null
      })
      .eq('id', userData.user.id)
    if (error) throw error
    await loadProfile()
    successMessage.value = 'Profile updated'
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save profile'
  } finally {
    isSavingProfile.value = false
  }
}

const { isSuperCoordinator } = useCoordinatorPrivileges()

const role = computed(() => {
  if (isSuperCoordinator.value) return 'Super Coordinator'
  if (profile.value?.role === 'coordinator') return 'Coordinator'
  return profile.value?.role || '—'
})

const updatePassword = async () => {
  if (!passwordForm.currentPassword) {
    errorMessage.value = 'Current password is required'
    return
  }
  if (!passwordForm.newPassword) {
    errorMessage.value = 'New password is required'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    errorMessage.value = 'Passwords do not match'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    return
  }

  isUpdatingPassword.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.value?.email || '',
      password: passwordForm.currentPassword
    })
    if (signInError) throw new Error('Current password is incorrect')

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    })
    if (error) throw error
    successMessage.value = 'Password updated'
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update password'
  } finally {
    isUpdatingPassword.value = false
  }
}

const inputClass = 'rounded-control w-full bg-surface-muted border border-surface-control px-5 py-4 text-xs font-black uppercase focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800'

const passwordPt = {
  root: { class: 'relative w-full' },
  pcInputText: {
    root: { class: [inputClass, 'pr-12'] }
  },
  maskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-slate-800 transition-colors w-5 h-5' },
  unmaskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-slate-800 transition-colors w-5 h-5' },
  overlay: { class: 'rounded-control bg-surface border border-surface-border p-4 shadow-lg text-text-primary' }
}
</script>
