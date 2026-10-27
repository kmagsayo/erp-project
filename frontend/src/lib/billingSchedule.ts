export function installmentDates(start: string, end: string, runDay: number): string[] {
  if (!start || !end || end < start) return []
  if (!Number.isInteger(runDay) || runDay < 1 || runDay > 31) return []

  const dueDay = Number(start.slice(8, 10))
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return []

  const dates: string[] = []
  for (let index = 1; index <= 360; index += 1) {
    const due = monthDate(start, index, dueDay)
    if (due > end) break
    dates.push(due)
  }
  return dates
}

export function regularInstallmentAmount(contractAmount: number, count: number): number {
  if (!Number.isFinite(contractAmount) || contractAmount <= 0 || count < 1) return 0
  const cents = Math.round(contractAmount * 100)
  return Math.floor(cents / count) / 100
}

function monthDate(start: string, offset: number, runDay: number): string {
  const [year, month] = start.split('-').map(Number)
  const cursor = new Date(year, month - 1 + offset, 1)
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const day = Math.min(runDay, days)
  const y = cursor.getFullYear()
  const m = String(cursor.getMonth() + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}
