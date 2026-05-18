/**
 * 调色板主题定义
 * 每个主题包含 11 种颜色（索引 0-10）
 * 可自由添加/修改，重启即生效
 */
export const THEMES = [
  {
    name: 'Office 经典',
    colors: [
      '#e74c3c', // 0 红
      '#e67e22', // 1 橙
      '#f1c40f', // 2 黄
      '#2ecc71', // 3 绿
      '#1abc9c', // 4 青
      '#3498db', // 5 蓝
      '#9b59b6', // 6 紫
      '#e84393', // 7 粉
      '#95a5a6', // 8 灰
      '#d4a017', // 9 金
      '#636e72', // 10 深灰
    ]
  },
  {
    name: 'Office 暖色',
    colors: [
      '#FF6B6B', '#FF9F43', '#FECA57', '#A8E6CF', '#55E6C1',
      '#54A0FF', '#5F27CD', '#FF9FF3', '#C8D6E5', '#FF6348',
      '#576574'
    ]
  },
  {
    name: 'Office 冷色',
    colors: [
      '#FF6B6B', '#FD9644', '#FED330', '#2ED573', '#7BED9F',
      '#45AAF2', '#7158E2', '#F368E0', '#A4B0BE', '#E15F41',
      '#747D8C'
    ]
  },
  {
    name: '极夜',
    colors: [
      '#1a1a2e', '#16213e', '#0f3460', '#2ecc71', '#1abc9c',
      '#3498db', '#533483', '#e84393', '#95a5a6', '#e94560',
      '#636e72'
    ]
  },
  {
    name: '樱花',
    colors: [
      '#FFB7C5', '#FF9BB3', '#FF7BA0', '#C8E6C9', '#81C784',
      '#90CAF9', '#CE93D8', '#F48FB1', '#B0BEC5', '#FFAB91',
      '#78909C'
    ]
  },
  {
    name: '海洋',
    colors: [
      '#006064', '#00838F', '#0097A7', '#00ACC1', '#26C6DA',
      '#4DD0E1', '#80DEEA', '#B2EBF2', '#E0F7FA', '#00BCD4',
      '#546E7A'
    ]
  },
  {
    name: '森林',
    colors: [
      '#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50',
      '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9',
      '#558B2F'
    ]
  },
  {
    name: '日落',
    colors: [
      '#D32F2F', '#E53935', '#F44336', '#EF5350', '#E57373',
      '#FF8A65', '#FFAB91', '#FFCCBC', '#FF9800', '#FFB74D',
      '#BF360C'
    ]
  },
  {
    name: '莫兰迪',
    colors: [
      '#C4A882', '#B5C1A6', '#A3B1C6', '#C4A6A6', '#B5A6C4',
      '#A6C4B5', '#D4C4A6', '#C4B5A3', '#A3A3A3', '#B5A6A6',
      '#8A9BA8'
    ]
  },
  {
    name: '赛博朋克',
    colors: [
      '#FF003C', '#FF5E00', '#FFD600', '#00FFC8', '#00E5FF',
      '#2979FF', '#7C4DFF', '#FF00E5', '#8C9EFF', '#FFAB00',
      '#00BFA5'
    ]
  },
  {
    name: '糖霜',
    colors: [
      '#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A',
      '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F',
      '#9C27B0'
    ]
  },
  {
    name: '大地',
    colors: [
      '#5D4037', '#6D4C41', '#795548', '#8D6E63', '#A1887F',
      '#BCAAA4', '#D7CCC8', '#EFEBE9', '#4E342E', '#3E2723',
      '#A1887F'
    ]
  },
  {
    name: '天空',
    colors: [
      '#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3',
      '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD',
      '#82B1FF'
    ]
  },
  {
    name: '霓虹',
    colors: [
      '#FF0055', '#FF5500', '#FFAA00', '#00FF55', '#00FFFF',
      '#0055FF', '#AA00FF', '#FF00AA', '#55FF00', '#FF0000',
      '#FFFFFF'
    ]
  },
  {
    name: '温和',
    colors: [
      '#EF9A9A', '#FFCC80', '#FFF59D', '#A5D6A7', '#80DEEA',
      '#90CAF9', '#CE93D8', '#F48FB1', '#B0BEC5', '#FFAB91',
      '#BCAAA4'
    ]
  },
  {
    name: '复古',
    colors: [
      '#8B4513', '#A0522D', '#CD853F', '#DAA520', '#B8860B',
      '#556B2F', '#8B008B', '#800000', '#2F4F4F', '#708090',
      '#5F9EA0'
    ]
  },
]

/**
 * 获取调色板（按索引）
 */
export function getTheme(index) {
  return THEMES[index] || THEMES[0]
}

/**
 * 调色板数量
 */
export const THEME_COUNT = THEMES.length
