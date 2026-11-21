import { describe, expect, it } from 'vitest'
import { buildSemesterReport } from '../app/utils/semesterReport'

describe('semester report', () => {
  it('derives metrics and attention lists from the exported records', () => {
    const result = buildSemesterReport([
      { full_name: 'Alice', student_id: '1', placementStatus: 'Interview' },
      { full_name: 'Bob', student_id: '2', placementStatus: 'Searching' },
      { full_name: 'Cara', student_id: '3', placementStatus: 'Accepted' }
    ], [
      { studentName: 'Bob', studentMatric: '2', weekNumber: 2, weekEndDate: '2026-01-14', statusLabel: 'Late' },
      { studentName: 'Bob', studentMatric: '2', weekNumber: 1, weekEndDate: '2026-01-07', statusLabel: 'Submitted' },
      { studentName: 'Alice', studentMatric: '1', weekNumber: 1, weekEndDate: '2026-01-07', statusLabel: 'Not Submitted' }
    ])
    expect(Object.fromEntries(result.metrics)).toMatchObject({
      'Enrolled students': '3', 'Confirmed placements': '1', 'Unplaced': '2',
      'Placement rate': '33%', 'Tracked logbooks': '3', Submitted: '1', Overdue: '1', Pending: '1',
      'Logbook submission rate': '33%'
    })
    expect(result.unplaced.map(student => student.full_name)).toEqual(['Alice', 'Bob'])
    expect(result.overdue).toHaveLength(1)
    expect(result.records.map(record => `${record.studentName} ${record.weekNumber}`)).toEqual(['Alice 1', 'Bob 1', 'Bob 2'])
  })

  it('does not imply a rate when no records exist', () => {
    const metrics = Object.fromEntries(buildSemesterReport([], []).metrics)
    expect(metrics['Placement rate']).toBe('N/A')
    expect(metrics['Logbook submission rate']).toBe('N/A')
  })
})
