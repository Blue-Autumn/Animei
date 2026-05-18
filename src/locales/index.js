// ============================================
// i18n 统一管理 - useI18n composable
//
// 使用方式:
//   import { useI18n } from '../locales/index.js'
//   const { t, locale, setLocale } = useI18n()
//   模板: {{ t('nav.today') }}
//   带参数: {{ t('status.recordCount', { count: 42 }) }}
//
// 添加新语言:
//   1. 新建 src/locales/xx.js （参照 zh.js 格式）
//   2. 在此文件 import 并加入 locales 对象
// ============================================

import { ref, computed } from 'vue'
import zh from './zh.js'
import en from './en.js'

const LOCALE_KEY = 'animei_locale'
const FALLBACK_LOCALE = 'zh'

// 所有支持的语言合集（在此注册新语言）
const locales = { zh, en }

// ===== 语言名称映射（用于设置界面的下拉框显示） =====
const localeNames = {
  zh: '中文',
  en: 'English'
}

// 全局单例，确保所有组件共享同一实例
const currentLocale = ref(loadLocale())

function loadLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved && locales[saved]) return saved
  } catch {}
  return FALLBACK_LOCALE
}

function saveLocale(locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {}
}

const messages = computed(() => locales[currentLocale.value] || locales[FALLBACK_LOCALE])

/**
 * 核心翻译函数
 * @param {string} key - 翻译键
 * @param {object} params - 可选参数替换 {key} 占位符
 * @returns {string}
 */
export function useI18n() {
  function t(key, params = {}) {
    let msg = messages.value[key]
    // fallback 到中文
    if (msg === undefined) {
      msg = locales[FALLBACK_LOCALE][key]
    }
    // 最后 fallback 到 key 本身
    if (msg === undefined) msg = key

    // 替换 {param} 占位符
    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
      }
    }
    return msg
  }

  function setLocale(locale) {
    if (locales[locale]) {
      currentLocale.value = locale
      saveLocale(locale)
    }
  }

  return {
    t,
    locale: currentLocale,
    setLocale,
    availableLocales: Object.keys(locales),
    localeNames
  }
}
