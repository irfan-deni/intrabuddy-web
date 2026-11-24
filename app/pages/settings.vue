<template>
  <div class="app-surface-ui space-y-5 md:space-y-6">
    <PortalPageHeader title="Settings" icon="pi-cog" description="Manage your account details and security." />
    <div class="max-w-3xl space-y-5">

      <div v-if="successMessage" role="status" class="rounded-card border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" role="alert" class="rounded-card border border-rose-100 bg-rose-50 p-4 text-sm font-medium text-rose-700">
        {{ errorMessage }}
      </div>

      <article class="rounded-card bg-surface border border-surface-border shadow-sm">
        <div class="border-b border-surface-border p-4 sm:p-6">
          <PortalSectionHeading title="Personal Information" icon="pi-user" description="Update your profile details." />
        </div>
        <div class="space-y-5 p-4 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label for="settings-email" class="portal-field-label">Email address</label>
              <input id="settings-email" :value="profile?.email" type="text" readonly class="portal-field cursor-not-allowed text-text-muted">
            </div>
            <div class="space-y-1.5">
              <label for="settings-role" class="portal-field-label">System role</label>
              <input id="settings-role" :value="role" type="text" readonly class="portal-field cursor-not-allowed text-text-muted">
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label for="settings-name" class="portal-field-label">Full name</label>
              <input id="settings-name" v-model="profileForm.fullName" type="text" autocomplete="name" class="portal-field">
            </div>
            <div class="space-y-1.5">
              <label for="settings-phone" class="portal-field-label">Phone number</label>
              <input id="settings-phone" v-model="profileForm.phone" type="tel" autocomplete="tel" placeholder="+60 12-345 6789" class="portal-field">
            </div>
          </div>
          <div class="pt-2">
            <button
              class="portal-primary-action"
              :disabled="isSavingProfile"
              @click="saveProfile"
            >
              {{ isSavingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </div>
      </article>

      <article class="rounded-card bg-surface border border-surface-border shadow-sm">
        <div class="border-b border-surface-border p-4 sm:p-6">
          <PortalSectionHeading title="Security" icon="pi-lock" tone="teal" description="Change your account password." />
        </div>
        <div class="space-y-5 p-4 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label for="settings-current-password" class="portal-field-label">Current password</label>
              <Password v-model="passwordForm.currentPassword" inputId="settings-current-password" autocomplete="current-password" toggleMask :feedback="false" :pt="passwordPt" />
            </div>
            <div class="space-y-1.5"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label for="settings-new-password" class="portal-field-label">New password</label>
              <Password v-model="passwordForm.newPassword" inputId="settings-new-password" autocomplete="new-password" toggleMask :feedback="true" :pt="passwordPt" />
            </div>
            <div class="space-y-1.5">
              <label for="settings-confirm-password" class="portal-field-label">Confirm password</label>
              <Password v-model="passwordForm.confirmPassword" inputId="settings-confirm-password" autocomplete="new-password" toggleMask :feedback="false" :pt="passwordPt" />
            </div>
          </div>
          <div class="pt-2">
            <button
              class="portal-primary-action"
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

const passwordPt = {
  root: { class: 'relative w-full' },
  pcInputText: {
    root: { class: 'portal-field pr-12' }
  },
  maskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-slate-800 transition-colors w-5 h-5' },
  unmaskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-slate-800 transition-colors w-5 h-5' },
  overlay: { class: 'rounded-control bg-surface border border-surface-border p-4 shadow-lg text-text-primary' }
}
</script>
