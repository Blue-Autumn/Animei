const SETTINGS_KEY = 'animei_settings'

export const DEFAULT_SETTINGS = {
  cellSize: null,       // null = 自动 / Auto
  startYear: 2024,
  endYear: new Date().getFullYear() + 5,
  currentTheme: 0,      // 当前调色板索引
  viewMode: 'year',     // 'year' | 'month'
  locale: 'zh',         // 语言 / language: 'zh' | 'en'
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY)
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}
