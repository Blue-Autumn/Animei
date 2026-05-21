/**
 * 时间表云端同步 — 状态管理 & 差异对比逻辑
 *
 * 每条时间表相对云端的 6 种同步状态：
 *   'synced'      — 本地与云端一致（syncedAt 非 null 且两端时间都不晚于同步时间）
 *   'local-only'  — 本地有但云端没有
 *   'cloud-only'  — 云端有但本地没有（仅拉取方向出现）
 *   'local-newer' — 两边都有，本地修改时间更新
 *   'cloud-newer' — 两边都有，云端修改时间更新
 *   'conflict'    — 两边都有，且自上次同步后两端都已修改（同步时间早于两端的最新时间）
 */

// ── 状态字面量 ──
export const SYNC_STATE = {
  SYNCED: 'synced',
  LOCAL_ONLY: 'local-only',
  CLOUD_ONLY: 'cloud-only',
  LOCAL_NEWER: 'local-newer',
  CLOUD_NEWER: 'cloud-newer',
  CONFLICT: 'conflict'
}

import { getOwner } from './identity.js'

/**
 * 获取云端时间表列表
 * @returns {Promise<{ timelines: Array, updatedAt: string }>}
 */
export async function fetchCloudTimelines({ all = false } = {}) {
  const owner = all ? 'all' : (getOwner() || '')
  const res = await fetch(`/api/timelines?owner=${encodeURIComponent(owner)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * 上传时间表列表到云端（全量替换）
 * @param {Array} timelines 要上传的时间表数组
 * @returns {Promise<{ success: boolean, count: number }>}
 */
export async function pushTimelinesToCloud(timelines) {
  const owner = getOwner() || ''
  const res = await fetch('/api/timelines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timelines, owner })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── 状态判定 ──

/**
 * 计算单条本地时间表 vs 云端对应表的同步状态
 * @param {Object} localTl   本地时间表 { id, updatedAt, syncedAt }
 * @param {Object|null} cloudTl  云端对应表（id 匹配），null 表示云端无此表
 * @returns {'synced'|'local-only'|'local-newer'|'cloud-newer'}
 */
export function getTimelineSyncState(localTl, cloudTl) {
  if (!cloudTl) return SYNC_STATE.LOCAL_ONLY
  if (!localTl) return SYNC_STATE.CLOUD_ONLY
  
  const localTime = new Date(localTl.updatedAt || localTl.createdAt || 0).getTime()
  const cloudTime = new Date(cloudTl.updatedAt || cloudTl.createdAt || 0).getTime()
  
  if (localTl.syncedAt) {
    const syncedTime = new Date(localTl.syncedAt).getTime()

    const localAfterSync = localTime > syncedTime
    const cloudAfterSync = cloudTime > syncedTime

    // 两端自上次同步后都修改了 → 冲突
    if (localAfterSync && cloudAfterSync) return SYNC_STATE.CONFLICT
    // 仅本地自上次同步后有更新 → local-newer
    if (localAfterSync) return SYNC_STATE.LOCAL_NEWER
    // 仅云端更新 → cloud-newer
    if (cloudAfterSync) return SYNC_STATE.CLOUD_NEWER
    // 两端都与 syncedAt 一致 → synced
    return SYNC_STATE.SYNCED
  }
  
  // syncedAt 为 null：从未同步过，但云端有同 ID 的副本
  if (localTime > cloudTime) return SYNC_STATE.LOCAL_NEWER
  return SYNC_STATE.CLOUD_NEWER
}

// ── 推送方向差异分析 ──

/**
 * 分析本地时间表推送到云端会产生哪些变化
 * @param {Array} localList  本地全部时间表
 * @param {Array} cloudList  云端全部时间表
 * @returns {Array<{ tl: Object, action: 'create'|'update'|'unchanged', cloudCounterpart: Object|null }>}
 */
export function analyzePushDiff(localList, cloudList) {
  const cloudMap = new Map()
  for (const c of cloudList) cloudMap.set(c.id, c)

  return localList.map(tl => {
    const cloudCounterpart = cloudMap.get(tl.id) || null
    const state = getTimelineSyncState(tl, cloudCounterpart)
    const colorDiff = cloudCounterpart ? diffColors(tl.colors, cloudCounterpart.colors) : null

    let action = 'unchanged'
    if (state === SYNC_STATE.LOCAL_ONLY) action = 'create'
    else if (state === SYNC_STATE.LOCAL_NEWER || state === SYNC_STATE.CONFLICT) action = 'update'
    // synced 或 cloud-newer 不推送

    return { tl, action, cloudCounterpart, state, colorDiff }
  })
}

// ── 拉取方向差异分析 ──

/**
 * 日期级差异（拉取时使用）
 * @param {Object} localColors  本地 colors 对象 { "YYYY-MM-DD": [idx...], ... }
 * @param {Object} cloudColors  云端 colors 对象
 * @returns {{ added: string[], modified: string[], removed: string[], unchanged: string[] }}
 */
export function diffColors(localColors, cloudColors) {
  const local = localColors || {}
  const cloud = cloudColors || {}

  const added = []
  const modified = []
  const removed = []
  const unchanged = []

  const allKeys = new Set([...Object.keys(local), ...Object.keys(cloud)])

  for (const key of allKeys) {
    const hasLocal = key in local
    const hasCloud = key in cloud

    if (!hasLocal && hasCloud) {
      added.push(key)
    } else if (hasLocal && !hasCloud) {
      removed.push(key)
    } else if (hasLocal && hasCloud) {
      const localVal = JSON.stringify(local[key])
      const cloudVal = JSON.stringify(cloud[key])
      if (localVal !== cloudVal) {
        modified.push(key)
      } else {
        unchanged.push(key)
      }
    }
  }

  // 按日期排序
  const sortDates = (a, b) => a.localeCompare(b)
  added.sort(sortDates)
  modified.sort(sortDates)
  removed.sort(sortDates)
  unchanged.sort(sortDates)

  return { added, modified, removed, unchanged }
}

/**
 * 分析云端时间表拉取到本地会产生哪些变化
 * @param {Array} localList  本地全部时间表
 * @param {Array} cloudList  云端全部时间表
 * @returns {Array<{ tl: Object, action: 'create'|'update', colorDiff: Object|null }>}
 */
export function analyzePullDiff(localList, cloudList) {
  const localMap = new Map()
  for (const l of localList) localMap.set(l.id, l)

  const results = []

  for (const cloudTl of cloudList) {
    const localCounterpart = localMap.get(cloudTl.id) || null

    if (!localCounterpart) {
      results.push({
        tl: cloudTl,
        action: 'create',
        colorDiff: {
          added: Object.keys(cloudTl.colors || {}).sort(),
          modified: [],
          removed: [],
          unchanged: []
        },
        localCounterpart: null,
        state: SYNC_STATE.CLOUD_ONLY
      })
    } else {
      const state = getTimelineSyncState(localCounterpart, cloudTl)
      if (state === SYNC_STATE.CLOUD_NEWER || state === SYNC_STATE.CONFLICT) {
        const colorDiff = diffColors(localCounterpart.colors, cloudTl.colors)
        const hasChanges = colorDiff.added.length + colorDiff.modified.length + colorDiff.removed.length > 0
        if (hasChanges || state === SYNC_STATE.CONFLICT) {
          results.push({
            tl: cloudTl,
            action: 'update',
            colorDiff,
            localCounterpart,
            state
          })
        }
      }
      // synced / local-newer 不拉取
    }
  }

  return results
}

/**
 * 将云端数据合并到本地
 * @param {Array} localList  本地全部时间表
 * @param {Object} cloudTl  云端单条时间表
 * @returns {Array} 新的本地列表
 */
export function mergeCloudToLocal(localList, cloudTl) {
  const idx = localList.findIndex(l => l.id === cloudTl.id)
  const now = new Date().toISOString()

  if (idx === -1) {
    // 新建
    return [...localList, {
      ...cloudTl,
      syncedAt: now
    }]
  } else {
    // 更新
    const updated = [...localList]
    updated[idx] = {
      ...localList[idx],
      colors: { ...(cloudTl.colors || {}) },
      name: cloudTl.name,
      updatedAt: now,
      syncedAt: now
    }
    return updated
  }
}

/**
 * 从云端删除一条时间表
 * @param {string} id 要删除的云端时间表 ID
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteCloudTimeline(id) {
  const owner = getOwner() || ''
  const res = await fetch(`/api/timelines/${encodeURIComponent(id)}?owner=${encodeURIComponent(owner)}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── 对外统一接口（用于 App.vue / SidePanel 调用）──

/**
 * 计算差异并返回预览弹窗所需数据
 * @param {string} docId   当前画布关联的时间表 ID
 * @param {'push'|'pull'} direction
 * @returns {Promise<{ isPush: boolean, items: Array }>}
 */
export async function computeTimelineDiff(docId, direction) {
  const { loadTimelines, getTimeline } = await import('./timelineStore.js')

  const localList = loadTimelines()
  const cloudData = await fetchCloudTimelines()
  const cloudList = cloudData.timelines || []

  if (direction === 'push') {
    // 推送方向：处理所有本地时间表 vs 云端
    const items = analyzePushDiff(localList, cloudList)
    return { isPush: true, items }
  } else {
    // 拉取方向：处理所有云端时间表 vs 本地
    const items = analyzePullDiff(localList, cloudList)
    return { isPush: false, items }
  }
}

/**
 * 执行推送：将用户勾选的时间表推送到云端
 * @param {string} docId   当前画布关联的时间表 ID
 * @param {Array} selected 用户在弹窗中勾选的条目
 */
export async function executeTimelinePush(docId, selected) {
  const { loadTimelines, getTimeline, updateTimeline } = await import('./timelineStore.js')
  const localList = loadTimelines()
  const cloudData = await fetchCloudTimelines()
  let cloudList = cloudData.timelines || []

  const now = new Date().toISOString()

  for (const item of selected) {
    const local = getTimeline(item.tl.id)
    if (!local) continue

    const cloudIdx = cloudList.findIndex(c => c.id === item.tl.id)

    const body = {
      id: local.id,
      name: local.name,
      colors: local.colors || {},
      createdAt: local.createdAt || now,
      updatedAt: now
    }

    if (cloudIdx === -1) {
      // 新建到云端
      cloudList.push(body)
    } else {
      // 更新云端
      cloudList[cloudIdx] = { ...cloudList[cloudIdx], ...body }
    }

    // 更新本地 syncedAt
    updateTimeline(local.id, local.colors, now)
  }

  // 全量上传
  await pushTimelinesToCloud(cloudList)
}

/**
 * 执行拉取：将用户勾选的云端时间表拉取到本地
 * @param {string} docId   当前画布关联的时间表 ID
 * @param {Array} selected 用户在弹窗中勾选的条目
 * @returns {Promise<Object|null>} 如果拉取了当前关联的时间表，返回其数据
 */
export async function executeTimelinePull(docId, selected) {
  const { loadTimelines } = await import('./timelineStore.js')
  let localList = loadTimelines()

  let currentDoc = null

  for (const item of selected) {
    localList = mergeCloudToLocal(localList, item.tl)

    // 如果拉取的恰好是当前打开的时间表，返回其数据用于更新画布
    if (item.tl.id === docId) {
      currentDoc = item.tl
    }
  }

  // 写回 localStorage
  const { saveTimelines } = await import('./timelineStore.js')
  saveTimelines(localList)

  return currentDoc
}
