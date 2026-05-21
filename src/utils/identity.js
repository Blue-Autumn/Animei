/**
 * 身份体系 — 多端同步的用户标识
 *
 * 每个浏览器/设备在首次使用时自动生成唯一身份 ID，
 * 身份信息持久化到 localStorage，丢失则重新生成。
 *
 * API: identity 对象在 import 时自动初始化
 *
 * 数据结构:
 *   {
 *     id: string,        // 唯一标识符 (e.g. "dev_a1b2c3d4")
 *     name: string,      // 用户自定义显示名 (e.g. "小明的工作电脑")
 *     createdAt: string, // 创建时间 ISO
 *     version: int       // 格式版本号
 *   }
 */

const STORAGE_KEY = 'animei_identity'
const CURRENT_VERSION = 1

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── 单例身份 ──

/**
 * 读取或创建身份
 * @returns {{ id: string, name: string, createdAt: string, version: number }}
 */
function loadOrCreate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      // 版本迁移：version 不存在则补为 1
      if (!obj.version) obj.version = 1
      if (!obj.name) obj.name = '未命名设备'
      return obj
    }
  } catch { /* 解析失败则重建 */ }
  const identity = {
    id: 'dev_' + uid(),
    name: '未命名设备',
    createdAt: new Date().toISOString(),
    version: CURRENT_VERSION
  }
  saveIdentity(identity)
  return identity
}

function saveIdentity(identity) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
}

/** 全局单例 — import 时自动初始化 */
export const identity = loadOrCreate()

/**
 * 更新显示名称
 * @param {string} newName
 */
export function setIdentityName(newName) {
  identity.name = newName
  saveIdentity(identity)
}

/**
 * 检查是否已经完成过身份设置（用户是否手动确认过名称）
 * 判断标准：名称不是默认的"未命名设备"
 */
export function isIdentitySet() {
  return identity.name !== '未命名设备'
}

/**
 * 获取身份请求头
 * @returns {{ 'X-Identity-Id': string, 'X-Identity-Name': string }}
 */
export function getIdentityHeaders() {
  return {
    'X-Identity-Id': identity.id,
    'X-Identity-Name': encodeURIComponent(identity.name)
  }
}

/**
 * 获取当前身份 ID（用于多用户时间表隔离）
 * @returns {string}
 */
export function getOwner() {
  return identity.id
}
