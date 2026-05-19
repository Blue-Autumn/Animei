<template>
  <div
    class="side-panel"
    :class="{ open }"
    :style="{ '--panel-w': panelWidth + '%' }"
  >
    <!-- Resize handle (draggable left border) -->
    <div
      class="resize-handle"
      @mousedown.prevent="onResizeStart"
    >
      <div class="handle-line"></div>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <button
        v-for="(tab, i) in tabs"
        :key="i"
        class="tab-btn"
        :class="{ active: activeTab === i }"
        @click="activeTab = i"
      >{{ tab.label }}</button>
    </div>

    <!-- Tab panes with transition -->
    <div class="tab-panes">
      <Transition name="mode-fade" mode="out-in">
        <!-- Tab 0: 搜索 -->
        <div v-if="activeTab === 0" key="tab-0" class="tab-pane">
          <div class="pane-scroll">
            <h3 class="pane-title">{{ tabs[0].label }}</h3>
            <div class="search-row">
              <input class="search-input" type="text" placeholder="搜索电影..." />
              <button class="pane-btn">🔍</button>
            </div>
            <div class="placeholder-text">
              <p>输入关键词搜索已记录的电影。</p>
              <p>Demo 功能 — 待实现。</p>
            </div>
          </div>
        </div>

        <!-- Tab 1: 统计 -->
        <div v-else-if="activeTab === 1" key="tab-1" class="tab-pane">
          <div class="pane-scroll">
            <h3 class="pane-title">{{ tabs[1].label }}</h3>
            <div class="stat-grid">
              <div class="stat-card">
                <span class="stat-value">—</span>
                <span class="stat-label">本年记录</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">—</span>
                <span class="stat-label">连续天数</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">—</span>
                <span class="stat-label">最多颜色</span>
              </div>
              <div class="stat-card">
                <span class="stat-value">—</span>
                <span class="stat-label">总计天数</span>
              </div>
            </div>
            <div class="placeholder-text">
              <p>统计数据在此展示。</p>
            </div>
          </div>
        </div>

        <!-- Tab 2: 时间表 -->
        <div v-else-if="activeTab === 2" key="tab-2" class="tab-pane">
          <div class="pane-scroll">
            <h3 class="pane-title">{{ tabs[2].label }}</h3>

            <!-- 信息区域 -->
            <div class="timeline-info">
              <div class="info-row">
                <span class="info-label">名称</span>
                <span class="info-value tl-name">{{ currentDocName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">上色天数</span>
                <span class="info-value">{{ colorCount }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">状态</span>
                <span
                  class="info-value tl-status"
                  :class="{ dirty: isDirty }"
                >{{ isDirty ? '⚠️ 未保存' : '✅ 已保存' }}</span>
              </div>
              <template v-if="currentDocId">
                <div class="info-row">
                  <span class="info-label">已关联存档</span>
                  <span class="info-value tl-id">✔</span>
                </div>
              </template>
              <template v-else>
                <div class="info-row">
                  <span class="info-label">关联存档</span>
                  <span class="info-value tl-id dim">—</span>
                </div>
              </template>
            </div>

            <!-- 按钮组 -->
            <div class="tl-actions">
              <button class="pane-btn wide tl-btn" @click="onNew">新建</button>
              <button class="pane-btn wide tl-btn" @click="onSaveAsNew">从当前新建</button>
              <button class="pane-btn wide tl-btn" :class="{ disabled: !currentDocId }" @click="onSave">
                {{ currentDocId ? '保存当前 (Ctrl+S)' : '保存当前' }}
              </button>
            </div>

            <!-- 存档列表 -->
            <div class="tl-section-title">存档列表</div>
            <div v-if="localTimelines.length === 0" class="tl-empty">
              暂无存档
            </div>
            <div
              v-for="tl in localTimelines"
              :key="tl.id"
              class="tl-item"
              :class="{ active: tl.id === currentDocId }"
              @click="onLoad(tl.id)"
            >
              <div class="tl-item-left">
                <div class="tl-item-name">{{ tl.name }}</div>
                <div class="tl-item-meta">
                  {{ countTimelineColors(tl) }}天
                  <template v-if="tl.createdAt">
                    · {{ formatDateShort(tl.createdAt) }}
                  </template>
                </div>
              </div>
              <button
                class="tl-item-del"
                @click.stop="onDelete(tl.id)"
                title="删除"
              >✕</button>
            </div>
          </div>
        </div>

        <!-- Tab 3: 设置 -->
        <div v-else-if="activeTab === 3" key="tab-3" class="tab-pane">
          <div class="pane-scroll">
            <h3 class="pane-title">{{ t('settings.title') }}</h3>

            <!-- 语言 / Language -->
            <div class="setting-row">
              <label class="setting-label">{{ t('settings.language') }}</label>
              <div class="setting-control">
                <select
                  class="lang-dropdown"
                  :value="localSettings.locale"
                  @change="onLangChange"
                >
                  <option
                    v-for="(name, locale) in localeNames"
                    :key="locale"
                    :value="locale"
                  >{{ name }}</option>
                </select>
              </div>
            </div>

            <!-- 格子大小 -->
            <div class="setting-row">
              <label class="setting-label">{{ t('settings.cellSize') }}</label>
              <div class="setting-control">
                <button class="step-btn" @click="adjust('cellSize', -1)" :disabled="cellSizeVal <= 8">−</button>
                <span class="setting-value">{{ cellSizeVal ? cellSizeVal : t('settings.auto') }}</span>
                <button class="step-btn" @click="adjust('cellSize', 1)" :disabled="cellSizeVal !== null && cellSizeVal >= 40">+</button>
                <button class="reset-btn" @click="onAutoClick">↔</button>
              </div>
            </div>

            <!-- 起始年份 -->
            <div class="setting-row">
              <label class="setting-label">{{ t('settings.startYear') }}</label>
              <div class="setting-control">
                <button class="step-btn" @click="adjustYear('start', -1)">−</button>
                <input
                  class="setting-input"
                  type="text"
                  inputmode="numeric"
                  :value="localSettings.startYear"
                  @input="onStartYearInput"
                  @blur="validateStartYear"
                />
                <button class="step-btn" @click="adjustYear('start', 1)">+</button>
              </div>
            </div>

            <!-- 结束年份 -->
            <div class="setting-row">
              <label class="setting-label">{{ t('settings.endYear') }}</label>
              <div class="setting-control">
                <button class="step-btn" @click="adjustYear('end', -1)">−</button>
                <input
                  class="setting-input"
                  type="text"
                  inputmode="numeric"
                  :value="localSettings.endYear"
                  @input="onEndYearInput"
                  @blur="validateEndYear"
                />
                <button class="step-btn" @click="adjustYear('end', 1)">+</button>
              </div>
            </div>

            <!-- 快捷键提示 -->
            <div class="shortcuts-hint">{{ t('settings.shortcuts') }}</div>
          </div>
        </div>

        <!-- Tab 4: 调色板 -->
        <div v-else key="tab-4" class="tab-pane">
          <div class="pane-scroll">
            <h3 class="pane-title">🎨 调色板</h3>

            <!-- 同步按钮组 -->
            <div class="sync-bar">
              <button class="pane-btn sync-btn" @click="pushToServer" title="将本地调色板推送到服务器">
                <span>⬆</span>
                <span>推送</span>
              </button>
              <button class="pane-btn sync-btn" @click="pullFromServer" title="从服务器拉取调色板覆盖本地">
                <span>⬇</span>
                <span>拉取</span>
              </button>
              <span v-if="syncMsg" class="sync-msg">{{ syncMsg }}</span>
            </div>

            <p v-if="!editingColor" class="hsl-placeholder">点击下方色盘中的色块编辑颜色</p>

            <!-- 16 个色盘列表 -->
            <div
              v-for="(theme, tIdx) in themes"
              :key="tIdx"
              class="palette-card"
              :class="{ editing: editingThemeIdx === tIdx }"
            >
              <!-- 色盘名称 (可点击重命名) + 关闭按钮 -->
              <div class="palette-header">
                <div
                  class="palette-name"
                  :class="{ editing: editingNameIdx === tIdx }"
                  @click="startRename(tIdx)"
                >
                  <input
                    v-if="editingNameIdx === tIdx"
                    class="name-input"
                    v-focus
                    :value="theme.name"
                    @blur="finishRename(tIdx, $event)"
                    @keydown.enter="$event.target.blur()"
                    @keydown.escape="editingNameIdx = -1"
                  />
                  <span v-else>{{ theme.name }}</span>
                </div>
                <!-- 关闭按钮：此调色盘正在编辑时显示 -->
                <button
                  v-if="editingThemeIdx === tIdx"
                  class="card-close-btn"
                  @click="closePicker"
                  title="关闭拾色器"
                >✕</button>
              </div>

              <!-- HSL 拾色器：仅在此调色盘被选中编辑时显示 -->
              <HslPicker
                v-if="editingThemeIdx === tIdx && editingColor"
                v-model="editingColor"
                @update:model-value="onPickerChange"
              />

              <!-- 11 个色块 -->
              <div class="palette-colors">
                <button
                  v-for="(c, cIdx) in theme.colors"
                  :key="cIdx"
                  class="palette-swatch"
                  :style="{ background: c }"
                  @click="selectSwatch(tIdx, cIdx)"
                ></button>
                <!-- 第12号 = 橡皮擦(✕) -->
                <button
                  class="palette-swatch eraser-swatch"
                  @click="selectSwatch(tIdx, -1)"
                >✕</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Confirm Dialog (teleported) -->
    <ConfirmDialog
      v-if="dialogState"
      :title="dialogState.title"
      :message="dialogState.message"
      :buttons="dialogState.buttons"
      @cancel="dialogState = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useI18n } from '../locales/index.js'
import HslPicker from './HslPicker.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { themes, updateColor, renameTheme } from '../utils/paletteStore.js'
import { loadTimelines, deleteTimeline } from '../utils/timelineStore.js'

const { t, setLocale, localeNames } = useI18n()

const props = defineProps({
  open: { type: Boolean, default: false },
  panelWidth: { type: Number, default: 50 },
  settings: { type: Object, required: true },
  timelines: { type: Array, default: () => [] },
  currentDocId: { type: [String, null], default: null },
  isDirty: { type: Boolean, default: false },
  currentDocName: { type: String, default: '' },
  colorCount: { type: Number, default: 0 }
})

const emit = defineEmits([
  'update:open',
  'update:panel-width',
  'resize-start',
  'resize-end',
  'update-settings',
  'recalc-auto',
  'new-timeline',
  'save-as-new',
  'save',
  'load-timeline',
  'delete-timeline'
])

const tabs = [
  { label: '🔍 搜索' },
  { label: '📊 统计' },
  { label: '📄 时间表' },
  { label: '⚙ 设置' },
  { label: '🎨 调色板' }
]

const activeTab = ref(0)

// ── Local copy of settings for reactive editing ──
const localSettings = reactive({
  locale: 'zh',
  startYear: 2024,
  endYear: 2026
})

// Sync from props
watch(() => props.settings, (s) => {
  localSettings.locale = s.locale || 'zh'
  localSettings.startYear = s.startYear
  localSettings.endYear = s.endYear
}, { immediate: true })
watch(activeTab, () => { /* resync on tab switch for safety */ })

// ── Helpers ──
const cellSizeVal = ref(null)
watch(() => props.settings.cellSize, (v) => { cellSizeVal.value = v }, { immediate: true })

function emitSettings(partial) {
  emit('update-settings', partial)
}

// ── Language ──
function onLangChange(e) {
  const val = e.target.value
  localSettings.locale = val
  setLocale(val)
  emitSettings({ locale: val })
}

// ── Cell size ──
function adjust(key, delta) {
  const cur = cellSizeVal.value ?? 19
  const next = Math.max(8, Math.min(40, cur + delta))
  cellSizeVal.value = next
  emitSettings({ cellSize: next })
}

function onAutoClick() {
  cellSizeVal.value = null
  emitSettings({ cellSize: null })
  emit('recalc-auto')
}

// ── Year helpers ──
function adjustYear(which, delta) {
  const cur = localSettings[which === 'start' ? 'startYear' : 'endYear']
  const next = Math.max(1900, Math.min(2100, cur + delta))
  if (which === 'start') {
    localSettings.startYear = next
    emitSettings({ startYear: next })
  } else {
    localSettings.endYear = next
    emitSettings({ endYear: next })
  }
}

function filterYearInput(value) {
  return value.replace(/\D/g, '')
}

function onStartYearInput(e) {
  const raw = filterYearInput(e.target.value)
  const num = parseInt(raw, 10)
  if (raw === '' || isNaN(num)) {
    e.target.value = ''
    localSettings.startYear = ''
    return
  }
  localSettings.startYear = num
  e.target.value = num
}

function validateStartYear() {
  let v = localSettings.startYear
  if (v === '' || isNaN(v) || v < 1900) v = 1900
  if (v > 2100) v = 2100
  if (v > localSettings.endYear) v = localSettings.endYear
  localSettings.startYear = v
  emitSettings({ startYear: v })
}

function onEndYearInput(e) {
  const raw = filterYearInput(e.target.value)
  const num = parseInt(raw, 10)
  if (raw === '' || isNaN(num)) {
    e.target.value = ''
    localSettings.endYear = ''
    return
  }
  localSettings.endYear = num
  e.target.value = num
}

function validateEndYear() {
  let v = localSettings.endYear
  if (v === '' || isNaN(v) || v > 2100) v = 2100
  if (v < 1900) v = 1900
  if (v < localSettings.startYear) v = localSettings.startYear
  localSettings.endYear = v
  emitSettings({ endYear: v })
}

// ── Timeline tab ──
const localTimelines = ref([])
watch(() => props.timelines, (list) => {
  localTimelines.value = list
}, { immediate: true, deep: true })

// Dialog state
const dialogState = ref(null) // null | { title, message, buttons }

function countTimelineColors(tl) {
  if (!tl || !tl.colors) return 0
  return Object.keys(tl.colors).length
}

function formatDateShort(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + mo + '-' + dd
}

// 新建：如果未保存且有ID → 弹窗
function onNew() {
  if (props.isDirty && props.currentDocId) {
    showSaveDiscardCancel(
      () => { emit('save'); doNewAfterConfirm() },   // 先保存
      () => doNewAfterConfirm(),                       // 不保存
      () => {}                                          // 取消
    )
  } else {
    doNewAfterConfirm()
  }
}

function doNewAfterConfirm() {
  emit('new-timeline')
}

// 从当前新建：直接 emit
function onSaveAsNew() {
  // prompt for name
  const name = prompt('请输入时间表名称：', '我的时间表')
  if (!name || !name.trim()) return
  emit('save-as-new', name.trim())
}

// 保存
function onSave() {
  if (!props.currentDocId) {
    alert('当前未关联存档，请使用"从当前新建"创建存档')
    return
  }
  emit('save')
}

// 加载存档
function onLoad(tlId) {
  if (tlId === props.currentDocId) return  // 已经是同一个
  if (props.isDirty) {
    showSaveDiscardCancel(
      () => { emit('save'); doLoadAfterConfirm(tlId) },
      () => doLoadAfterConfirm(tlId),
      () => {}
    )
  } else {
    doLoadAfterConfirm(tlId)
  }
}

function doLoadAfterConfirm(tlId) {
  emit('load-timeline', tlId)
}

// 删除存档
function onDelete(tlId) {
  dialogState.value = {
    title: '删除存档',
    message: '确定要删除这个存档吗？此操作不可恢复。',
    buttons: [
      {
        label: '取消',
        class: '',
        action: () => { dialogState.value = null }
      },
      {
        label: '删除',
        class: 'danger',
        action: () => {
          emit('delete-timeline', tlId)
          dialogState.value = null
        }
      }
    ]
  }
}

// 通用「保存/不保存/取消」弹窗
function showSaveDiscardCancel(onSave, onDiscard, onCancel) {
  dialogState.value = {
    title: '未保存的修改',
    message: '当前时间表有未保存的修改。',
    buttons: [
      {
        label: '取消',
        class: '',
        action: () => { dialogState.value = null; onCancel() }
      },
      {
        label: '不保存',
        class: '',
        action: () => { dialogState.value = null; onDiscard() }
      },
      {
        label: '保存',
        class: 'primary',
        action: () => { dialogState.value = null; onSave() }
      }
    ]
  }
}

// ── Drag resize ──
let resizeStartX = 0
let resizeStartPct = 0

function onResizeStart(e) {
  emit('resize-start')
  resizeStartX = e.clientX
  resizeStartPct = props.panelWidth
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

function onResizeMove(e) {
  const dx = e.clientX - resizeStartX
  const vw = window.innerWidth
  let pct = resizeStartPct - (dx / vw) * 100
  pct = Math.max(25, Math.min(75, pct))
  emit('update:panel-width', pct)
}

function onResizeEnd() {
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  emit('resize-end')
}

// ── Palette editing ──
const editingColor = ref(null)     // hex string for the picker, null = no picker
const editingThemeIdx = ref(-1)    // which theme is being edited
const editingColorIdx = ref(-1)    // which color index in that theme
const editingNameIdx = ref(-1)     // which theme name is being renamed
const syncMsg = ref('')

function selectSwatch(tIdx, cIdx) {
  if (cIdx === -1) {
    // 橡皮擦 — 不用编辑
    editingColor.value = null
    editingThemeIdx.value = -1
    editingColorIdx.value = -1
    return
  }
  const theme = themes.value[tIdx]
  if (!theme) return
  editingThemeIdx.value = tIdx
  editingColorIdx.value = cIdx
  editingColor.value = theme.colors[cIdx]
}

function onPickerChange(hex) {
  if (editingThemeIdx.value >= 0 && editingColorIdx.value >= 0) {
    updateColor(editingThemeIdx.value, editingColorIdx.value, hex)
  }
}

function closePicker() {
  editingColor.value = null
  editingThemeIdx.value = -1
  editingColorIdx.value = -1
}

function startRename(tIdx) {
  editingNameIdx.value = tIdx
}

function finishRename(tIdx, e) {
  const val = e.target.value.trim()
  if (val) {
    renameTheme(tIdx, val)
  }
  editingNameIdx.value = -1
}

async function pushToServer() {
  try {
    const res = await fetch('/api/palettes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themes: themes.value })
    })
    if (res.ok) {
      syncMsg.value = '✅ 推送成功'
    } else {
      syncMsg.value = '❌ 推送失败 (' + res.status + ')'
    }
  } catch (e) {
    syncMsg.value = '❌ 无法连接服务器'
  }
  setTimeout(() => { syncMsg.value = '' }, 3000)
}

async function pullFromServer() {
  try {
    const res = await fetch('/api/palettes')
    if (!res.ok) {
      syncMsg.value = '❌ 拉取失败 (' + res.status + ')'
      setTimeout(() => { syncMsg.value = '' }, 3000)
      return
    }
    const data = await res.json()
    if (data.themes && data.themes.length > 0) {
      // 覆盖本地 themes
      themes.value = data.themes
      // 同时保存到 localStorage
      localStorage.setItem('animei_palettes', JSON.stringify(data.themes))
      syncMsg.value = '✅ 拉取成功，已覆盖本地'
    } else {
      syncMsg.value = '⚠️ 服务器暂无调色板数据'
    }
  } catch (e) {
    syncMsg.value = '❌ 无法连接服务器'
  }
  setTimeout(() => { syncMsg.value = '' }, 3000)
}

// ── Custom directive: v-focus ──
const vFocus = {
  mounted(el) {
    el.focus()
    el.select()
  }
}
</script>

<style scoped>
.side-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 300; /* 高于顶栏 100 */
  width: var(--panel-w, 50%);
  background: rgba(22, 27, 34, 0.97);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  will-change: transform;
}

.side-panel.open {
  transform: translateX(0);
}

/* ── Resize handle ── */
.resize-handle {
  position: absolute;
  left: -4px;
  top: 0; /* 从最顶部开始，覆盖整个高度 */
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handle-line {
  width: 2px;
  height: 40px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1px;
  transition: background 0.15s, height 0.15s;
}

.resize-handle:hover .handle-line {
  background: rgba(255, 255, 255, 0.2);
  height: 60px;
}

/* ── Tab bar ── */
.tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 10px 6px;
  font-size: 12px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  white-space: nowrap;
}

.tab-btn:hover {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: #3498db;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #3498db;
  border-radius: 1px 1px 0 0;
}

/* ── Tab panes ── */
.tab-panes {
  flex: 1;
  min-height: 0;
  position: relative;
}

.tab-pane {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.pane-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.pane-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
}

/* ── Search tab ── */
.search-row {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  outline: none;
}

.search-input:focus {
  border-color: #3498db;
}

/* ── Stats tab ── */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

/* ── Timeline tab ── */
.timeline-info {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.info-label {
  color: rgba(255, 255, 255, 0.4);
}

.info-value {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
}

.info-value.tl-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-value.tl-status.dirty {
  color: #ffa500;
}

.info-value.tl-id.dim {
  color: rgba(255, 255, 255, 0.25);
}

.tl-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.tl-btn {
  padding: 7px 12px;
  font-size: 12px;
}

.tl-btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}

.tl-section-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tl-empty {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  padding: 20px 0;
}

.tl-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid transparent;
}

.tl-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.tl-item.active {
  background: rgba(52, 152, 219, 0.08);
  border-color: rgba(52, 152, 219, 0.2);
}

.tl-item-left {
  flex: 1;
  min-width: 0;
}

.tl-item-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-item-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 2px;
}

