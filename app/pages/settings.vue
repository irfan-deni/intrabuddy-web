<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-5xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <header class="border-b border-stone-200 pb-6">
        <h1 class="text-2xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Settings</h1>
        <p class="text-stone-500 mt-1.5 font-bold uppercase text-[10px] tracking-widest">Account configuration and system administration.</p>
      </header>

      <div class="flex flex-wrap gap-1 border-b border-stone-200 pb-px">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          class="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          :class="activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-stone-500 hover:text-slate-800 hover:bg-stone-100'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'profile'" class="space-y-10">
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

      <div v-if="activeTab === 'cohorts'">
        <article class="bg-white border border-stone-200 shadow-sm">
          <div class="px-6 md:px-10 py-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Manage Academic Semesters</h2>
              <p class="text-stone-400 text-[10px] font-bold uppercase tracking-wider mt-1">Toggle which cohort is currently active.</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50 border-b border-stone-200">
                  <th class="px-8 py-6">Cohort</th>
                  <th class="px-8 py-6">Start Date</th>
                  <th class="px-8 py-6">End Date</th>
                  <th class="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 text-xs">
                <tr v-for="cohort in cohorts" :key="cohort.id" class="hover:bg-stone-50 transition-all group">
                  <td class="px-8 py-6">
                    <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ cohort.name }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="font-bold text-stone-500 tabular-nums text-xs">{{ cohort.startDate }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="font-bold text-stone-500 tabular-nums text-xs">{{ cohort.endDate }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-3">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="cohort.isActive" class="sr-only peer">
                        <div class="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-sky-600 peer-checked:bg-sky-600 transition-all"></div>
                        <div class="absolute left-0.5 top-0.5 h-5 w-5 bg-white shadow-sm transition-transform peer-checked:translate-x-5"></div>
                      </label>
                      <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter" :class="cohort.isActive ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'">
                        {{ cohort.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div v-if="activeTab === 'checklists'">
        <article class="bg-white border border-stone-200 shadow-sm">
          <div class="px-6 md:px-10 py-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Global Onboarding Requirements</h2>
              <p class="text-stone-400 text-[10px] font-bold uppercase tracking-wider mt-1">Define required documents for student onboarding.</p>
            </div>
            <button class="bg-sky-600 text-white h-10 px-6 font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center gap-2">
              <i class="pi pi-plus text-[10px]"></i>
              Add Requirement
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50 border-b border-stone-200">
                  <th class="px-8 py-6">Task Title</th>
                  <th class="px-8 py-6">Description</th>
                  <th class="px-8 py-6">Required</th>
                  <th class="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 text-xs">
                <tr v-for="item in checklistItems" :key="item.id" class="hover:bg-stone-50 transition-all group">
                  <td class="px-8 py-6">
                    <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ item.title }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-stone-500 font-bold text-[10px]">{{ item.description }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span v-if="item.required" class="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-tighter">Required</span>
                    <span v-else class="text-stone-400 font-bold uppercase text-[9px]">Optional</span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button class="h-8 w-8 bg-slate-900 text-white flex items-center justify-center hover:brightness-150 transition-all">
                        <i class="pi pi-pencil text-[10px]"></i>
                      </button>
                      <button class="h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all">
                        <i class="pi pi-trash text-[10px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div v-if="activeTab === 'team'">
        <article class="bg-white border border-stone-200 shadow-sm">
          <div class="px-6 md:px-10 py-6 border-b border-stone-100">
            <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest">Manage Coordinators</h2>
            <p class="text-stone-400 text-[10px] font-bold uppercase tracking-wider mt-1">Staff members with dashboard access.</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] bg-stone-50/50 border-b border-stone-200">
                  <th class="px-8 py-6">Name</th>
                  <th class="px-8 py-6">Email</th>
                  <th class="px-8 py-6">Role</th>
                  <th class="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 text-xs">
                <tr v-for="member in teamMembers" :key="member.id" class="hover:bg-stone-50 transition-all group">
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div class="h-9 w-9 bg-stone-50 border border-stone-200 flex items-center justify-center font-black text-stone-400 text-xs group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {{ member.name.charAt(0) }}
                      </div>
                      <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ member.name }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-stone-500 font-bold text-[10px]">{{ member.email }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter" :class="member.role === 'Super Coordinator' ? 'bg-amber-200 text-amber-900' : 'bg-sky-100 text-sky-800'">
                      {{ member.role }}
                    </span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <button v-if="member.role !== 'Super Coordinator'" class="h-8 px-3 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-wider" @click="handleRevoke(member.id)">
                      <i class="pi pi-ban text-[10px]"></i>
                      Revoke
                    </button>
                    <span v-else class="text-[10px] font-bold text-stone-400 italic uppercase tracking-wider">Protected</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  requiredRole: 'coordinator'
})

const userRole = ref('super_coordinator')
const activeTab = ref('profile')

const tabs = [
  { key: 'profile', label: 'My Profile', roles: ['coordinator', 'super_coordinator'] },
  { key: 'cohorts', label: 'Cohort Management', roles: ['super_coordinator'] },
  { key: 'checklists', label: 'Master Checklists', roles: ['super_coordinator'] },
  { key: 'team', label: 'Team Access', roles: ['super_coordinator'] }
]

const visibleTabs = computed(() =>
  tabs.filter(t => t.roles.includes(userRole.value))
)

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

const cohorts = ref([
  { id: 1, name: 'INTRA Session 1 2026', startDate: '01 Mar 2026', endDate: '31 Aug 2026', isActive: true },
  { id: 2, name: 'INTRA Session 2 2025', startDate: '01 Sep 2025', endDate: '28 Feb 2026', isActive: false },
  { id: 3, name: 'INTRA Session 1 2025', startDate: '01 Mar 2025', endDate: '31 Aug 2025', isActive: false },
  { id: 4, name: 'INTRA Session 2 2024', startDate: '01 Sep 2024', endDate: '28 Feb 2025', isActive: false }
])

const checklistItems = ref([
  { id: 1, title: 'Upload Resume / CV', description: 'Current professional resume in PDF format', required: true },
  { id: 2, title: 'Indemnity Form', description: 'Signed insurance indemnity waiver', required: true },
  { id: 3, title: 'Company Offer Letter', description: 'Official internship offer from host company', required: true },
  { id: 4, title: 'Academic Transcript', description: 'Latest semester transcript', required: false },
  { id: 5, title: 'Emergency Contact Form', description: 'Next-of-kin emergency details', required: true },
  { id: 6, title: 'Passport Photo', description: 'Passport-sized photo for ID card', required: false }
])

const teamMembers = ref([
  { id: 1, name: 'Dr. Sarah Chen', email: 'coordinator@intrabuddy.my', role: 'Super Coordinator' },
  { id: 2, name: 'Ms. Amanda Lee', email: 'amanda.lee@intrabuddy.my', role: 'Coordinator' },
  { id: 3, name: 'Mr. Rajesh Kumar', email: 'rajesh.kumar@intrabuddy.my', role: 'Coordinator' },
  { id: 4, name: 'Ms. Nur Aisyah', email: 'nur.aisyah@intrabuddy.my', role: 'Coordinator' }
])

const handleRevoke = (id: number) => {
  if (confirm('Revoke dashboard access for this coordinator?')) {
    teamMembers.value = teamMembers.value.filter(m => m.id !== id)
  }
}
</script>
