import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

// Uses a dedicated disposable PostgreSQL container, never a linked Supabase DB.
const container = `intrabuddy-permissions-${randomUUID().slice(0, 8)}`
const docker = (args, options = {}) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...options })
const sql = (input) => docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input })
try {
  docker(['run', '--detach', '--name', container, '--env', `POSTGRES_PASSWORD=${randomUUID()}`, 'postgres:17'])
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { docker(['exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', 'select 1']); ready = true; break } catch { await new Promise(resolve => setTimeout(resolve, 500)) }
  }
  if (!ready) throw new Error('Test PostgreSQL did not become ready')
  sql(readFileSync('__tests__/fixtures/student-management-schema.sql', 'utf8'))
  const migrations = readdirSync('supabase/migrations')
  for (const suffix of ['_coordinator_student_management.sql', '_super_coordinator_student_management.sql']) {
    const migration = migrations.find(name => name.endsWith(suffix))
    if (!migration) throw new Error(`Student management migration not found: ${suffix}`)
    sql(readFileSync(`supabase/migrations/${migration}`, 'utf8'))
  }
  sql(readFileSync('__tests__/fixtures/student-management-permissions.sql', 'utf8'))
  console.log('Student management database tests passed (Super Coordinator authorization, audit atomicity, direct-access restrictions).')
} catch (error) {
  console.error(error.stderr || error.message)
  process.exitCode = 1
} finally {
  docker(['rm', '--force', container])
}
