<template>
  <div class="app-surface-ui space-y-6 md:space-y-8">
    <PortalPageHeader title="Checklists" icon="pi-check-square" description="Manage the requirement template and track every student's completion.">
      <template #actions>
        <div class="grid w-full gap-1.5 sm:w-56">
          <label for="checklist-semester" class="text-sm font-semibold text-text-muted">Semester</label>
          <select
            id="checklist-semester"
            v-model.number="selectedSemesterId"
            class="rounded-control h-11 w-full min-w-0 cursor-pointer border border-surface-control bg-surface-muted px-3 text-sm font-normal text-text-primary focus:border-sky-700 focus:ring-1 focus:ring-sky-700 disabled:opacity-50"
            :disabled="!semesters.length || isLoading"
            @change="onSemesterChange"
          >
            <option v-for="semester in semesters" :key="semester.id" :value="semester.id">
              {{ semester.name }}{{ semester.is_active ? ' (Active)' : '' }}
            </option>
          </select>
        </div>
      </template>
    </PortalPageHeader>

    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3">
      <div class="rounded-control grid w-full grid-cols-2 gap-1 border border-surface-border bg-surface-muted p-1 sm:w-auto" role="tablist" aria-label="Checklist view">
        <button
          type="button"
          role="tab"
          :aria-selected="viewMode === 'templates'"
          class="rounded-control min-h-11 px-3 text-sm font-semibold transition-colors sm:px-4"
          :class="viewMode === 'templates' ? 'bg-slate-900 text-white' : 'text-text-muted hover:text-slate-800'"
          @click="setView('templates')"
        >
          Requirement Templates
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="viewMode === 'students'"
          class="rounded-control min-h-11 px-3 text-sm font-semibold transition-colors sm:px-4"
          :class="viewMode === 'students' ? 'bg-slate-900 text-white' : 'text-text-muted hover:text-slate-800'"
          @click="setView('students')"
        >
          Student Progress
        </button>
      </div>
      <div v-if="viewMode === 'templates' && isSuperCoordinator" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-control inline-flex h-11 items-center gap-2 whitespace-nowrap border border-surface-control bg-surface px-3 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-50 sm:px-4"
          :disabled="isImporting || !selectedSemesterId"
          @click="importTemplate"
        >
          <i aria-hidden="true" class="pi pi-copy hidden sm:inline-block"></i>
          {{ isImporting ? 'Importing...' : 'Import Template' }}
        </button>
        <button
          type="button"
          class="rounded-control inline-flex h-11 items-center gap-2 whitespace-nowrap bg-sky-700 px-3 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50 sm:px-4"
          :disabled="!selectedSemesterId"
          @click="openAddForm"
        >
          <i aria-hidden="true" class="pi pi-plus hidden sm:inline-block"></i>
          New Requirement
        </button>
      </div>
      <button
        v-if="viewMode === 'students'"
        type="button"
        class="rounded-control inline-flex min-h-11 items-center gap-2 border border-surface-control bg-surface px-3 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-50 sm:px-4"
        :disabled="!selectedSemesterId"
        @click="downloadNonComplianceReport"
      >
        <i aria-hidden="true" class="pi pi-file-pdf"></i>
        Export Non-Compliance PDF
      </button>
    </div>

    <div v-if="errorMessage" class="rounded-card p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest flex items-center justify-between gap-4">
      <span>{{ errorMessage }}</span>
      <button type="button" class="rounded-control shrink-0 border border-rose-300 px-3 py-2 hover:bg-rose-100 transition-colors" @click="loadTemplates(true)">Retry</button>
    </div>

    <div v-if="successMessage" class="rounded-card p-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
      {{ successMessage }}
    </div>

    <!-- Requirement templates -->
    <template v-if="viewMode === 'templates'">
      <div role="group" aria-label="Requirement filters" class="flex flex-wrap items-center gap-3">
        <div class="relative group min-w-0 basis-full md:grow md:basis-64">
          <i aria-hidden="true" class="pi pi-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted group-focus-within:text-sky-700"></i>
          <input
            v-model="searchQuery"
            type="search"
            aria-label="Search requirements"
            placeholder="Search requirements..."
            class="rounded-control h-11 w-full border border-surface-control bg-surface-muted pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
          >
        </div>
        <div class="inline-flex flex-wrap gap-1">
          <button
            v-for="option in requiredFilterOptions"
            :key="option.value"
            type="button"
            class="rounded-control min-h-11 px-2.5 text-sm font-semibold transition-colors sm:px-3"
            :class="requiredFilter === option.value ? 'bg-slate-900 text-white' : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'"
            :aria-pressed="requiredFilter === option.value"
            @click="requiredFilter = option.value"
          >
            {{ option.label }} ({{ filterCounts[option.value] }})
          </button>
        </div>
        <p v-if="filtersActive && isSuperCoordinator && templates.length" class="basis-full text-sm text-text-muted">
          Clear the search and filter to reorder requirements.
        </p>
      </div>

      <article class="rounded-card bg-surface border border-surface-border shadow-sm relative overflow-hidden">
        <div
          v-if="isSuperCoordinator && (filteredTemplates.length || selectedIds.length)"
          role="group"
          aria-label="Requirement selection"
          class="flex flex-wrap items-center justify-end gap-2 border-b border-surface-border px-4 py-2"
          :class="{ 'md:hidden': !selectedIds.length }"
        >
          <button
            type="button"
            class="rounded-control min-h-11 border border-surface-control px-3 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-50 md:hidden"
            :disabled="!filteredTemplates.length"
            @click="toggleSelectAll"
          >
            {{ allFilteredSelected ? (filtersActive ? 'Clear visible selection' : 'Clear selection') : (filtersActive ? 'Select all visible' : 'Select all') }}
          </button>
          <button
            v-if="selectedIds.length"
            type="button"
            class="rounded-control min-h-11 bg-rose-700 px-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
            :disabled="isBulkDeleting"
            @click="deleteSelected"
          >
            {{ isBulkDeleting ? 'Deleting...' : `Delete selected (${selectedIds.length})` }}
          </button>
        </div>
        <div v-if="isLoading" class="rounded-card absolute inset-0 bg-surface/70 z-10 flex items-center justify-center backdrop-blur-sm">
          <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
        </div>

        <div v-if="isLoading" class="p-12 text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
        </div>

        <div v-else-if="templates.length === 0" class="py-12 md:py-20 text-center text-text-muted font-black uppercase tracking-widest text-[10px]">No templates defined</div>

        <template v-else>
          <div class="block md:hidden space-y-3 p-4">
            <div v-if="filteredTemplates.length === 0" class="py-8 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">No matching requirements</div>
            <div
              v-for="(item, index) in filteredTemplates" :key="item.id"
              :draggable="!isDragDisabled"
              class="rounded-card bg-surface-muted border border-surface-border p-4"
              :class="{ 'opacity-50': draggedItemIndex === index, 'cursor-move': !isDragDisabled }"
              @dragstart="onDragStart(index)"
              @dragenter.prevent="onDragEnter(index)"
              @dragover.prevent
              @drop="onDrop(index)"
              @dragend="onDragEnd"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    v-if="isSuperCoordinator"
                    type="checkbox"
                    class="mt-1 rounded border-surface-control text-sky-700 focus:ring-sky-700"
                    :checked="isSelected(item.id)"
                    :aria-label="`Select ${item.title}`"
                    @change="toggleSelected(item.id)"
                  >
                  <div class="min-w-0 flex-1">
                    <div class="font-black text-slate-800 uppercase tracking-tight text-sm">{{ item.title }}</div>
                    <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">{{ item.description || 'No additional details' }}</div>
                    <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">Order {{ item.display_order }} · {{ phaseLabel(item.phase) }} · Due {{ dueLabel(item) }}</div>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    v-if="isSuperCoordinator"
                    type="button"
                    class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border transition-colors disabled:opacity-50"
                    :class="item.required ? 'bg-slate-900 text-white border-slate-900' : 'bg-surface-muted text-text-muted border-surface-border'"
                    :disabled="togglingRequiredId === item.id"
                    @click="toggleRequired(item)"
                  >
                    {{ item.required ? 'Required' : 'Optional' }}
                  </button>
                  <span v-else class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border" :class="item.required ? 'bg-slate-900 text-white border-slate-900' : 'bg-surface-muted text-text-muted border-surface-border'">
                    {{ item.required ? 'Required' : 'Optional' }}
                  </span>
                  <div v-if="isSuperCoordinator" class="flex gap-2 mt-2">
                    <button class="rounded-control h-7 w-7 bg-slate-900 text-white flex items-center justify-center" title="Edit requirement" @click="openEditForm(item)">
                      <i class="pi pi-pencil text-[8px]"></i>
                    </button>
                    <button class="rounded-control h-7 w-7 border border-slate-900 text-slate-800 flex items-center justify-center" title="Duplicate requirement" @click="duplicateTemplate(item)">
                      <i class="pi pi-copy text-[8px]"></i>
                    </button>
                    <button class="rounded-control h-7 w-7 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center" title="Delete requirement" @click="deleteTemplate(item.id)">
                      <i class="pi pi-trash text-[8px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="app-table-header">
                  <th v-if="isSuperCoordinator" class="px-4 w-10">
                    <input
                      type="checkbox"
                      class="rounded border-surface-control text-sky-700 focus:ring-sky-700"
                      :checked="allFilteredSelected"
                      aria-label="Select all visible requirements"
                      :disabled="!filteredTemplates.length"
                      @change="toggleSelectAll"
                    >
                  </th>
                  <th v-if="isSuperCoordinator" class="px-4 w-12"></th>
                  <th class="px-8">Order</th>
                  <th class="px-8">Requirement Title</th>
                  <th class="px-8">Phase</th>
                  <th class="px-8">Mandatory</th>
                  <th class="px-8">Due</th>
                  <th v-if="isSuperCoordinator" class="px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-border text-xs">
                <tr v-if="filteredTemplates.length === 0">
                  <td :colspan="isSuperCoordinator ? 8 : 5" class="px-8 py-16 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">No matching requirements</td>
                </tr>
                <tr
                  v-for="(item, index) in filteredTemplates" :key="item.id"
                  :draggable="!isDragDisabled"
                  class="hover:bg-surface-hover transition-all group"
                  :class="{ 'opacity-50': draggedItemIndex === index, 'ring-2 ring-sky-500': draggedOverItemIndex === index && draggedItemIndex !== null, 'cursor-move': !isDragDisabled }"
                  @dragstart="onDragStart(index)"
                  @dragenter.prevent="onDragEnter(index)"
                  @dragover.prevent
                  @drop="onDrop(index)"
                  @dragend="onDragEnd"
                >
                  <td v-if="isSuperCoordinator" class="px-4 py-6">
                    <input
                      type="checkbox"
                      class="rounded border-surface-control text-sky-700 focus:ring-sky-700"
                      :checked="isSelected(item.id)"
                      :aria-label="`Select ${item.title}`"
                      @change="toggleSelected(item.id)"
                    >
                  </td>
                  <td v-if="isSuperCoordinator" class="px-4 py-6">
                    <span class="inline-flex text-text-muted transition-colors" :class="isDragDisabled ? 'opacity-30' : 'cursor-move hover:text-slate-800'">
                      <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
                        <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
                        <circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
                      </svg>
                    </span>
                  </td>
                  <td class="px-8 py-6 font-black text-text-muted tabular-nums">{{ item.display_order }}</td>
                  <td class="px-8 py-6">
                    <div class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ item.title }}</div>
                    <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">{{ item.description || 'No additional details' }}</div>
                  </td>
                  <td class="px-8 py-6 text-[10px] font-bold text-text-muted uppercase">{{ phaseLabel(item.phase) }}</td>
                  <td class="px-8 py-6">
                    <button
                      v-if="isSuperCoordinator"
                      type="button"
                      class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border transition-colors disabled:opacity-50"
                      :class="item.required ? 'bg-slate-900 text-white border-slate-900' : 'bg-surface-muted text-text-muted border-surface-border'"
                      :disabled="togglingRequiredId === item.id"
                      :title="item.required ? 'Click to make optional' : 'Click to make required'"
                      @click="toggleRequired(item)"
                    >
                      {{ item.required ? 'Required' : 'Optional' }}
                    </button>
                    <span v-else class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border" :class="item.required ? 'bg-slate-900 text-white border-slate-900' : 'bg-surface-muted text-text-muted border-surface-border'">
                      {{ item.required ? 'Required' : 'Optional' }}
                    </span>
                  </td>
                  <td class="px-8 py-6 text-[10px] font-bold text-text-muted uppercase tabular-nums">{{ dueLabel(item) }}</td>
                  <td v-if="isSuperCoordinator" class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button class="rounded-control h-8 w-8 bg-slate-900 text-white hover:brightness-150 transition-all" title="Edit requirement" @click="openEditForm(item)">
                        <i class="pi pi-pencil text-[10px]"></i>
                      </button>
                      <button class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all" title="Duplicate requirement" @click="duplicateTemplate(item)">
                        <i class="pi pi-copy text-[10px]"></i>
                      </button>
                      <button class="rounded-control h-8 w-8 border border-slate-900 text-slate-800 hover:bg-slate-900 hover:text-white transition-all" title="Delete requirement" @click="deleteTemplate(item.id)">
                        <i class="pi pi-trash text-[10px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </article>
    </template>

    <!-- Per-student progress -->
    <template v-else>
      <div class="grid grid-cols-1 xl:grid-cols-[320px,minmax(0,1fr)] gap-6">
        <aside class="rounded-card bg-surface border border-surface-border shadow-sm overflow-hidden">
          <div class="p-4 border-b border-surface-border">
            <div class="relative group">
              <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-sky-700 transition-colors"></i>
              <input
                v-model="studentSearch"
                type="text"
                placeholder="Search students..."
                class="w-full pl-12 pr-4 py-3 bg-surface-muted border border-surface-control text-text-primary placeholder:text-text-muted rounded-control outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700 transition-all text-[10px] font-black uppercase tracking-widest"
              >
            </div>
          </div>
          <div class="max-h-[26rem] overflow-y-auto divide-y divide-surface-border">
            <div v-if="studentsLoading" class="p-8 text-center">
              <i class="pi pi-spin pi-spinner text-xl text-sky-600"></i>
            </div>
            <p v-else-if="filteredStudentOptions.length === 0" class="p-8 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">No students found</p>
            <button
              v-for="student in filteredStudentOptions"
              :key="student.id"
              type="button"
              class="w-full text-left px-4 py-3 transition-colors hover:bg-surface-hover"
              :class="selectedStudentId === student.id ? 'bg-surface-selected' : ''"
              @click="selectStudent(student.id)"
            >
              <span class="block truncate text-xs font-black uppercase tracking-tight text-slate-800">{{ student.full_name }}</span>
              <span class="block text-[9px] font-bold text-text-muted uppercase tabular-nums mt-0.5">{{ student.student_id || 'NOT_ASSIGNED' }} · {{ student.completionPercent }}%</span>
            </button>
          </div>
        </aside>

        <article class="rounded-card bg-surface border border-surface-border shadow-sm relative overflow-hidden min-h-[20rem]">
          <div v-if="studentDetailLoading" class="absolute inset-0 bg-surface/70 z-10 flex items-center justify-center backdrop-blur-sm">
            <i class="pi pi-spin pi-spinner text-2xl text-sky-600"></i>
          </div>

          <div v-if="!selectedStudentId" class="p-12 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
            Select a student to review their requirements
          </div>
          <div v-else-if="studentDetailError" class="p-12 text-center text-[10px] font-black uppercase tracking-widest text-rose-700">
            {{ studentDetailError }}
          </div>
          <template v-else-if="studentDetail">
            <div class="p-4 md:p-6 border-b border-surface-border space-y-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <PortalSectionHeading :title="studentDetail.student.full_name" icon="pi-user" tone="teal" :description="`${studentDetail.student.student_id || 'No ID assigned'} · ${studentDetail.semester.name}`" />
                </div>
                <span class="rounded-badge border border-teal-200 bg-teal-100 px-3 py-1 text-xs font-semibold tabular-nums text-teal-900">
                  {{ studentProgress }}% complete
                </span>
              </div>
              <div class="h-2 bg-surface-border overflow-hidden rounded-full" role="progressbar" :aria-valuenow="studentProgress" aria-valuemin="0" aria-valuemax="100">
                <div class="h-full bg-teal-600 transition-all duration-500" :style="{ width: studentProgress + '%' }"></div>
              </div>
              <p v-if="!studentDetail.capabilities.correctRecords" class="text-[9px] font-black uppercase tracking-widest text-text-muted">
                Read-only: only Super Coordinators can change completion.
              </p>
            </div>

            <ul v-if="studentDetail.items.length" class="divide-y divide-surface-border">
              <li v-for="item in studentDetail.items" :key="item.templateId" class="px-4 md:px-6 py-4 flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-black text-slate-800 uppercase tracking-tight text-xs">{{ item.title }}</span>
                    <span v-if="item.required" class="rounded-badge bg-slate-900 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">Required</span>
                  </div>
                  <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">{{ item.description || 'No additional details' }}</div>
                  <div class="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">
                    Due {{ item.dueDate ? formatDate(item.dueDate) : '—' }} · {{ phaseLabel(item.phase) }}
                    <template v-if="item.overrideReason"> · Override: {{ item.overrideReason }}</template>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="rounded-badge px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border"
                    :class="!item.hasEntry ? 'bg-surface-muted text-text-muted border-surface-border' : item.isCompleted ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'"
                  >
                    {{ !item.hasEntry ? 'Not started' : item.isCompleted ? 'Complete' : 'Incomplete' }}
                  </span>
                  <button
                    v-if="studentDetail.capabilities.correctRecords && item.hasEntry && item.entryId !== null"
                    type="button"
                    class="rounded-control h-8 px-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:brightness-150 transition-all disabled:opacity-50"
                    :disabled="isSavingOverride"
                    @click="openOverride(item)"
                  >
                    {{ item.isCompleted ? 'Revert' : 'Mark complete' }}
                  </button>
                </div>
              </li>
            </ul>
            <div v-else class="p-12 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
              No requirements defined for this semester
            </div>
          </template>
        </article>
      </div>
    </template>

    <Teleport to="body">
      <!-- Template editor -->
      <div v-if="showForm" class="app-surface-ui fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
        <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-lg p-6 sm:p-10 border border-surface-border shadow-2xl relative mx-4 sm:mx-0">
          <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="showForm = false">
            <i class="pi pi-times"></i>
          </button>

          <h2 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-8">{{ editingId ? 'Edit Requirement' : 'New Requirement' }}</h2>

          <form @submit.prevent="saveTemplate" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="md:col-span-3 space-y-2">
                <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Title</label>
                <input v-model="form.title" type="text" required class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800">
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Order</label>
                <input v-model.number="form.display_order" type="number" required min="1" class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all tabular-nums text-slate-800">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-black text-text-muted uppercase tracking-widest">Description</label>
              <textarea v-model="form.description" rows="3" class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none text-slate-800"></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label for="template-phase" class="text-[9px] font-black text-text-muted uppercase tracking-widest">Phase</label>
                <select
                  id="template-phase"
                  v-model="form.phase"
                  class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800 cursor-pointer"
                >
                  <option value="">Not set</option>
                  <option value="before">Before internship</option>
                  <option value="during">During internship</option>
                  <option value="after">After internship</option>
                </select>
              </div>
              <div class="space-y-2">
                <label for="template-due-date" class="text-[9px] font-black text-text-muted uppercase tracking-widest">Due date</label>
                <input
                  id="template-due-date"
                  v-model="form.due_date"
                  type="date"
                  class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-black uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all text-slate-800"
                >
                <p class="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Leave blank for no due date.</p>
              </div>
            </div>

            <div class="flex items-center gap-3 group cursor-pointer" @click="form.required = !form.required">
              <div class="rounded-badge h-5 w-5 border-2 border-slate-500 flex items-center justify-center transition-all" :class="form.required ? 'bg-slate-900 border-slate-900' : 'bg-surface-muted'">
                <i v-if="form.required" class="pi pi-check text-[10px] text-white"></i>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-800">Mandatory for all students</span>
            </div>

            <button type="submit" :disabled="isSaving" class="rounded-control w-full bg-sky-700 text-white h-14 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sky-800 transition-all disabled:opacity-30 mt-4">
              {{ isSaving ? 'Processing...' : 'Save Template' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Checklist override reason -->
      <div v-if="showOverride" class="app-surface-ui fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
        <div class="rounded-dialog max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto bg-surface w-full max-w-lg p-6 sm:p-10 border border-surface-border shadow-2xl relative mx-4 sm:mx-0">
          <button class="rounded-control absolute top-6 right-6 text-text-muted hover:text-slate-800 transition-colors" @click="showOverride = false">
            <i class="pi pi-times"></i>
          </button>

          <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">{{ overrideTarget?.isCompleted ? 'Revert Requirement' : 'Mark Requirement Complete' }}</h2>
          <p class="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">{{ overrideTarget?.title }}</p>

          <form @submit.prevent="confirmOverride" class="space-y-6">
            <div class="space-y-2">
              <label for="checklist-override-reason" class="text-[9px] font-black text-text-muted uppercase tracking-widest">Reason</label>
              <textarea
                id="checklist-override-reason"
                v-model="overrideReason"
                rows="3"
                required
                maxlength="2000"
                placeholder="Explain why this requirement is being manually changed..."
                class="w-full bg-surface-muted border border-surface-control rounded-control px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-sky-700 focus:ring-1 focus:ring-sky-700 outline-none transition-all resize-none text-slate-800"
              ></textarea>
            </div>
            <div class="flex gap-3">
              <button type="button" class="rounded-control flex-1 h-12 border border-surface-control text-text-muted font-black text-[10px] uppercase tracking-widest hover:bg-surface-hover transition-all" @click="showOverride = false">Cancel</button>
              <button type="submit" :disabled="isSavingOverride || !overrideReason.trim()" class="rounded-control flex-1 h-12 bg-sky-700 text-white font-black text-[10px] uppercase tracking-widest hover:bg-sky-800 transition-all disabled:opacity-30">
                {{ isSavingOverride ? 'Saving...' : 'Confirm' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/supabase'
import { useCoordinatorPrivileges } from '~/composables/useCoordinatorPrivileges'
import { generateReport } from '~/utils/pdfGenerator'

definePageMeta({
  requiredRole: 'coordinator'
})

type TemplateRow = Database['public']['Tables']['checklist_templates']['Row']
type SemesterOption = { id: number; name: string; is_active: boolean | null; start_date: string }
type ChecklistResponse = { semesterId: number | null; templates: TemplateRow[]; semesters: SemesterOption[] }
type StudentOption = { id: string; full_name: string; student_id: string | null; completionPercent: number }
type StudentChecklistItem = {
  entryId: number | null
  templateId: number
  title: string
  description: string | null
  required: boolean
  displayOrder: number | null
  phase: string | null
  dueDate: string | null
  isCompleted: boolean
  completedAt: string | null
  overrideReason: string | null
  hasEntry: boolean
}
type StudentChecklistResponse = {
  semesterId: number
  semester: { id: number; name: string; is_active: boolean | null }
  student: { id: string; full_name: string; student_id: string | null; email: string | null }
  capabilities: { correctRecords: boolean }
  items: StudentChecklistItem[]
}
type TemplateForm = {
  title: string
  description: string
  display_order: number
  required: boolean
  phase: string
  due_date: string
}
type RequiredFilter = 'all' | 'required' | 'optional'

const supabase = useSupabaseClient<Database>()
const pageCache = usePageCache()
const { isSuperCoordinator } = useCoordinatorPrivileges()

const semesters = ref<SemesterOption[]>([])
const selectedSemesterId = ref<number | null>(null)
const viewMode = ref<'templates' | 'students'>('templates')

const templates = ref<TemplateRow[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const isBulkDeleting = ref(false)
const isImporting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const searchQuery = ref('')
const requiredFilter = ref<RequiredFilter>('all')
const selectedIds = ref<number[]>([])
const draggedItemIndex = ref<number | null>(null)
const draggedOverItemIndex = ref<number | null>(null)
const togglingRequiredId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const showForm = ref(false)

const form = ref<TemplateForm>({
  title: '',
  description: '',
  display_order: 1,
  required: true,
  phase: '',
  due_date: ''
})

const students = ref<StudentOption[]>([])
const studentsLoading = ref(false)
const studentSearch = ref('')
const selectedStudentId = ref<string | null>(null)
const studentDetail = ref<StudentChecklistResponse | null>(null)
const studentDetailLoading = ref(false)
const studentDetailError = ref('')

const showOverride = ref(false)
const overrideTarget = ref<StudentChecklistItem | null>(null)
const overrideReason = ref('')
const isSavingOverride = ref(false)

const requiredFilterOptions: Array<{ value: RequiredFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'required', label: 'Required' },
  { value: 'optional', label: 'Optional' }
]

const filterCounts = computed<Record<RequiredFilter, number>>(() => ({
  all: templates.value.length,
  required: templates.value.filter(item => item.required).length,
  optional: templates.value.filter(item => !item.required).length
}))

const filtersActive = computed(() => requiredFilter.value !== 'all' || searchQuery.value.trim().length > 0)

const filteredTemplates = computed(() => {
  let list = templates.value
  if (requiredFilter.value === 'required') list = list.filter(item => item.required)
  if (requiredFilter.value === 'optional') list = list.filter(item => !item.required)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query)
    )
  }
  return list
})

const isDragDisabled = computed(() => !isSuperCoordinator.value || filtersActive.value)

const filteredStudentOptions = computed(() => {
  const query = studentSearch.value.trim().toLowerCase()
  if (!query) return students.value
  return students.value.filter(student =>
    student.full_name.toLowerCase().includes(query) ||
    (student.student_id || '').toLowerCase().includes(query)
  )
})

const studentProgress = computed(() => {
  const items = studentDetail.value?.items || []
  if (!items.length) return 0
  return Math.round((items.filter(item => item.isCompleted).length / items.length) * 100)
})

const allFilteredSelected = computed(() =>
  filteredTemplates.value.length > 0 && filteredTemplates.value.every(item => selectedIds.value.includes(item.id))
)

const checklistsUrl = () => selectedSemesterId.value
  ? `/api/checklists?semester_id=${selectedSemesterId.value}`
  : '/api/checklists'

const studentsUrl = () => selectedSemesterId.value
  ? `/api/students?semester_id=${selectedSemesterId.value}`
  : '/api/students'

const studentChecklistUrl = (studentId: string) => selectedSemesterId.value
  ? `/api/students/${studentId}/checklists?semester_id=${selectedSemesterId.value}`
  : `/api/students/${studentId}/checklists`

const applyChecklistResponse = (data: ChecklistResponse) => {
  semesters.value = data.semesters || []
  templates.value = data.templates || []
  if (data.semesterId && !selectedSemesterId.value) selectedSemesterId.value = data.semesterId
  selectedIds.value = selectedIds.value.filter(id => templates.value.some(item => item.id === id))
}

const loadTemplates = async (force = false) => {
  const url = checklistsUrl()
  const cached = pageCache.read<ChecklistResponse>(url)
  if (cached) applyChecklistResponse(cached)
  isLoading.value = !cached
  errorMessage.value = ''

  try {
    const data = await pageCache.fetch<ChecklistResponse>(url, { force })
    applyChecklistResponse(data)
    if (!data.semesterId) errorMessage.value = 'No semester selected'
  } catch {
    errorMessage.value = 'Unable to load checklist templates. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const loadStudents = async (force = false) => {
  const url = studentsUrl()
  const cached = pageCache.read<{ students: StudentOption[] }>(url)
  if (cached) students.value = cached.students || []
  studentsLoading.value = !cached

  try {
    const data = await pageCache.fetch<{ students: StudentOption[] }>(url, { force })
    students.value = data.students || []
  } catch {
    errorMessage.value = 'Unable to load students for this semester.'
  } finally {
    studentsLoading.value = false
  }
}

const loadStudentDetail = async (force = false) => {
  if (!selectedStudentId.value) {
    studentDetail.value = null
    studentDetailError.value = ''
    return
  }

  const url = studentChecklistUrl(selectedStudentId.value)
  const cached = pageCache.read<StudentChecklistResponse>(url)
  if (cached) studentDetail.value = cached
  studentDetailLoading.value = !cached
  studentDetailError.value = ''

  try {
    studentDetail.value = await pageCache.fetch<StudentChecklistResponse>(url, { force })
  } catch {
    studentDetailError.value = 'Unable to load this student\'s requirements.'
    if (!cached) studentDetail.value = null
  } finally {
    studentDetailLoading.value = false
  }
}

const onSemesterChange = async () => {
  searchQuery.value = ''
  requiredFilter.value = 'all'
  selectedIds.value = []
  selectedStudentId.value = null
  studentDetail.value = null
  successMessage.value = ''
  await loadTemplates(true)
  if (viewMode.value === 'students') await loadStudents(true)
}

const setView = async (mode: 'templates' | 'students') => {
  viewMode.value = mode
  if (mode === 'students') {
    if (!students.value.length) await loadStudents()
    if (selectedStudentId.value) await loadStudentDetail()
  }
}

const selectStudent = async (studentId: string) => {
  selectedStudentId.value = studentId
  await loadStudentDetail(true)
}

const isSelected = (id: number) => selectedIds.value.includes(id)

const toggleSelected = (id: number) => {
  selectedIds.value = isSelected(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}

const toggleSelectAll = () => {
  if (allFilteredSelected.value) {
    const visible = new Set(filteredTemplates.value.map(item => item.id))
    selectedIds.value = selectedIds.value.filter(id => !visible.has(id))
  } else {
    selectedIds.value = [...new Set([...selectedIds.value, ...filteredTemplates.value.map(item => item.id)])]
  }
}

const dueLabel = (item: TemplateRow) => {
  return item.due_date ? formatDate(item.due_date) : '—'
}

const phaseLabel = (phase: string | null) => {
  if (!phase) return '—'
  return phase.charAt(0).toUpperCase() + phase.slice(1)
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-MY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})

const openAddForm = () => {
  editingId.value = null
  form.value = {
    title: '',
    description: '',
    display_order: templates.value.length + 1,
    required: true,
    phase: '',
    due_date: ''
  }
  showForm.value = true
  successMessage.value = ''
}

const openEditForm = (item: TemplateRow) => {
  editingId.value = item.id
  form.value = {
    title: item.title,
    description: item.description || '',
    display_order: item.display_order || 0,
    required: item.required ?? true,
    phase: item.phase || '',
    due_date: item.due_date || ''
  }
  showForm.value = true
  successMessage.value = ''
}

const duplicateTemplate = (item: TemplateRow) => {
  editingId.value = null
  form.value = {
    title: `${item.title} (Copy)`,
    description: item.description || '',
    display_order: templates.value.length + 1,
    required: item.required ?? true,
    phase: item.phase || '',
    due_date: item.due_date || ''
  }
  showForm.value = true
  successMessage.value = ''
}

const saveTemplate = async () => {
  if (!selectedSemesterId.value) return

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      title: form.value.title,
      description: form.value.description || null,
      display_order: form.value.display_order,
      required: form.value.required,
      phase: form.value.phase || null,
      due_date: form.value.due_date || null,
      semester_id: selectedSemesterId.value
    }

    await $fetch('/api/administration/configuration', {
      method: 'POST',
      body: { action: 'template.save', payload: { ...payload, id: editingId.value } }
    })

    successMessage.value = editingId.value ? 'Template updated' : 'Template created'
    showForm.value = false
    pageCache.invalidate(checklistsUrl())
    await loadTemplates(true)
  } catch {
    errorMessage.value = 'Save failed'
  } finally {
    isSaving.value = false
  }
}

