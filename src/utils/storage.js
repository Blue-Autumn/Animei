const COLOR_KEY = 'animei_colors'

// ── 颜色记录（格子染色） ──
export function loadColors() {
  try {
    const data = localStorage.getItem(COLOR_KEY)
    if (!data) return {}
    const colors = JSON.parse(data)

    // 检测旧格式（以 # 开头的字符串值），直接清空
    for (const key of Object.keys(colors)) {
      if (typeof colors[key] === 'string' && colors[key].startsWith('#')) {
        localStorage.removeItem(COLOR_KEY)
        return {}
      }
    }

    return colors
  } catch { return {} }
}

export function saveColors(colors) {
  localStorage.setItem(COLOR_KEY, JSON.stringify(colors))
}

/**
 * 设置单日颜色
 * @param {Object} colors - 颜色数据对象
 * @param {string} dateStr - 日期字符串 "YYYY-MM-DD"
 * @param {number[]|null} colorIndices - 颜色索引数组，null 表示删除
 */
export function setColor(colors, dateStr, colorIndices) {
  if (colorIndices && colorIndices.length > 0) {
    colors[dateStr] = colorIndices
  } else {
    delete colors[dateStr]
  }
  saveColors(colors)
  return { ...colors }
}

/**
 * 批量更新颜色
 * @param {Object} colors - 颜色数据对象
 * @param {Array} updates - [{ dateStr, colorIndices }]
 */
export function setColors(colors, updates) {
  for (const { dateStr, colorIndices } of updates) {
    if (colorIndices && colorIndices.length > 0) {
      colors[dateStr] = colorIndices
    } else {
      delete colors[dateStr]
    }
  }
  saveColors(colors)
  return { ...colors }
}
