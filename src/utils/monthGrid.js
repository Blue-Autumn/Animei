function pad2(n) {
  return String(n).padStart(2, '0')
}

function dateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Generate month grid data for a given year and month.
 * Always returns 6 rows (weeks) for consistent block height.
 * Each cell: { day, month, dateStr, isEmpty }
 */
export function generateMonthGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const lastDate = lastDay.getDate()

  // getDay(): 0=Sun, 1=Mon ... 6=Sat
  const startDow = firstDay.getDay()
  const startCol = startDow === 0 ? 6 : startDow - 1 // 0=Mon, 6=Sun

  const FIXED_ROWS = 6
  const weeks = []
  let date = 1

  for (let r = 0; r < FIXED_ROWS; r++) {
    const week = []
    for (let c = 0; c < 7; c++) {
      const cellIdx = r * 7 + c
      if (cellIdx < startCol || date > lastDate) {
        week.push({ day: null, month: null, dateStr: null, isEmpty: true })
      } else {
        const d = new Date(year, month - 1, date)
        week.push({
          day: date,
          month: month,
          dateStr: dateStr(d),
          isEmpty: false
        })
        date++
      }
    }
    weeks.push(week)
  }

  return { weeks, month, year, monthIndex: month }
}

/**
 * Generate all 12 months for a given year.
 */
export function generateYearMonthGrids(year) {
  const months = []
  for (let m = 1; m <= 12; m++) {
    months.push(generateMonthGrid(year, m))
  }
  return months
}