const toggleRequired = async (item: TemplateRow) => {
  if (!selectedSemesterId.value || togglingRequiredId.value !== null) return

  const previous = item.required
  item.required = !previous
  togglingRequiredId.value = item.id
  errorMessage.value = ''

  try {
    await $fetch('/api/administration/configuration', {
      method: 'POST',
      body: {
        action: 'template.save',
        payload: {
          id: item.id,
          title: item.title,
          description: item.description ?? null,
          display_order: item.display_order ?? 1,
          required: item.required,
          phase: item.phase ?? null,
          due_date: item.due_date ?? null,
          semester_id: selectedSemesterId.value
        }
      }
    })
    pageCache.invalidate(checklistsUrl())
  } catch {
    item.required = previous
    errorMessage.value = 'Failed to update requirement'
  } finally {
    togglingRequiredId.value = null
  }
}

const deleteTemplate = async (id: number) => {
  if (!confirm('Discard template?')) return

  try {
    await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'template.delete', payload: { id } } })
    successMessage.value = 'Template removed'
    selectedIds.value = selectedIds.value.filter(item => item !== id)
    pageCache.invalidate(checklistsUrl())
    await loadTemplates(true)
  } catch {
    errorMessage.value = 'Delete failed'
  }
}

const deleteSelected = async () => {
  if (!selectedIds.value.length) return
  if (!confirm(`Delete ${selectedIds.value.length} selected requirement(s)? This cannot be undone.`)) return

  isBulkDeleting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  let removed = 0
  let failed = 0

  for (const id of [...selectedIds.value]) {
    try {
      await $fetch('/api/administration/configuration', { method: 'POST', body: { action: 'template.delete', payload: { id } } })
      removed++
    } catch {
      failed++
    }
  }

  selectedIds.value = []
  pageCache.invalidate(checklistsUrl())
  await loadTemplates(true)
  if (failed) errorMessage.value = `${removed} requirement(s) removed, ${failed} failed`
  else successMessage.value = `${removed} requirement(s) removed`
  isBulkDeleting.value = false
}

