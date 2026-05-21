<template>
  <Teleport to="body">
    <div class="dialog-overlay" @mousedown.self="$emit('cancel')">
      <div class="dialog-box sync-dialog">
        <!-- 标题 -->
        <div class="dialog-title">
          {{ isPush ? '确认推送到云端' : '从云端拉取时间表' }}
        </div>

        <!-- 列表 -->
        <div class="sync-list">
          <div
            v-for="(item, i) in items"
            :key="item.tl.id"
            class="sync-row"
            :class="{ toggleable: item.action !== 'unchanged' }"
          >
            <!-- 勾选框 -->
            <label
              class="sync-check"
              :class="{ disabled: item.action === 'unchanged' }"
            >
              <input
                type="checkbox"
                :checked="checkedSet.has(item.tl.id)"
                :disabled="item.action === 'unchanged'"
                @change="onToggle(item.tl.id)"
              />
            </label>

            <!-- 信息区 -->
            <div class="sync-info" @click="item.action !== 'unchanged' && onToggle(item.tl.id)">
              <div class="sync-info-top">
                <span class="sync-name">{{ item.tl.name }}</span>
                <span class="sync-badge" :class="item.action">
                  {{ actionLabel(item.action) }}
                </span>
              </div>

              <!-- 冲突警告 (push/pull 通用，state === 'conflict') -->
              <div v-if="item.state === 'conflict'" class="conflict-warning">
                ⚠️ 冲突：本地与云端各自独立修改，覆盖将丢失对方更改
              </div>

              <!-- 日期差异详情（update 且 colorDiff 存在时显示，push/pull 通用） -->
              <template v-if="item.action === 'update' && item.colorDiff">
                <div class="diff-summary" @click.stop="toggleExpand(i)">
                  <span v-if="item.colorDiff.added.length">+{{ item.colorDiff.added.length }} 新增</span>
                  <span v-if="item.colorDiff.modified.length">~{{ item.colorDiff.modified.length }} 修改</span>
                  <span v-if="item.colorDiff.removed.length">-{{ item.colorDiff.removed.length }} 删除</span>
                  <span class="diff-expand-hint">
                    {{ expandedSet.has(i) ? '收起 ▲' : '展开查看 ▼' }}
                  </span>
                </div>
                <!-- 展开具体日期 -->
                <div v-if="expandedSet.has(i)" class="diff-detail">
                  <!-- 推送方向：added=云端有本地无 → 推送后云端这些日期被本地覆盖 → 将从云端移除 -->
                  <!-- 拉取方向：added=云端有本地无 → 拉取后本地新增这些日期 → 新增日期 -->
                  <div v-if="item.colorDiff.added.length" class="diff-section">
                    <div class="diff-label del">{{ isPush ? '将从云端移除' : '新增日期' }} ({{ item.colorDiff.added.length }})</div>
                    <div class="diff-dates">
                      <span v-for="d in item.colorDiff.added" :key="'a'+d" class="diff-tag del">{{ isPush ? '−' : '+' }} {{ d }}</span>
                    </div>
                  </div>
                  <div v-if="item.colorDiff.modified.length" class="diff-section">
                    <div class="diff-label mod">{{ isPush ? '将修改云端' : '修改日期' }} ({{ item.colorDiff.modified.length }})</div>
                    <div class="diff-dates">
                      <span v-for="d in item.colorDiff.modified" :key="'m'+d" class="diff-tag mod">~ {{ d }}</span>
                    </div>
                  </div>
                  <!-- 推送方向：removed=本地有云端无 → 推送后云端新增这些日期 → 将新增至云端 -->
                  <!-- 拉取方向：removed=本地有云端无 → 拉取后本地删除这些日期 → 将删除日期 -->
                  <div v-if="item.colorDiff.removed.length" class="diff-section">
                    <div class="diff-label add">{{ isPush ? '将新增至云端' : '将删除日期' }} ({{ item.colorDiff.removed.length }})</div>
                    <div class="diff-dates">
                      <span v-for="d in item.colorDiff.removed" :key="'r'+d" class="diff-tag add">{{ isPush ? '+' : '−' }} {{ d }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 新建时显示日期数量 (push/pull 通用) -->
              <template v-if="item.action === 'create'">
                <div class="diff-summary">
                  <span>{{ colorCount(item.tl.colors) }} 个日期将{{ isPush ? '上传到云端' : '添加到本地' }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="items.length === 0" class="sync-empty">
          {{ isPush ? '所有时间表已是最新，无需推送。' : '所有时间表已是最新，无需拉取。' }}
        </div>

        <!-- 摘要 -->
        <div v-if="items.length > 0" class="sync-summary">
          选中 <strong>{{ checkedCount }}</strong> 条 / 共 {{ activeCount }} 条待操作
          （{{ unchangedCount }} 条无变化）
        </div>

        <!-- 按钮组 -->
        <div class="dialog-actions">
          <button class="dialog-btn" @click="$emit('cancel')">取消</button>
          <button
            class="dialog-btn primary"
            :disabled="checkedCount === 0"
            @click="onConfirm"
          >{{ isPush ? '确认推送' : '确认拉取' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  /** true=推送方向, false=拉取方向 */
  isPush: { type: Boolean, default: true },
  /** 差异分析结果数组 */
  items: { type: Array, default: () => [] }
})

const emit = defineEmits(['cancel', 'confirm'])

// ── 选中状态 ──
const checkedSet = ref(new Set())

// 展开状态（仅拉取时使用）
const expandedSet = ref(new Set())

// 初始化勾选：非 unchanged 的默认全选
watch(() => props.items, (val) => {
  const s = new Set()
  for (const item of val) {
    if (item.action !== 'unchanged') {
      s.add(item.tl.id)
    }
  }
  checkedSet.value = s
  expandedSet.value = new Set()
}, { immediate: true })

// ── 计算 ──
const activeCount = computed(() => props.items.filter(it => it.action !== 'unchanged').length)
const unchangedCount = computed(() => props.items.filter(it => it.action === 'unchanged').length)
const checkedCount = computed(() => {
  let n = 0
  for (const id of checkedSet.value) {
    const found = props.items.find(it => it.tl.id === id && it.action !== 'unchanged')
    if (found) n++
  }
  return n
})

// ── 事件 ──
function onToggle(id) {
  const s = new Set(checkedSet.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  checkedSet.value = s
}

function toggleExpand(i) {
  const s = new Set(expandedSet.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  expandedSet.value = s
}

function onConfirm() {
  const selected = props.items.filter(it => checkedSet.value.has(it.tl.id) && it.action !== 'unchanged')
  emit('confirm', selected)
}

// ── 辅助 ──
function actionLabel(action) {
  const map = {
    create: '新建',
    update: '更新',
    unchanged: '无变化'
  }
  return map[action] || action
}

function colorCount(colors) {
  if (!colors) return 0
  return Object.keys(colors).length
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sync-dialog {
  max-width: 500px;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
}

.dialog-box {
  background: #1c2333;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  min-width: 300px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.dialog-title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16px;
  flex-shrink: 0;
}

/* ── 列表 ── */
.sync-list {
  flex: 1;
  overflow-y: auto;
  max-height: 45vh;
  margin-bottom: 12px;
  padding-right: 4px;
}

.sync-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 8px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  transition: background 0.15s;
}

.sync-row.toggleable {
  cursor: pointer;
}

.sync-row.toggleable:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* ── 勾选框 ── */
.sync-check {
  flex-shrink: 0;
  padding-top: 2px;
}

.sync-check.disabled {
  opacity: 0.3;
}

.sync-check input {
  width: 14px;
  height: 14px;
  accent-color: #3498db;
  cursor: pointer;
}

.sync-check.disabled input {
  cursor: not-allowed;
}

/* ── 信息区 ── */
.sync-info {
  flex: 1;
  min-width: 0;
}

.sync-info-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.sync-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sync-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.sync-badge.create {
  background: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
}

.sync-badge.update {
  background: rgba(52, 152, 219, 0.15);
  color: #3498db;
}

.sync-badge.unchanged {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.25);
}

/* ── 差异摘要 ── */
.diff-summary {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.diff-summary span {
  white-space: nowrap;
}

.diff-expand-hint {
  color: rgba(52, 152, 219, 0.7);
  cursor: pointer;
}

.diff-expand-hint:hover {
  color: #3498db;
}

/* ── 展开详情 ── */
.diff-detail {
  margin-top: 8px;
  max-height: 160px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 8px 10px;
}

.diff-section {
  margin-bottom: 6px;
}

.diff-section:last-child {
  margin-bottom: 0;
}

.diff-label {
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.diff-label.add { color: #2ecc71; }
.diff-label.mod { color: #3498db; }
.diff-label.del { color: #e74c3c; }

.diff-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.diff-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.diff-tag.add { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
.diff-tag.mod { background: rgba(52, 152, 219, 0.1); color: #3498db; }
.diff-tag.del { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }

/* ── 冲突警告 ── */
.conflict-warning {
  margin-top: 6px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #ffa500;
  background: rgba(255, 165, 0, 0.08);
  border: 1px solid rgba(255, 165, 0, 0.2);
  border-radius: 6px;
}

/* ── 空/摘要 ── */
.sync-empty {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  padding: 24px 0;
}

.sync-summary {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16px;
  flex-shrink: 0;
}

.sync-summary strong {
  color: #3498db;
}

/* ── 按钮组 ── */
.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.dialog-btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s;
}

.dialog-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.dialog-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.dialog-btn.primary {
  background: #3498db;
  border-color: #3498db;
  color: #fff;
}

.dialog-btn.primary:hover:not(:disabled) {
  background: #2980b9;
}

.dialog-btn.primary:disabled {
  background: #3498db;
  opacity: 0.4;
}
</style>