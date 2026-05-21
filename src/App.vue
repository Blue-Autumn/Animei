<template>
  <div class="app">
    <!-- Top toolbar (responsive: single flex-wrap flow) -->
    <nav class="top-bar" :style="{ marginRight: sidePanelOpen ? sidePanelWidth + '%' : '0' }">
      <!-- Logo -->
      <div class="bar-left">
        <span class="logo">Animei</span>
        <span class="subtitle">{{ t('app.subtitle') }}</span>
      </div>

      <!-- Year navigation -->
      <div class="bar-center">
        <button class="bar-btn" @click="prevYear" :disabled="currentYear <= startYear" :title="t('nav.prevYear')">◀</button>
        <span class="current-year">{{ currentYear }}</span>
        <button class="bar-btn" @click="nextYear" :disabled="currentYear >= endYear" :title="t('nav.nextYear')">▶</button>
        <button class="bar-btn today-btn" @click="jumpToToday" :title="t('nav.today')">{{ t('nav.today') }}</button>
      </div>

      <!-- View mode + Focus mode -->
      <div class="bar-views">
        <button
          class="bar-btn viewmode-btn"
          :class="{ active: viewMode === 'month' }"
          @click="toggleViewMode"
          :title="t('view.year')"
        >{{ viewMode === 'month' ? t('view.month') : t('view.year') }}</button>
        <button
          class="bar-btn focus-btn"
          :class="{ active: focusMode }"
          @click="toggleFocusMode"
          :title="t('focus.on')"
        >{{ focusMode ? t('focus.on') : t('focus.off') }}</button>
        <button
          class="bar-btn fit-btn"
          @click="fitCells"
          :title="t('nav.fit')"
        >↔</button>
      </div>

      <!-- Brush toolbar (whole panel wraps together when space is tight) -->
      <BrushToolbar
        class="brush-wrap"
        :active="brushActive"
        :brush-color="brushColor"
        :overwrite-mode="overwriteMode"
        :current-theme="currentTheme"
        :themes="themes"
        :theme-colors="themeColors"
        :can-undo="undoStack.length > 0"
        :can-redo="redoStack.length > 0"
        @toggle="toggleBrush"
        @set-color="setBrushColor"
        @set-theme="onSetTheme"
        @toggle-overwrite="overwriteMode = $event"
        @undo="undo"
        @redo="redo"
      />

      <!-- Side panel toggle -->
      <button
        class="bar-btn panel-btn"
        :class="{ active: sidePanelOpen }"
        @click="sidePanelOpen = !sidePanelOpen"
        title="☰"
      >☰</button>
    </nav>

    <!-- Status info -->
    <div class="status-bar" :style="{ marginRight: sidePanelOpen ? sidePanelWidth + '%' : '0' }">
      <span v-if="brushActive && brushColor !== null" class="status-hint">
        {{ t('status.brushActive', { mode: overwriteMode ? t('status.overwrite') : t('status.add') }) }}
      </span>
      <span v-else-if="brushActive && brushColor === null" class="status-hint">{{ t('status.noColor') }}</span>
      <span v-else-if="focusMode" class="status-hint">{{ t('status.focusMode', { year: currentYear }) }}</span>
      <span v-else class="status-hint"></span>
      <span class="record-count">{{ t('status.recordCount', { count: yearColorCount }) }}</span>
    </div>

    <!-- Scrollable area with view transition -->
    <div
      class="scroll-area"
      :class="{ stoned: isStoneMode }"
      :style="{
        marginRight: sideMarginRight,
        '--stone-blur': STONE.blurRadius + 'px',
        '--stone-darken': STONE.darken,
        '--stone-fi-ms': STONE.fadeInMs + 'ms',
        '--stone-fo-ms': STONE.fadeOutMs + 'ms',
      }"
      ref="scrollRef"
    >
      <Transition name="mode-fade" mode="out-in">
        <!-- Year View (7×53 week grid) -->
        <div v-if="viewMode === 'year'" key="year-view">
          <template v-for="year in prevYears" :key="'prev-' + year">
            <div
              class="year-block"
              :data-year="year"
              :style="focusMode ? focusStyle(year) : {}"
            >
              <WeekGrid
                :year="year"
                :colors="colors"
                :brush-active="brushActive"
                :brush-color="brushColor"
                :overwrite-mode="overwriteMode"
                :theme-colors="themeColors"
                :cell-size="actualCellSize"
                @select-date="onSelectDate"
                @color-date="onColorDate"
                @paint-batch="onPaintBatch"
              />
            </div>
          </template>

          <div ref="currentYearRef" class="year-block" :data-year="currentYear"
            :class="{ 'year-focus': focusMode }"
            :style="focusMode ? focusStyle(currentYear) : {}">
            <WeekGrid
              :year="currentYear"
              :colors="colors"
              :brush-active="brushActive"
              :brush-color="brushColor"
              :overwrite-mode="overwriteMode"
              :theme-colors="themeColors"
              :cell-size="actualCellSize"
              @select-date="onSelectDate"
              @color-date="onColorDate"
              @paint-batch="onPaintBatch"
            />
          </div>

          <template v-for="year in nextYears" :key="'next-' + year">
            <div
              class="year-block"
              :data-year="year"
              :style="focusMode ? focusStyle(year) : {}"
            >
              <WeekGrid
                :year="year"
                :colors="colors"
                :brush-active="brushActive"
                :brush-color="brushColor"
                :overwrite-mode="overwriteMode"
                :theme-colors="themeColors"
                :cell-size="actualCellSize"
                @select-date="onSelectDate"
                @color-date="onColorDate"
                @paint-batch="onPaintBatch"
              />
            </div>
          </template>
        </div>

        <!-- Month View (month blocks layout) -->
        <div v-else key="month-view">
          <template v-for="year in prevYears" :key="'prev-' + year">
            <div
              class="year-block"
              :data-year="year"
              :style="focusMode ? focusStyle(year) : {}"
            >
              <MonthGrid
                :year="year"
                :colors="colors"
                :brush-active="brushActive"
                :brush-color="brushColor"
                :overwrite-mode="overwriteMode"
                :theme-colors="themeColors"
                :cell-size="settings.cellSize"
                @select-date="onSelectDate"
                @color-date="onColorDate"
                @paint-batch="onPaintBatch"
              />
            </div>
          </template>

          <div ref="currentYearRef" class="year-block" :data-year="currentYear"
            :class="{ 'year-focus': focusMode }"
            :style="focusMode ? focusStyle(currentYear) : {}">
            <MonthGrid
              :year="currentYear"
              :colors="colors"
              :brush-active="brushActive"
              :brush-color="brushColor"
              :overwrite-mode="overwriteMode"
              :theme-colors="themeColors"
              :cell-size="settings.cellSize"
              @select-date="onSelectDate"
              @color-date="onColorDate"
              @paint-batch="onPaintBatch"
            />
          </div>

          <template v-for="year in nextYears" :key="'next-' + year">
            <div
              class="year-block"
              :data-year="year"
              :style="focusMode ? focusStyle(year) : {}"
            >
              <MonthGrid
                :year="year"
                :colors="colors"
                :brush-active="brushActive"
                :brush-color="brushColor"
                :overwrite-mode="overwriteMode"
                :theme-colors="themeColors"
                :cell-size="settings.cellSize"
                @select-date="onSelectDate"
                @color-date="onColorDate"
                @paint-batch="onPaintBatch"
              />
            </div>
          </template>
        </div>
      </Transition>
    </div>

    <!-- Side Panel (fixed overlay, not in layout flow) -->
    <SidePanel
      :open="sidePanelOpen"
      :panel-width="sidePanelWidth"
      :settings="settings"
      :timelines="timelines"
      :current-doc-id="currentDocId"
      :is-dirty="isDirty"
      :current-doc-name="getCurrentDocName()"
      :color-count="Object.keys(colors).length"
      @update:panel-width="sidePanelWidth = $event"
      @resize-start="onSideResizeStart"
      @resize-end="onSideResizeEnd"
      @update-settings="onSettingsUpdate"
      @recalc-auto="computeAutoCellSize"
      @new-timeline="doNewTimeline"
      @save-as-new="onSaveAsNew"
      @save="doSave"
      @load-timeline="doLoadTimeline"
      @delete-timeline="doDeleteTimeline"
    />

    <!-- Sync Preview Dialog -->
    <SyncPreviewDialog
      v-if="syncDialog"
      :key="`sync-${syncDialog.isPush ? 'push' : 'pull'}-${syncDialog.items?.length || 0}`"
      :is-push="syncDialog.isPush"
      :items="syncDialog.items"
      @cancel="syncDialog = null"
      @confirm="onSyncConfirm"
    />

    <!-- Identity Setup (首次使用霸屏) -->
    <IdentitySetup
      v-if="showIdentitySetup"
      @done="onIdentityDone"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import WeekGrid from './components/WeekGrid.vue'