const importTemplate = async () => {
  if (!selectedSemesterId.value) return
  if (!confirm('Are you sure you want to import requirements from the previous semester? This will add to your current list.')) return

  isImporting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await $fetch<{ imported: number }>('/api/administration/configuration', {
      method: 'POST',
      body: { action: 'template.import', payload: { semester_id: selectedSemesterId.value } }
    })
    successMessage.value = `Imported ${result.imported} template(s) from previous semester`
    pageCache.invalidate(checklistsUrl())
    await loadTemplates(true)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err.message || 'Import failed'
  } finally {
    isImporting.value = false
  }
}

const openOverride = (item: StudentChecklistItem) => {
  if (!studentDetail.value?.capabilities.correctRecords || item.entryId === null) return
  overrideTarget.value = item
  overrideReason.value = ''
  showOverride.value = true
}

const confirmOverride = async () => {
  const target = overrideTarget.value
  if (!target || target.entryId === null || !selectedStudentId.value || !overrideReason.value.trim()) return

  isSavingOverride.value = true
  errorMessage.value = ''

  try {
    await $fetch(`/api/students/${selectedStudentId.value}/checklists/${target.entryId}`, {
      method: 'PATCH',
      body: {
        is_completed: !target.isCompleted,
        reason: overrideReason.value.trim(),
        semester_id: selectedSemesterId.value
      }
    })
    showOverride.value = false
    pageCache.invalidate(studentChecklistUrl(selectedStudentId.value))
    pageCache.invalidate(studentsUrl())
    await loadStudentDetail(true)
    await loadStudents(true)
    successMessage.value = target.isCompleted ? 'Requirement reverted' : 'Requirement marked complete'
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'Override failed'
  } finally {
    isSavingOverride.value = false
  }
}

