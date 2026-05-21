<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-3xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <header class="border-b border-stone-200 pb-6">
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Settings</h1>
        <p class="text-stone-500 mt-1.5 font-bold uppercase text-[10px] tracking-widest">Account configuration and security.</p>
      </header>

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
            <button class="bg-sky-600 text-white h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all">Save Profile</button>
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
            <button class="bg-sky-600 text-white h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all">Update Password</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

const profileForm = reactive({
  fullName: 'Dr. Sarah Chen',
  phone: '+60 12-345 6789'
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

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
