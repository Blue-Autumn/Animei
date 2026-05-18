<template>
  <div class="year-section">
    <div class="year-label">{{ year }}</div>

    <div
      class="month-grid-outer"
      ref="gridRef"
      :style="gridStyle"
    >
      <div
        v-for="month in monthData"
        :key="month.monthIndex"
        class="month-block"
      >
        <!-- Month title -->
        <div class="month-title" :style="{ fontSize: titleFontSize + 'px' }">
          {{ t('month.' + month.monthIndex) }}
        </div>

        <!-- Weekday labels -->
        <div class="wk-row" :style="{ gap: innerGap + 'px' }">
          <div
            v-for="(label, i) in dayLabelKeys"
            :key="i"
            class="wk-label"
            :style="{
              width: finalCellSize + 'px',
              lineHeight: finalCellSize + 'px',
              fontSize: wkFontSize + 'px'
            }"
          >{{ t('weekday.' + i) }}</div>
        </div>

        <!-- 6 week rows -->
        <div
          v-for="(week, wi) in month.weeks"
          :key="wi"
          class="wk-row"
          :style="{ gap: innerGap + 'px' }"
        >
          <div
            v-for="(cell, ci) in week"
            :key="ci"
            class="cell-slot"
            :style="{ width: finalCellSize + 'px', height: finalCellSize + 'px' }"
            @mousedown="onCellMouseDown($event, cell)"
            @mouseenter="onCellMouseEnter($event, cell)"
          >
            <DayCell
              v-if="!cell.isEmpty"
              :day="cell.day"
              :month="cell.month"
              :year="year"
              :date-str="cell.dateStr"
              :color-indices="getColorIndices(cell.dateStr)"
              :theme-colors="themeColors"
              :is-empty="false"
              :is-today="isToday(cell.dateStr)"
              :brush-mode="brushActive"
              :cell-size="finalCellSize"
              @select="() => onCellSelect(cell)"
            />
            <div v-else class="empty-slot" :style="{ width: finalCellSize + 'px', height: finalCellSize + 'px' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import DayCell from './DayCell.vue'
import { generateYearMonthGrids } from '../utils/monthGrid.js'
import { useI18n } from '../locales/index.js'

const { t } = useI18n()

const props = defineProps({
  year: { type: Number, required: true },
  colors: { type: Object, default: () => ({}) },
  brushActive: { type: Boolean, default: false },
  brushColor: { type: Number, default: null },
  overwriteMode: { type: Boolean, default: true },
  themeColors: { type: Array, default: () => [] },
  cellSize: { type: Number, default: null } // null = auto
})

const emit = defineEmits(['select-date', 'color-date', 'paint-batch'])

const dayLabelKeys = [0, 1, 2, 3, 4, 5, 6]  // for weekday.0 - weekday.6

const gridRef = ref(null)

// ── Layout auto-selection ──
const LAYOUTS = [
  { cols: 6, rows: 2 },
  { cols: 4, rows: 3 },
  { cols: 3, rows: 4 },
  { cols: 2, rows: 6 }
]

const layoutState = ref({ cols: 6, rows: 2 })
const finalCellSize = ref(19)
const innerGap = ref(4)
const outerGap = ref(10)
const titleFontSize = ref(13)