const onDragStart = (index: number) => {
  if (isDragDisabled.value) return
  draggedItemIndex.value = index
}

const onDragEnter = (index: number) => {
  if (isDragDisabled.value) return
  if (index !== draggedItemIndex.value) draggedOverItemIndex.value = index
}

const onDrop = async (index: number) => {
  if (isDragDisabled.value || draggedItemIndex.value === null || draggedItemIndex.value === index) {
    onDragEnd()
    return
  }

  const items = [...templates.value]
  const moved = items.splice(draggedItemIndex.value, 1)[0]
  if (!moved) {
    onDragEnd()
    return
  }
  items.splice(index, 0, moved)

  items.forEach((item, i) => { item.display_order = i + 1 })
  templates.value = items

  onDragEnd()

  try {
    await $fetch('/api/administration/configuration', {
      method: 'POST',
      body: {
        action: 'template.reorder',
        payload: { semester_id: selectedSemesterId.value, ids: templates.value.map(item => item.id) }
      }
    })
    pageCache.invalidate(checklistsUrl())
  } catch {
    errorMessage.value = 'Failed to save order'
    pageCache.invalidate(checklistsUrl())
    await loadTemplates(true)
  }
}

const onDragEnd = () => {
  draggedItemIndex.value = null
  draggedOverItemIndex.value = null
}

