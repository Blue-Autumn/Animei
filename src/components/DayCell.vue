<template>
  <div
    class="day-cell"
    :class="{
      'has-color': hasColor,
      'is-today': isToday,
      'is-empty': isEmpty,
      'brush-mode': brushMode
    }"
    :style="cellStyle"
    @click="handleClick"
    :title="tooltip"
    ref="cellRef"
  >
    <span class="day-number" v-if="!isEmpty" :style="{ fontSize: Math.max(7, cellSize * 0.47) + 'px' }">{{ day }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../locales/index.js'

const { t } = useI18n()

const props = defineProps({
  day: { type: Number, default: null },
  month: { type: Number, default: null },
  year: { type: Number, default: null },
  dateStr: { type: String, default: null },
  colorIndices: { type: Array, default: null }, // 颜色索引数组 [0,3] 或 null
  themeColors: { type: Array, default: () => [] },
  isEmpty: { type: Boolean, default: false },
  isToday: { type: Boolean, default: false },
  brushMode: { type: Boolean, default: false },
  cellSize: { type: Number, default: 19 }
})

const emit = defineEmits(['select'])

const hasColor = computed(() => props.colorIndices && props.colorIndices.length > 0)

const cellStyle = computed(() => {
  const s = {
    width: props.cellSize + 'px',
    height: props.cellSize + 'px'
  }
  if (!hasColor.value) return s

  const indices = props.colorIndices
  const colors = indices.map(idx => props.themeColors[idx] || '#333')

  if (colors.length === 1) {
    s.background = `${colors[0]} no-repeat border-box`
  } else {
    const segments = colors.length
    const pct = 100 / segments
    const stops = colors.map((c, i) => {
      const start = i * pct
      const end = (i + 1) * pct
      return `${c} ${start}% ${end}%`
    })
    s.background = `linear-gradient(to right, ${stops.join(', ')}) no-repeat border-box`
  }
  return s
})

const tooltip = computed(() => {
  if (props.dateStr) {
    if (hasColor.value) {
      return t('cell.tooltip', { dateStr: props.dateStr, colors: props.colorIndices.join(', ') })
    }
    return props.dateStr
  }
  return ''
})

function handleClick() {
  if (props.isEmpty) return
  emit('select', { dateStr: props.dateStr, day: props.day })
}
</script>

<style scoped>
.day-cell {
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(255, 255, 255, 0.03);
  position: relative;
  flex-shrink: 0;
}

.day-cell.is-empty {
  border: none;
  background: transparent;
  cursor: default;
  pointer-events: none;
}

.day-cell:not(.is-empty):hover {
  transform: scale(1.3);
  border-color: rgba(255, 255, 255, 0.25);
  z-index: 3;
}

.day-cell.brush-mode:not(.is-empty):hover {
  transform: scale(1.3);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

.day-cell.is-today {
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.1);
}

.day-cell.has-color {
  border-color: transparent;
}

.day-number {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
  pointer-events: none;
}

.has-color .day-number {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.is-today .day-number {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}
</style>