const wkFontSize = computed(() => Math.max(7, Math.round(finalCellSize.value * 0.42)))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${layoutState.value.cols}, 1fr)`,
  gap: outerGap.value + 'px',
  justifyContent: 'center'
}))

function computeBestLayout() {
  if (!gridRef.value) return

  const container = gridRef.value
  const availWidth = container.clientWidth
  if (availWidth <= 0) return

  const manualCellSize = props.cellSize

  if (manualCellSize !== null) {
    const g = Math.max(2, Math.round(manualCellSize * 0.21))
    const og = Math.max(8, Math.round(manualCellSize * 0.42))

    for (const layout of LAYOUTS) {
      const blockW = manualCellSize * 7 + g * 6
      const totalW = blockW * layout.cols + og * (layout.cols - 1)
      if (totalW <= availWidth) {
        layoutState.value = layout
        finalCellSize.value = manualCellSize
        innerGap.value = g
        outerGap.value = og
        titleFontSize.value = Math.max(11, Math.round(manualCellSize * 0.68))
        return
      }
    }
    layoutState.value = LAYOUTS[3]
    finalCellSize.value = manualCellSize
    innerGap.value = g
    outerGap.value = og
    titleFontSize.value = Math.max(11, Math.round(manualCellSize * 0.68))
    return
  }

  let bestScore = -1
  let bestLayout = LAYOUTS[0]
  let bestCellSize = 19

  for (const layout of LAYOUTS) {
    const denom = 8.68 * layout.cols - 0.42
    let cellGuess = Math.floor(availWidth / denom)
    cellGuess = Math.max(8, Math.min(40, cellGuess))

    const ig = Math.max(2, Math.round(cellGuess * 0.21))
    const og2 = Math.max(8, Math.round(cellGuess * 0.42))
    const blockW = cellGuess * 7 + ig * 6
    const totalW = blockW * layout.cols + og2 * (layout.cols - 1)

    while (totalW > availWidth && cellGuess > 8) {
      cellGuess--
      const ig2 = Math.max(2, Math.round(cellGuess * 0.21))
      const og3 = Math.max(8, Math.round(cellGuess * 0.42))
      const bW = cellGuess * 7 + ig2 * 6
      const tW = bW * layout.cols + og3 * (layout.cols - 1)
      if (tW <= availWidth) break
    }

    if (cellGuess < 8) continue

    const score = cellGuess * 10 + layout.cols * 0.5
    if (score > bestScore) {
      bestScore = score
      bestLayout = layout
      bestCellSize = cellGuess
    }
  }

  layoutState.value = bestLayout
  finalCellSize.value = bestCellSize
  innerGap.value = Math.max(2, Math.round(bestCellSize * 0.21))
  outerGap.value = Math.max(8, Math.round(bestCellSize * 0.42))
  titleFontSize.value = Math.max(11, Math.round(bestCellSize * 0.68))
}

let resizeObserver = null

onMounted(() => {
  computeBestLayout()
  resizeObserver = new ResizeObserver(() => { computeBestLayout() })
  if (gridRef.value) resizeObserver.observe(gridRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

// ── Month data ──
const monthData = computed(() => generateYearMonthGrids(props.year))

// ── Today ──
const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})
function isToday(ds) { return ds && ds === todayStr.value }

// ── Color access ──
function getColorIndices(dateStr) {
  if (!dateStr) return null
  const data = props.colors[dateStr]
  if (Array.isArray(data) && data.length > 0) return data
  return null
}

// ── Color computation ──
function computeNewIndices(existing, brushIdx, overwrite) {
  if (brushIdx === null) return null
  if (overwrite) return [brushIdx]
  if (!existing || existing.length === 0) return [brushIdx]
  if (existing.includes(brushIdx)) return existing
  if (existing.length >= 4) return existing
  return [...existing, brushIdx]
}

// ── Drag painting ──
let isPainting = false
let paintedSet = new Set()
let pendingBatch = []

function startPaint(dateStr) {
  if (!props.brushActive || !dateStr) return
  const prev = getColorIndices(dateStr)
  const next = computeNewIndices(prev, props.brushColor, props.overwriteMode)
  if (JSON.stringify(prev) === JSON.stringify(next)) return

  isPainting = true
  paintedSet.add(dateStr)
  pendingBatch.push({ dateStr, prev, next })
  emit('color-date', dateStr, next)
}

function continuePaint(dateStr) {
  if (!isPainting || !props.brushActive || !dateStr) return
  const batchEntry = pendingBatch.find(e => e.dateStr === dateStr)
  const current = batchEntry ? batchEntry.next : getColorIndices(dateStr)
  if (paintedSet.has(dateStr)) return
  const next = computeNewIndices(current, props.brushColor, props.overwriteMode)
  if (JSON.stringify(current) === JSON.stringify(next)) return
  paintedSet.add(dateStr)
  pendingBatch.push({ dateStr, prev: current, next })
  emit('color-date', dateStr, next)
}

function endPaint() {
  if (isPainting && pendingBatch.length > 0) {
    emit('paint-batch', pendingBatch)
  }
  isPainting = false
  paintedSet = new Set()
  pendingBatch = []
}

// ── Cell events ──
function onCellSelect(cell) {
  if (props.brushActive) {
    const dateStr = cell.dateStr
    const prev = getColorIndices(dateStr)
    const next = computeNewIndices(prev, props.brushColor, props.overwriteMode)
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      emit('color-date', dateStr, next)
      emit('paint-batch', [{ dateStr, prev, next }])
    }
  } else {
    emit('select-date', { dateStr: cell.dateStr, year: props.year })
  }
}

function onCellMouseDown(event, cell) {
  if (!props.brushActive || cell.isEmpty) return
  event.preventDefault()
  startPaint(cell.dateStr)
}

function onCellMouseEnter(event, cell) {
  if (event.buttons !== 1) { endPaint(); return }
  if (!props.brushActive || cell.isEmpty) return
  continuePaint(cell.dateStr)
}

if (typeof document !== 'undefined') document.addEventListener('mouseup', endPaint)
</script>

<style scoped>
.year-section { margin-bottom: 28px; }
.year-label {
  font-size: 38px; font-weight: 700; color: rgba(255,255,255,0.85);
  margin-bottom: 12px; letter-spacing: 2px;
}

.month-grid-outer {
  user-select: none;
  -webkit-user-select: none;
}

.month-block {
  min-width: 0;
}

.month-title {
  font-weight: 700;
  color: rgba(255,255,255,0.55);
  margin-bottom: 4px;
  letter-spacing: 1px;
  white-space: nowrap;
  text-align: center;
}

.wk-row {
  display: flex;
  justify-content: center;
  margin-bottom: 2px;
}

.wk-label {
  flex-shrink: 0;
  text-align: center;
  font-weight: 500;
  color: rgba(255,255,255,0.2);
}

.cell-slot {
  flex-shrink: 0;
}

.empty-slot {
  flex-shrink: 0;
}
</style>
