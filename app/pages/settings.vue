<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-3xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <header class="border-b border-stone-200 pb-6">
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Settings</h1>
        <p class="text-stone-500 mt-1.5 font-bold uppercase text-[10px] tracking-widest">Account configuration and security.</p>
      </header>

      <div v-if="successMessage" class="p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
        {{ errorMessage }}
      </div>

      <article class="bg-white border border-stone-200 shadow-sm">
        <div class="px-6 md:px-10 py-6 border-b border-stone-100">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Personal Information</h2>
          <p class="text-stone-400 text-[10px] font-bold uppercase tracking-wider mt-1">Update your profile details.</p>
        </div>
        <div class="px-6 md:px-10 py-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Full Name</label>
              <input v-model="profileForm.fullName" type="text" class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
            </div>
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Phone Number</label>
              <input v-model="profileForm.phone" type="text" placeholder="+60 12-345 6789" class="w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800">
            </div>
          </div>
          <div class="pt-2">
            <button
              class="bg-sky-600 text-white h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-30"
              :disabled="isSavingProfile"
              @click="saveProfile"
            >
              {{ isSavingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </div>
      </article>

      <article class="bg-white border border-stone-200 shadow-sm">
        <div class="px-6 md:px-10 py-6 border-b border-stone-100">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Security</h2>
          <p class="text-stone-400 text-[10px] font-bold uppercase tracking-wider mt-1">Change your account password.</p>
        </div>
        <div class="px-6 md:px-10 py-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">New Password</label>
              <Password v-model="passwordForm.newPassword" toggleMask :feedback="true" :pt="passwordPt" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-stone-500 uppercase tracking-widest">Confirm Password</label>
              <Password v-model="passwordForm.confirmPassword" toggleMask :feedback="false" :pt="passwordPt" />
            </div>
          </div>
          <div class="pt-2">
            <button
              class="bg-sky-600 text-white h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-30"
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

const updatePassword = async () => {
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
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    })
    if (error) throw error
    successMessage.value = 'Password updated'
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update password'
  } finally {
    isUpdatingPassword.value = false
  }
}

const inputClass = 'w-full bg-stone-50 border border-stone-200 px-5 py-4 text-xs font-black uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 outline-none transition-all text-slate-800'

const passwordPt = {
  root: { class: 'relative w-full' },
  pcInputText: {
    root: { class: [inputClass, 'pr-12'] }
  },
  maskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-slate-800 transition-colors w-5 h-5' },
  unmaskIcon: { class: 'absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-stone-400 hover:text-slate-800 transition-colors w-5 h-5' }
}
</script>
