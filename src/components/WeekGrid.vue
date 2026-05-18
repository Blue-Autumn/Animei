<template>
  <div class="year-section">
    <div class="year-label">{{ year }}</div>

    <div class="grid-outer" ref="gridOuterRef">
      <template v-for="(seg, segIdx) in segments" :key="'seg-' + segIdx">
        <div class="grid-segment">
          <!-- Month headers for this segment -->
          <div class="month-header-row">
            <div class="row-label-spacer" :style="{ width: labelWidth + 'px' }"></div>
            <div
              v-for="span in segmentMonths(seg)"
              :key="span.monthIndex"
              class="month-span"
              :style="monthSpanStyle(span, seg)"
            >
              {{ t('month.' + span.monthIndex) }}
            </div>
          </div>

          <!-- 7 rows of cells, skip rows with no non-empty cells -->
          <template v-for="row in 7" :key="'r' + segIdx + '-' + row">
            <div
              v-if="segmentRowHasContent(seg, row)"
              class="grid-row"
            >
              <div class="row-label" :style="{ width: labelWidth + 'px', height: cellSize + 'px', lineHeight: cellSize + 'px', fontSize: Math.max(8, cellSize * 0.47) + 'px' }">{{ t('weekday.' + (row - 1)) }}</div>
              <div
                v-for="(week, col) in weeks.slice(seg.start, seg.end + 1)"
                :key="'c' + segIdx + '-' + row + '-' + col"
                class="cell-slot"
                :style="{ width: cellSize + 'px', height: cellSize + 'px', marginRight: gap + 'px' }"
                @mousedown="onCellMouseDown($event, week[row - 1])"
                @mouseenter="onCellMouseEnter($event, week[row - 1])"
              >
                <DayCell
                  v-if="!week[row - 1].isEmpty"
                  :day="week[row - 1].day"
                  :month="week[row - 1].month"
                  :year="year"
                  :date-str="week[row - 1].dateStr"
                  :color-indices="getColorIndices(week[row - 1].dateStr)"
                  :theme-colors="themeColors"
                  :is-empty="false"
                  :is-today="isToday(week[row - 1].dateStr)"
                  :brush-mode="brushActive"
                  :cell-size="cellSize"
                  @select="(d) => onCellSelect(d, week[row - 1])"
                />
                <div v-else class="empty-slot" :style="{ width: cellSize + 'px', height: cellSize + 'px', marginRight: gap + 'px' }"></div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import DayCell from './DayCell.vue'
import { generateYearGrid, divideSegments } from '../utils/grid.js'
import { useI18n } from '../locales/index.js'

const { t } = useI18n()

const props = defineProps({
  year: { type: Number, required: true },
  colors: { type: Object, default: () => ({}) },
  brushActive: { type: Boolean, default: false },
  brushColor: { type: Number, default: null },
  deleteMode: { type: Boolean, default: false },
  overwriteMode: { type: Boolean, default: true },
  themeColors: { type: Array, default: () => [] },
  cellSize: { type: Number, default: 19 }
})

const emit = defineEmits(['select-date', 'color-date', 'paint-batch'])

const gap = computed(() => Math.max(2, Math.round(props.cellSize * 0.21)))
const labelWidth = computed(() => Math.max(24, Math.round(props.cellSize * 1.58)))
const CELL_STEP = computed(() => props.cellSize + gap.value)

const gridData = computed(() => generateYearGrid(props.year))
const weeks = computed(() => gridData.value.weeks)
const monthSpans = computed(() => gridData.value.monthSpans)

const todayStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})
function isToday(ds) { return ds && ds === todayStr.value }

// ─── Container width measurement for auto-segmentation ───
const gridOuterRef = ref(null)
const containerWidth = ref(10000) // fallback large

let resizeObs = null
onMounted(() => {
  if (gridOuterRef.value) {
    containerWidth.value = gridOuterRef.value.clientWidth
    resizeObs = new ResizeObserver(() => {
      containerWidth.value = gridOuterRef.value.clientWidth
    })
    resizeObs.observe(gridOuterRef.value)
  }
})
onUnmounted(() => {
  if (resizeObs) resizeObs.disconnect()
})

