/**
 * 多时间表存档管理
 *
 * 每条存档:
 *   { id, name, colors, createdAt, updatedAt, syncedAt }
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
    if (!raw) return []
    const list = JSON.parse(raw)
    // 迁移：补上 syncedAt、owner 字段
    let migrated = false
    for (const item of list) {
      if (item.syncedAt === undefined) {
        item.syncedAt = null
        migrated = true
      }
      if (!item.owner) {
        item.owner = getOwner() || ''
        migrated = true
      }
    }
    if (migrated) saveTimelines(list)
    return list
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
import { getOwner } from './identity.js'

export function createTimeline(name, colors) {
  const list = loadTimelines()
  const now = new Date().toISOString()
  const doc = {
    id: uid(),
    name,
    colors: { ...colors },
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    owner: getOwner() || ''
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
 * 不重置 syncedAt — 新旧比较由 getTimelineSyncState 根据 updatedAt vs syncedAt 判定
 */
export function updateTimeline(id, colors) {
  const list = loadTimelines()
  const doc = list.find(d => d.id === id)
  if (!doc) return
  doc.colors = { ...colors }
  doc.updatedAt = new Date().toISOString()
  // 不重置 syncedAt：getTimelineSyncState 会用 updatedAt > syncedAt 判断是否待同步
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

/**
 * 标记指定时间表已同步到云端
 * @param {string} id 时间表 ID
 * @param {string} syncedAt 同步时间 ISO 字符串（可选，默认当前时间）
 */
export function markSynced(id, syncedAt) {
  const list = loadTimelines()
  const doc = list.find(d => d.id === id)
  if (!doc) return false
  doc.syncedAt = syncedAt || new Date().toISOString()
  saveTimelines(list)
  return true
}

/**
 * 批量替换本地时间表列表（拉取后全量更新用）
 * @param {Array} newList 新的时间表数组
 */
export function replaceAll(newList) {
  saveTimelines(newList)
}