const downloadNonComplianceReport = async () => {
  if (!selectedSemesterId.value) return

  const { data: studentSemesters } = await supabase
    .from('student_semesters')
    .select('student_id')
    .eq('semester_id', selectedSemesterId.value)

  const enrolledIds = (studentSemesters || []).map(s => s.student_id).filter(Boolean) as string[]
  if (!enrolledIds.length) { alert('No students enrolled in selected semester'); return }

  const [{ data: requiredTpls }, { data: profiles }, { data: checklists }] = await Promise.all([
    supabase.from('checklist_templates').select('id, title').eq('semester_id', selectedSemesterId.value).eq('required', true),
    supabase.from('users').select('id, full_name, student_id').eq('role', 'student').in('id', enrolledIds),
    supabase.from('student_checklists').select('student_id, checklist_item_id, is_completed').in('student_id', enrolledIds)
  ])

  const rows: string[][] = []
  for (const student of profiles || []) {
    const studentItems = checklists?.filter(c => c.student_id === student.id) || []
    const missing = (requiredTpls || []).filter(t => {
      const item = studentItems.find(c => c.checklist_item_id === t.id)
      return !item || !item.is_completed
    })
    if (missing.length) {
      rows.push([student.full_name, student.student_id || '---', missing.map(t => t.title).join(', '), 'Non-Compliant'])
    }
  }

  if (!rows.length) { alert('All students are compliant'); return }

  generateReport('Cohort Readiness Report - Non-Compliance', ['Student Name', 'ID', 'Missing Milestones', 'Status'], rows, 'Cohort_Readiness_Report.pdf', { columnStyles: { 0: { fontStyle: 'bold' } } })
}

onMounted(() => {
  void loadTemplates()
})
</script>