.tl-item-del {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.15);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.12s;
  flex-shrink: 0;
}

.tl-item:hover .tl-item-del {
  opacity: 1;
}

.tl-item-del:hover {
  background: rgba(255, 80, 80, 0.15);
  color: #ff5555;
}

/* ── Settings tab ── */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.setting-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  flex-shrink: 0;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 5px;
}

.lang-dropdown {
  padding: 4px 8px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  outline: none;
  min-width: 90px;
}

.lang-dropdown:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.lang-dropdown option {
  background: #161b22;
  color: rgba(255, 255, 255, 0.85);
}

.setting-value {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.setting-input {
  width: 60px;
  padding: 3px 6px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  outline: none;
  font-variant-numeric: tabular-nums;
}

.setting-input:focus {
  border-color: #3498db;
}

.step-btn {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.step-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.step-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.reset-btn {
  padding: 3px 6px;
  font-size: 10px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.shortcuts-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  padding-top: 8px;
  line-height: 1.5;
  user-select: none;
}

/* ── Shared ── */
.pane-btn {
  padding: 8px 16px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s;
}

.pane-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
}

.pane-btn.wide {
  width: 100%;
}

.placeholder-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  line-height: 1.7;
}

.placeholder-text p {
  margin-bottom: 4px;
}

/* ── Palette tab ── */
.hsl-placeholder {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.08);
}

.sync-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 8px;
}

.sync-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 5px 12px;
}

.sync-msg {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.palette-card {
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.palette-card.editing {
  border-color: #3498db;
  box-shadow: 0 0 0 1px rgba(52, 152, 219, 0.2);
}

.palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-close-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.card-close-btn:hover {
  background: rgba(255, 80, 80, 0.2);
  border-color: rgba(255, 80, 80, 0.4);
  color: #ff5555;
}

.palette-name {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.15s;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.palette-name:hover {
  background: rgba(255, 255, 255, 0.04);
}

.palette-name.editing {
  cursor: text;
}

.name-input {
  width: 100%;
  padding: 3px 6px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid #3498db;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.85);
  outline: none;
}

.palette-colors {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.palette-swatch {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.12s, border-color 0.12s;
  flex-shrink: 0;
}

.palette-swatch:hover {
  transform: scale(1.25);
  border-color: rgba(255, 255, 255, 0.3);
}

.eraser-swatch {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eraser-swatch:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.7);
}

/* ── Reuse mode-fade transition ── */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.mode-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.mode-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
