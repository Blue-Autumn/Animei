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

        <!-- Tab 2: 快捷 -->
        <div v-else key="tab-2" class="tab-pane">
          <div class="pane-scroll">
            <h3 class="pane-title">{{ tabs[2].label }}</h3>
            <div class="quick-actions">
              <button class="pane-btn wide">导出数据</button>
              <button class="pane-btn wide">导入数据</button>
              <button class="pane-btn wide">重置所有颜色</button>
            </div>
            <div class="toggle-row">
              <span class="toggle-label">Demo 开关</span>
              <span class="toggle-switch">◉</span>
            </div>
            <div class="placeholder-text">
              <p>快捷操作面板 Demo。</p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  panelWidth: { type: Number, default: 50 }
})

const emit = defineEmits(['update:open', 'update:panel-width', 'resize-start', 'resize-end'])

const tabs = [
  { label: '🔍 搜索' },
  { label: '📊 统计' },
  { label: '⚡ 快捷' }
]

const activeTab = ref(0)

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
  // 鼠标右移(dx>0) → 面板左边缘右移 → 面板变窄 → 减
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
</script>

<style scoped>
.side-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 99;
  width: var(--panel-w, 50%);
  background: rgba(22, 27, 34, 0.97);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  will-change: transform;
  padding-top: 56px; /* 留出顶部工具栏空间 */
}

.side-panel.open {
  transform: translateX(0);
}

/* ── Resize handle ── */
.resize-handle {
  position: absolute;
  left: -4px;
  top: 56px; /* 从工具栏下方开始 */
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

/* ── Quick tab ── */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.toggle-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.toggle-switch {
  font-size: 18px;
  color: #3498db;
  cursor: pointer;
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
