/**
 * 多时间表存档管理
 *
 * 每条存档:
 *   { id, name, colors, createdAt, updatedAt }
 *
 * 存储: localStorage key = 'animei_timelines'
 */

const STORAGE_KEY = 'animei_timelines'

// ── 内部工具 ──
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ── CRUD ──

export function loadTimelines() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTimelines(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/**
 * 创建新存档
 * @param {string} name
 * @param {object} colors  - 当前画布颜色数据
 * @returns {object} 新创建的存档
 */
export function createTimeline(name, colors) {
  const list = loadTimelines()
  const now = new Date().toISOString()
  const doc = {
    id: uid(),
    name,
    colors: { ...colors },
    createdAt: now,
    updatedAt: now
  }
  list.unshift(doc)
  saveTimelines(list)
  return doc
}

/**
 * 删除存档
 */
export function deleteTimeline(id) {
  const list = loadTimelines()
  const idx = list.findIndex(d => d.id === id)
  if (idx === -1) return
  list.splice(idx, 1)
  saveTimelines(list)
}

/**
 * 更新存档 (覆盖颜色数据 + 更新时间戳)
 */
export function updateTimeline(id, colors) {
  const list = loadTimelines()
  const doc = list.find(d => d.id === id)
  if (!doc) return
  doc.colors = { ...colors }
  doc.updatedAt = new Date().toISOString()
  saveTimelines(list)
}

/**
 * 重命名存档
 */
export function renameTimeline(id, newName) {
  const list = loadTimelines()
  const doc = list.find(d => d.id === id)
  if (!doc) return
  doc.name = newName
  saveTimelines(list)
}

/**
 * 获取单条存档
 */
export function getTimeline(id) {
  const list = loadTimelines()
  return list.find(d => d.id === id) || null
}
