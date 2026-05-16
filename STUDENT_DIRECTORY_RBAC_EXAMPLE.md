# Student Directory (UC1 + UC8) — Full RBAC Code Example

Use this as a drop-in implementation example for a React + TypeScript + Supabase stack.

## `src/pages/StudentDirectory.tsx`

```tsx
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export type Role = "coordinator" | "super_coordinator";

export interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  cohort: string;
  created_at: string;
  updated_at: string;
}

interface StudentFormInput {
  student_id: string;
  name: string;
  email: string;
  cohort: string;
}

const defaultForm: StudentFormInput = {
  student_id: "",
  name: "",
  email: "",
  cohort: "",
};

export default function StudentDirectory() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const isSuperCoordinator = role === "super_coordinator";

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["students", search],
    queryFn: async (): Promise<Student[]> => {
      let query = supabase
        .from("students")
        .select("id, student_id, name, email, cohort, created_at, updated_at")
        .order("name", { ascending: true });

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: StudentFormInput) => {
      const { error } = await supabase.from("students").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: StudentFormInput }) => {
      const { error } = await supabase
        .from("students")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setDeleting(null);
    },
  });

  const errorMessage = useMemo(() => {
    return (
      studentsQuery.error?.message ||
      createMutation.error?.message ||
      updateMutation.error?.message ||
      deleteMutation.error?.message ||
      null
    );
  }, [studentsQuery.error, createMutation.error, updateMutation.error, deleteMutation.error]);

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Student Directory</h1>
          <p className="text-sm text-slate-600">
            Coordinators can view students. Super Coordinators can create, edit, and delete.
          </p>
        </div>

        {isSuperCoordinator && (
          <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={() => setShowCreate(true)}>
            Add Student
          </button>
        )}
      </header>

      <div className="rounded border bg-white p-4">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Search by name or student ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {errorMessage && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}

      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Cohort</th>
              {isSuperCoordinator && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {studentsQuery.isLoading && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={isSuperCoordinator ? 5 : 4}>
                  Loading students...
                </td>
              </tr>
            )}

            {!studentsQuery.isLoading && (studentsQuery.data?.length ?? 0) === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={isSuperCoordinator ? 5 : 4}>
                  No students found.
                </td>
              </tr>
            )}

            {studentsQuery.data?.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="px-4 py-3">{student.name}</td>
                <td className="px-4 py-3">{student.student_id}</td>
                <td className="px-4 py-3">{student.email}</td>
                <td className="px-4 py-3">{student.cohort}</td>
                {isSuperCoordinator && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button className="rounded border px-3 py-1" onClick={() => setEditing(student)}>
                        Edit
                      </button>
                      <button
                        className="rounded border border-red-300 px-3 py-1 text-red-700"
                        onClick={() => setDeleting(student)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && isSuperCoordinator && (
        <StudentFormModal
          title="Add Student"
          defaultValues={defaultForm}
          loading={createMutation.isPending}
          onCancel={() => setShowCreate(false)}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}

      {editing && isSuperCoordinator && (
        <StudentFormModal
          title="Edit Student"
          defaultValues={{
            student_id: editing.student_id,
            name: editing.name,
            email: editing.email,
            cohort: editing.cohort,
          }}
          loading={updateMutation.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={(values) => updateMutation.mutate({ id: editing.id, input: values })}
        />
      )}

      {deleting && isSuperCoordinator && (
        <ConfirmDeleteDialog
          name={deleting.name}
          loading={deleteMutation.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
        />
      )}
    </main>
  );
}
```

## Notes

- Hide all Create/Edit/Delete UI when user role is `coordinator`.
- Keep backend enforcement with Supabase RLS even when frontend hides controls.
- Replace basic modal/dialog markup with shadcn/ui `Dialog` and your DataTable component if available.
