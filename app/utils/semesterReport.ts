export type ReportStudent = {
  full_name: string
  student_id: string | null
  placementStatus: string
}

export type ReportLogbook = {
  studentName: string
  studentMatric: string
  weekNumber: number
  weekEndDate: string
  statusLabel: string
}

export function buildSemesterReport(students: ReportStudent[], logbooks: ReportLogbook[]) {
  const unplaced = students.filter(student => student.placementStatus !== 'Accepted')
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
  const records = [...logbooks].sort((a, b) =>
    a.studentName.localeCompare(b.studentName) || a.studentMatric.localeCompare(b.studentMatric) || a.weekNumber - b.weekNumber
  )
  const submitted = records.filter(record => record.statusLabel === 'Submitted').length
  const overdue = records.filter(record => record.statusLabel === 'Late')
  const pending = records.length - submitted - overdue.length
  const placed = students.length - unplaced.length

  return {
    unplaced, records, overdue,
    metrics: [
      ['Enrolled students', String(students.length)],
      ['Confirmed placements', String(placed)],
      ['Unplaced', String(unplaced.length)],
      ['Placement rate', students.length ? `${Math.round(placed / students.length * 100)}%` : 'N/A'],
      ['Tracked logbooks', String(records.length)],
      ['Submitted', String(submitted)],
      ['Overdue', String(overdue.length)],
      ['Pending', String(pending)],
      ['Logbook submission rate', records.length ? `${Math.round(submitted / records.length * 100)}%` : 'N/A']
    ]
  }
}

export async function generateSemesterReport(semester: string, students: ReportStudent[], logbooks: ReportLogbook[]) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'), import('jspdf-autotable')
  ])
  const report = buildSemesterReport(students, logbooks)
  const doc = new jsPDF()
  const generated = new Date().toLocaleString()
  doc.setFontSize(18)
  doc.text('INTRA Buddy - Semester Report', 14, 18)
  doc.setFontSize(10)
  doc.text(`Active semester: ${semester}`, 14, 26)
  doc.text(`Generated: ${generated}`, 14, 32)
  doc.text('Scope: active semester records available at export time.', 14, 38)

  let y = 46
  const section = (title: string, headers: string[], rows: string[][], empty: string) => {
    if (y > 255) { doc.addPage(); y = 20 }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 14, y)
    doc.setFont('helvetica', 'normal')
    autoTable(doc, {
      startY: y + 4,
      head: [headers],
      body: rows.length ? rows : [[empty, ...headers.slice(1).map(() => '')]],
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [51, 65, 85] },
      margin: { bottom: 18 },
      showHead: 'everyPage'
    })
    y = (doc as any).lastAutoTable.finalY + 12
  }

  section('Semester overview', ['Metric', 'Value'], report.metrics, 'No data')
  section('Attention required: unplaced students', ['Student', 'ID', 'Status'], report.unplaced.map(student => [
    student.full_name || 'Unknown', student.student_id || 'N/A', student.placementStatus || 'Unknown'
  ]), 'No unplaced students')
  const logbookRow = (record: ReportLogbook) => [
    record.studentName || 'Unknown', record.studentMatric || 'N/A', `Week ${record.weekNumber}`,
    record.weekEndDate || 'N/A', record.statusLabel === 'Late' ? 'Overdue' : record.statusLabel
  ]
  const logbookHeaders = ['Student', 'ID', 'Week', 'Week end', 'Status']
  section('Attention required: overdue logbooks', logbookHeaders, report.overdue.map(logbookRow), 'No overdue logbooks')
  section('Appendix: all tracked logbooks', logbookHeaders, report.records.map(logbookRow), 'No logbook records')
  section('Metric definitions', ['Metric', 'Definition'], [
    ['Placement', 'Students with an accepted application or an interview, divided by enrolled students.'],
    ['Logbook submission rate', 'Submitted records divided by all tracked logbook records for the active semester.'],
    ['Overdue', 'Not submitted and week end date is before the current UTC date.'],
    ['Pending', 'Not submitted and not overdue.']
  ], '')

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`INTRA Buddy | Page ${page} of ${pages}`, 14, doc.internal.pageSize.getHeight() - 8)
  }
  doc.save('INTRA_Semester_Report.pdf')
}
