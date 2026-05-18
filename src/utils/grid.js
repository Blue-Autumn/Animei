function pad2(n) {
  return String(n).padStart(2, '0')
}

function dateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function daysSinceMonday(date) {
  // getDay(): 0=Sun, 1=Mon...6=Sat
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

/**
 * Generate the full year grid data.
 * Returns:
 *   weeks: Array of 7-element arrays [Mon..Sun], each cell = { day, month, dateStr, isEmpty }
 *   monthSpans: [{ monthIndex, startCol, endCol }]  — monthIndex 1-12 用于 i18n 翻译
 *   totalCols: number of columns
 */
export function generateYearGrid(year) {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)

  // Monday of the week containing Jan 1
  const weekStart = new Date(jan1)
  weekStart.setDate(jan1.getDate() - daysSinceMonday(jan1))

  const weeks = []
  const cursor = new Date(weekStart)

  // Keep generating weeks until we've passed Dec 31
  // and the week starts in the next year
  while (true) {
    const week = []
    let hasCurrentYearDay = false
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor)
      d.setDate(cursor.getDate() + i)
      const inYear = d.getFullYear() === year
      if (inYear) hasCurrentYearDay = true
      week.push({
        day: inYear ? d.getDate() : null,
        month: inYear ? d.getMonth() + 1 : null,
        dateStr: inYear ? dateStr(d) : null,
        isEmpty: !inYear,
        fullDate: d
      })
    }
    weeks.push(week)

    cursor.setDate(cursor.getDate() + 7)

    // Stop when the week starts after Dec 31 and has no days of this year
    if (cursor > dec31 && !hasCurrentYearDay) break
    // Safety
    if (weeks.length > 55) break
  }

  // Calculate month spans (with monthIndex for i18n)
  const monthSpans = []
  for (let m = 1; m <= 12; m++) {
    const firstDay = new Date(year, m - 1, 1)
    const lastDay = new Date(year, m, 0)

    const startCol = colOfDate(firstDay, weekStart)
    const endCol = colOfDate(lastDay, weekStart)

    if (startCol !== -1) {
      monthSpans.push({
        monthIndex: m,  // 1-12, 用于翻译
        startCol,
        endCol: endCol !== -1 ? endCol : weeks.length - 1
      })
    }
  }

  return { weeks, monthSpans, totalCols: weeks.length, year }
}

function colOfDate(date, weekStart) {
  const diff = Math.floor((date - weekStart) / (7 * 86400000))
  return diff >= 0 ? diff : -1
}

/**
 * Divide totalCols into segments of at most colsPerRow.
 * Returns array of { start, end } (inclusive).
 * Each segment has colsPerRow columns except the last may be shorter.
 */
export function divideSegments(totalCols, colsPerRow) {
  const segs = []
  let pos = 0
  while (pos < totalCols) {
    const end = Math.min(pos + colsPerRow, totalCols) - 1
    segs.push({ start: pos, end })
    pos += colsPerRow
  }
  return segs
}