import MonthGrid from './components/MonthGrid.vue'
import BrushToolbar from './components/BrushToolbar.vue'
import SidePanel from './components/SidePanel.vue'
import SyncPreviewDialog from './components/SyncPreviewDialog.vue'
import IdentitySetup from './components/IdentitySetup.vue'
import { loadColors, setColor, setColors, saveColors } from './utils/storage.js'
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './utils/settings.js'
import { themes, getTheme } from './utils/paletteStore.js'
import {
  loadTimelines,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  renameTimeline,
  getTimeline
} from './utils/timelineStore.js'
import { useI18n } from './locales/index.js'
import { isIdentitySet } from './utils/identity.js'
import {
  computeTimelineDiff,
  executeTimelinePush,
  executeTimelinePull
} from './utils/syncStore.js'

const { t, setLocale } = useI18n()

const today = new Date()
const currentYear = ref(today.getFullYear())
const scrollRef = ref(null)
const currentYearRef = ref(null)

// ── Side panel 真实挤压 ──
const sidePanelOpen = ref(false)
const sidePanelWidth = ref(25)
const isStoneMode = ref(false)
let stoneTimer = null

// ═══════════════════════════════════════════════════════════
//  石化效果调参区  — 改这里，不动下方逻辑
// ═══════════════════════════════════════════════════════════
const STONE = {
  blurRadius: 40,       // 高斯模糊半径 (px)，推荐 8~20
  darken: 0.3,          // 整体压暗 (0~1)，1=不压暗，0.5=暗一半，0.3=很暗
  fadeInMs: 200,         // 进入模糊时长 (ms)，推荐 80~150
  fadeOutMs: 400,       // 退出模糊时长 (ms)，推荐 120~300
  holdMs: 280,          // 模糊保持时长 (ms)，面板动画约 250ms
}
// ═══════════════════════════════════════════════════════════

