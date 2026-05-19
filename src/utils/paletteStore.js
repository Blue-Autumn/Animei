import { ref, watch } from 'vue'
import { THEMES as DEFAULT_THEMES } from './themes.js'

const STORAGE_KEY = 'animei_palettes'

// ── 从 localStorage 加载 / 否则用默认 ──
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* fall through */ }
  // 深拷贝默认，避免引用
  return DEFAULT_THEMES.map(t => ({ ...t, colors: [...t.colors] }))
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ── 响应式调色板 ──
const themes = ref(load())

// 每次修改自动存盘
watch(themes, (val) => {
  save(val)
}, { deep: true })

/**
 * 更新某个色盘中某个颜色
 */
export function updateColor(themeIdx, colorIdx, hex) {
  const t = themes.value[themeIdx]
  if (!t || !t.colors[colorIdx]) return
  t.colors[colorIdx] = hex
  // 触发响应式
  themes.value = [...themes.value]
}

/**
 * 重命名色盘
 */
export function renameTheme(themeIdx, newName) {
  const t = themes.value[themeIdx]
  if (!t) return
  t.name = newName
  themes.value = [...themes.value]
}

/**
 * 获取色盘名称
 */
export function getThemeName(themeIdx) {
  const t = themes.value[themeIdx]
  return t ? t.name : ''
}

/**
 * 获取色盘颜色数组
 */
export function getThemeColors(themeIdx) {
  const t = themes.value[themeIdx]
  return t ? t.colors : []
}

/**
 * 重置为默认色盘
 */
export function resetThemes() {
  themes.value = DEFAULT_THEMES.map(t => ({ ...t, colors: [...t.colors] }))
}

/**
 * 获取当前色盘的主题对象接口（兼容旧代码）
 */
export function getTheme(index) {
  return themes.value[index] || themes.value[0]
}

export { themes }