// ─── Auto-segmentation based on available width ───
const colsPerRow = computed(() => {
  const avail = containerWidth.value - labelWidth.value - 12
  const step = CELL_STEP.value
  const raw = Math.floor(avail / step)
  return Math.max(7, Math.min(53, raw))
})

const segments = computed(() => {
  return divideSegments(weeks.value.length, colsPerRow.value)
})

// ─── Filter monthSpans to only those starting within a segment ───
function segmentMonths(seg) {
  return monthSpans.value.filter(span =>
    span.startCol >= seg.start && span.startCol <= seg.end
  )
}

// ─── Check if a row (1-7) in a segment has any non-empty cell ───
function segmentRowHasContent(seg, row) {
  for (let col = seg.start; col <= seg.end; col++) {
    const cell = weeks.value[col]?.[row - 1]
    if (cell && !cell.isEmpty) return true
  }
  return false
}

// ─── Month span style within a segment context ───
function monthSpanStyle(span, seg) {
  const relStart = span.startCol - seg.start
  const leftPos = labelWidth.value + relStart * CELL_STEP.value
  const naturalWidth = (span.endCol - span.startCol + 1) * CELL_STEP.value - gap.value
  const segWidth = labelWidth.value + (seg.end - seg.start + 1) * CELL_STEP.value - gap.value

  const style = {
    fontSize: Math.max(8, props.cellSize * 0.53) + 'px',
    height: Math.max(14, props.cellSize * 0.6) + 'px',
    lineHeight: Math.max(14, props.cellSize * 0.6) + 'px'
  }

  // If the label would overflow the segment right edge, align right
  if (leftPos + naturalWidth > segWidth) {
    style.right = gap.value + 'px'
    style.width = Math.min(naturalWidth, segWidth - labelWidth.value) + 'px'
    style.direction = 'rtl'
    style.textAlign = 'right'
    style.paddingRight = '2px'
    style.paddingLeft = '0'
  } else {
    style.left = leftPos + 'px'
    style.width = naturalWidth + 'px'
  }
  return style
}

// ─── Get color indices for a date ───
function getColorIndices(dateStr) {
  if (!dateStr) return null
  const data = props.colors[dateStr]
  if (Array.isArray(data) && data.length > 0) return data
  return null
}

// ─── Color computation helper ───
function computeNewIndices(existing, brushIdx, overwrite) {
  if (brushIdx === null) return null
  if (overwrite) return [brushIdx]
  if (!existing || existing.length === 0) return [brushIdx]
  if (existing.includes(brushIdx)) return existing
  if (existing.length >= 4) return existing
  return [...existing, brushIdx]
}

// ─── Drag painting ───
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

// ─── Cell events ───
function onCellSelect(data, cell) {
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
.year-section { margin-bottom: 28px; position: relative; }
.year-label {
  font-size: 20px; font-weight: 700; color: rgba(255, 255, 255, 0.85);
  margin-bottom: 6px; letter-spacing: 2px;
}
.grid-outer { position: relative; overflow: visible; width: 100%; }

.grid-segment {
  position: relative;
  margin-bottom: 20px;
  width: max-content;
  min-width: 100%;
}
.grid-segment:last-child { margin-bottom: 0; }

.month-header-row { display: flex; align-items: center; position: relative; height: 20px; }
.row-label-spacer { flex-shrink: 0; }
.month-span {
  position: absolute; top: 0;
  font-weight: 600; color: rgba(255, 255, 255, 0.3); letter-spacing: 0.5px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 2px;
}
.grid-row { display: flex; align-items: center; gap: 0; margin-bottom: 4px; }
.row-label {
  font-size: 9px; color: rgba(255, 255, 255, 0.22);
  text-align: center; font-weight: 500; flex-shrink: 0;
}
.cell-slot { flex-shrink: 0; }
.cell-slot:last-child { margin-right: 0 !important; }
.empty-slot { flex-shrink: 0; }
</style>