// 侧边栏打开/关闭时，scroll-area 获得真实 margin-right
const sideMarginRight = computed(() =>
  sidePanelOpen.value ? sidePanelWidth.value + '%' : '0'
)

// 石化：高强度模糊遮盖过渡过程
function stone() {
  isStoneMode.value = true
}

// 解除石化
function unstone() {
  isStoneMode.value = false
}

// 面板打开/关闭 → 石化遮盖，holdMs 后解除
watch(sidePanelOpen, (open) => {
  if (stoneTimer) clearTimeout(stoneTimer)
  stone()
  stoneTimer = setTimeout(() => {
    unstone()
  }, STONE.holdMs)
})

// 拖拽开始 → 石化
function onSideResizeStart() {
  stone()
}

// 拖拽结束 → 解除石化
function onSideResizeEnd() {
  unstone()
}

// ── View mode ──
const viewMode = ref('year') // 'year' | 'month'

// ── Brush ──
const brushActive = ref(false)
const brushColor = ref(null) // null=清除(✕), 0-10=颜色索引
const overwriteMode = ref(true)

// ── Undo / Redo ──
const undoStack = ref([])   // 每项: { changes: [{ dateStr, prev, next }] }
const redoStack = ref([])
const MAX_UNDO = 100

function pushUndo(changes) {
  if (!changes || changes.length === 0) return
  undoStack.value.push({ changes })
  if (undoStack.value.length > MAX_UNDO) {
    undoStack.value.shift()
  }
  redoStack.value = []
}

function undo() {
  if (undoStack.value.length === 0) return
  const cmd = undoStack.value.pop()
  const updates = cmd.changes.map(c => ({
    dateStr: c.dateStr,
    colorIndices: c.prev
  }))
  colors.value = setColors(colors.value, updates)
  redoStack.value.push(cmd)
  isDirty.value = true
}

function redo() {
  if (redoStack.value.length === 0) return
  const cmd = redoStack.value.pop()
  const updates = cmd.changes.map(c => ({
    dateStr: c.dateStr,
    colorIndices: c.next
  }))
  colors.value = setColors(colors.value, updates)
  undoStack.value.push(cmd)
  isDirty.value = true
}

// ── Theme ──
const currentTheme = ref(0)
const themeColors = computed(() => getTheme(currentTheme.value).colors)

// ── Data ──
const colors = ref(loadColors())

// ── Settings ──
const settings = ref(loadSettings())

// 从设置初始化 viewMode
viewMode.value = settings.value.viewMode ?? 'year'

// 初始化主题
currentTheme.value = settings.value.currentTheme ?? 0

// 初始化语言
setLocale(settings.value.locale || 'zh')

