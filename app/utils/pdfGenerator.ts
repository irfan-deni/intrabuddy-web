import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface TableConfig {
  headers: string[]
  data: any[][]
  styles?: Record<string, any>
  headStyles?: Record<string, any>
  columnStyles?: Record<string, any>
}

export function generateReport(
  title: string,
  headers: string[],
  data: any[][],
  filename: string,
  options?: {
    subtitle?: string
    styles?: Record<string, any>
    headStyles?: Record<string, any>
    columnStyles?: Record<string, any>
    extraTables?: TableConfig[]
  }
) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(title, 14, 15)

  doc.setFontSize(10)
  doc.text('Generated on: ' + new Date().toLocaleDateString(), 14, 22)

  let startY = 30
  if (options?.subtitle) {
    doc.setFontSize(12)
    doc.text(options.subtitle, 14, 32)
    startY = 40
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body: data,
    styles: { fontSize: 10, ...options?.styles },
    headStyles: { fillColor: [51, 65, 85], ...options?.headStyles },
    columnStyles: options?.columnStyles
  })

  if (options?.extraTables) {
    for (const table of options.extraTables) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [table.headers],
        body: table.data,
        styles: { fontSize: 8, ...table.styles },
        headStyles: { fillColor: [51, 65, 85], ...table.headStyles },
        columnStyles: table.columnStyles
      })
    }
  }

  doc.save(filename)
}