const startYear = computed(() => settings.value.startYear)
const endYear = computed(() => settings.value.endYear)

const prevYears = computed(() => {
  const years = []
  for (let y = currentYear.value - 1; y >= startYear.value; y--) years.unshift(y)
  return years
})

const nextYears = computed(() => {
  const years = []
  for (let y = currentYear.value + 1; y <= endYear.value; y++) years.push(y)
  return years
})

const yearColorCount = computed(() => {
  const prefix = String(currentYear.value) + '-'
  return Object.keys(colors.value).filter(k => k.startsWith(prefix)).length
})

// ── View Mode toggle ──
function toggleViewMode() {
  viewMode.value = viewMode.value === 'year' ? 'month' : 'year'
  settings.value.viewMode = viewMode.value
  saveSettings(settings.value)
  nextTick(() => scrollToYear(currentYear.value, 'start'))
}

// ── Focus Mode ──
const focusMode = ref(false)
function toggleFocusMode() {
  focusMode.value = !focusMode.value
  if (focusMode.value) {
    nextTick(() => scrollToYear(currentYear.value, 'top-third'))
  }
}

function focusStyle(year) {
  if (year === currentYear.value) {
    return {
      transform: 'translateY(0)',
      opacity: 1,
      transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
    }
  }
  const offset = year < currentYear.value ? -120 : 120
  return {
    transform: `translateY(${offset}vh)`,
    opacity: 0.15,
    pointerEvents: 'none',
    transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
  }
}

// ── Grid auto-sizing (year view only) ──
const autoCellSize = ref(19)
const manualCellSize = computed(() => settings.value.cellSize)
const actualCellSize = computed(() => manualCellSize.value ?? autoCellSize.value)

function fitCells() {
  settings.value.cellSize = null
  saveSettings(settings.value)
  computeAutoCellSize()
}

function computeAutoCellSize() {
  if (!scrollRef.value) return
  const availWidth = scrollRef.value.clientWidth - 24

  // 第一阶段：尝试放 53 列（1 段，不折叠）
  for (let cs = 40; cs >= 8; cs--) {
    const gap = Math.max(2, Math.round(cs * 0.21))
    const labelW = Math.max(24, Math.round(cs * 1.58))
    const totalWidth = labelW + (cs + gap) * 53
    if (totalWidth <= availWidth) {
      autoCellSize.value = cs
      return
    }
  }

  // 第二阶段：放不下 53 列，用折叠模式
  for (let cs = 40; cs >= 8; cs--) {
    const gap = Math.max(2, Math.round(cs * 0.21))
    const labelW = Math.max(24, Math.round(cs * 1.58))
    const step = cs + gap
    const cols = Math.floor((availWidth - labelW) / step)
    if (cols >= 7) {
      autoCellSize.value = cs
      return
    }
  }
  autoCellSize.value = 8
}

// ── Navigation ──
function prevYear() {
  if (currentYear.value <= startYear.value) return
  currentYear.value--
  nextTick(() => scrollToYear(currentYear.value, 'start'))
}

function nextYear() {
  if (currentYear.value >= endYear.value) return
  currentYear.value++
  nextTick(() => scrollToYear(currentYear.value, 'start'))
}

function jumpToToday() {
  currentYear.value = today.getFullYear()
  nextTick(() => scrollToYear(currentYear.value, 'start'))
}

function scrollToYear(year, block = 'start') {
  if (!scrollRef.value) return
  const el = scrollRef.value.querySelector(`[data-year="${year}"]`)
  if (!el) return

  if (block === 'top-third') {
    const containerRect = scrollRef.value.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const currentScrollTop = scrollRef.value.scrollTop
    const targetY = currentScrollTop + elRect.top - containerRect.top - containerRect.height * 0.33
    scrollRef.value.scrollTo({ top: targetY, behavior: 'smooth' })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block })
  }
}

// ── Settings handler (from side panel) ──
function onSettingsUpdate(partial) {
  settings.value = { ...settings.value, ...partial }
  saveSettings(settings.value)

  if (partial.locale) {
    setLocale(partial.locale)
  }

  if (currentYear.value < startYear.value) currentYear.value = startYear.value
  if (currentYear.value > endYear.value) currentYear.value = endYear.value

  nextTick(computeAutoCellSize)
}

// ── Brush ──
function toggleBrush() {
  brushActive.value = !brushActive.value
}

function setBrushColor(color) {
  brushColor.value = color
}

// ── Theme ──
function onSetTheme(themeIndex) {
  currentTheme.value = themeIndex
  settings.value.currentTheme = themeIndex
  saveSettings(settings.value)
}

// ── Timeline (多时间表管理) ──
const timelines = ref(loadTimelines())

// 从 localStorage 恢复 currentDocId，确保刷新页面后关联不丢失
const savedId = localStorage.getItem('animei_current_doc_id')
const currentDocId = ref(savedId && getTimeline(savedId) ? savedId : null)
const isDirty = ref(false)      // 是否有未保存修改

// 如果画布有数据但没有关联存档 → 标记为未保存（防止刷新后丢失识别）
if (!currentDocId.value && Object.keys(colors.value).length > 0) {
  isDirty.value = true
}

// currentDocId 变化时自动持久化
watch(currentDocId, (id) => {
  if (id) localStorage.setItem('animei_current_doc_id', id)
  else localStorage.removeItem('animei_current_doc_id')
})

// 注意：isDirty 不在这里自动设为 true；改为在 onColorDate / onPaintBatch 中手动设置
// 可防止加载存档/新建时异步 watch 覆盖掉 isDirty = false

function getCurrentDocName() {
  if (!currentDocId.value) return '未命名时间表'
  const doc = getTimeline(currentDocId.value)
  return doc ? doc.name : '未命名时间表'
}

function refreshTimelines() {
  timelines.value = loadTimelines()
}

// 新建时间表（清空画布）
function doNewTimeline() {
  colors.value = {}
  saveColors(colors.value)
  currentDocId.value = null
  isDirty.value = false
  undoStack.value = []
  redoStack.value = []
  refreshTimelines()
}

// 从当前新建存档
function doSaveAsNew(name) {
  const doc = createTimeline(name, colors.value)
  currentDocId.value = doc.id
  isDirty.value = false
  refreshTimelines()
  return doc
}

// 保存到当前关联存档（无关联时自动转为"从当前新建"）
function doSave() {
  if (!currentDocId.value) {
    const name = prompt('请输入时间表名称：', '我的时间表')
    if (!name || !name.trim()) return false
    const doc = createTimeline(name.trim(), colors.value)
    currentDocId.value = doc.id
  } else {
    updateTimeline(currentDocId.value, colors.value)
  }
  isDirty.value = false
  refreshTimelines()
  return true
}

// 加载存档
function doLoadTimeline(id) {
  const doc = getTimeline(id)
  if (!doc) return
  colors.value = { ...doc.colors }
  saveColors(colors.value)
  currentDocId.value = doc.id
  isDirty.value = false
  undoStack.value = []
  redoStack.value = []
}

// 删除存档
function doDeleteTimeline(id) {
  const isCurrent = id === currentDocId.value
  deleteTimeline(id)
  refreshTimelines()
  if (isCurrent) {
    currentDocId.value = null
    isDirty.value = true   // 画布保留但解除关联 → 标记未保存
  }
}

// ── 侧边栏时间表操作事件 ──
function onNewTimeline()       { doNewTimeline() }
function onSaveAsNew(name)     { doSaveAsNew(name) }
function onSave()              { doSave() }
function onLoadTimeline(id)    { doLoadTimeline(id) }
function onDeleteTimeline(id)  { doDeleteTimeline(id) }

// ── Color events ──
function onSelectDate({ dateStr }) {
  // Click handling reserved for future use
}

function onColorDate(dateStr, colorIndices) {
  colors.value = setColor(colors.value, dateStr, colorIndices)
  isDirty.value = true  // 用户实际涂色 → 标记未保存
}

function onPaintBatch(batch) {
  if (!batch || batch.length === 0) return
  pushUndo(batch)
  isDirty.value = true  // 用户实际涂色 → 标记未保存
}

// ── Keyboard shortcuts ──
function onKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return

  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
    return
  }
  if ((e.ctrlKey && e.key === 'z' && e.shiftKey) || (e.ctrlKey && e.key === 'y')) {
    e.preventDefault()
    redo()
    return
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    doSave()
    return
  }

  if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
    toggleBrush()
    return
  }

  if (brushActive.value && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
    const colorMap = {
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
      '6': 5, '7': 6, '8': 7, '9': 8, '0': 9,
      '-': 10, '=': null
    }
    const idx = colorMap[e.key]
    if (idx !== undefined) {
      e.preventDefault()
      setBrushColor(idx)
      return
    }
  }
}

// ── Identity Setup ──
const showIdentitySetup = ref(!isIdentitySet())

function onIdentityDone() {
  showIdentitySetup.value = false
}

// ── Sync (云端同步) ──
const syncDialog = ref(null)
const syncLoading = ref(false)

/**
 * 发起同步预览
 * @param {'push'|'pull'} direction
 */
async function startSync(direction) {
  if (!currentDocId.value) {
    alert(t('sync.needDoc'))
    return
  }
  syncLoading.value = true
  try {
    const result = await computeTimelineDiff(currentDocId.value, direction)
    syncDialog.value = {
      direction,
      ...result
    }
  } catch (e) {
    alert(e.message || t('sync.networkError'))
  } finally {
    syncLoading.value = false
  }
}

/**
 * 用户确认同步（由 SyncPreviewDialog emit 触发）
 * @param {Array} selected 用户勾选的要同步的条目列表
 */
async function onSyncConfirm(selected) {
  if (!currentDocId.value || !syncDialog.value) return
  syncLoading.value = true
  try {
    if (syncDialog.value.isPush) {
      await executeTimelinePush(currentDocId.value, selected)
    } else {
      const updated = await executeTimelinePull(currentDocId.value, selected)
      // 将拉取结果应用到画布
      if (updated && updated.colors) {
        colors.value = { ...updated.colors }
        saveColors(colors.value)
      }
    }
    // 刷新本地时间表列表
    refreshTimelines()
    // 关闭弹窗
    syncDialog.value = null
    isDirty.value = false
  } catch (e) {
    alert(e.message || t('sync.networkError'))
  } finally {
    syncLoading.value = false
  }
}

// 将同步相关方法暴露给 SidePanel
function getSyncMethods() {
  return { startSync, syncLoading }
}

// ── Lifecycle ──
onMounted(() => {
  if (currentYear.value < startYear.value) currentYear.value = startYear.value
  if (currentYear.value > endYear.value) currentYear.value = endYear.value

  if (window.innerHeight > window.innerWidth) {
    viewMode.value = 'month'
    settings.value.viewMode = 'month'
    saveSettings(settings.value)
  }

  computeAutoCellSize()

  nextTick(() => {
    if (currentYearRef.value) {
      currentYearRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })

  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (stoneTimer) clearTimeout(stoneTimer)
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html { font-size: 16px; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
  background: #0d1117;
  color: rgba(255, 255, 255, 0.85);
  min-height: 100vh;
  overflow-x: hidden;
}
::-webkit-scrollbar { width: 8px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(13, 17, 23, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.logo {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #3498db, #9b59b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  display: none;
}

.bar-center {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.current-year {
  font-size: 17px;
  font-weight: 700;
  min-width: 54px;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

.bar-views {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.brush-wrap {
  flex-shrink: 0;
}

.bar-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.55);
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.bar-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
}

.bar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.today-btn {
  font-size: 11px;
  padding: 4px 8px;
}

.focus-btn {
  font-size: 11px;
  padding: 4px 8px;
}

.focus-btn.active {
  background: rgba(155, 89, 182, 0.15);
  border-color: rgba(155, 89, 182, 0.4);
  color: #9b59b6;
}

.viewmode-btn {
  font-size: 11px;
  padding: 4px 8px;
}

.viewmode-btn.active {
  background: rgba(52, 152, 219, 0.15);
  border-color: rgba(52, 152, 219, 0.4);
  color: #3498db;
}

.panel-btn {
  font-size: 14px;
  padding: 4px 8px;
}

.panel-btn.active {
  background: rgba(52, 152, 219, 0.15);
  border-color: rgba(52, 152, 219, 0.4);
  color: #3498db;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 20px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  min-height: 26px;
}

.status-hint {
  color: rgba(255, 255, 255, 0.45);
}

.record-count {
  color: rgba(255, 255, 255, 0.25);
}

.scroll-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: auto;
  transition: margin-right 0.25s ease, filter var(--stone-fo-ms, 120ms) ease;
  will-change: margin-right, filter;
}

/* 石化 = brightness(压暗) + blur(高斯模糊) */
.scroll-area.stoned {
  filter: brightness(var(--stone-darken, 0.5)) blur(var(--stone-blur, 15px));
  transition: margin-right 0.25s ease, filter var(--stone-fi-ms, 80ms) ease;
}

.year-block {
  margin-bottom: 72px;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease;
}

.year-focus {
  border-left: 2px solid rgba(155, 89, 182, 0.5);
  padding-left: 16px;
  border-radius: 4px;
}

/* View mode transition */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.mode-fade-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.mode-fade-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>
