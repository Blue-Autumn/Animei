<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @mousedown.self="onCancel">
      <div class="dialog-panel" ref="panelRef">
        <div class="dialog-header">
          <span class="dialog-title">{{ t('settings.title') }}</span>
        </div>

        <div class="dialog-body">
          <!-- 语言 / Language -->
          <div class="setting-row">
            <label class="setting-label">{{ t('settings.language') }}</label>
            <div class="setting-control">
              <select
                class="lang-dropdown"
                :value="langValue"
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
              <button class="step-btn" @click="adjust('cellSize', -1)" :disabled="local.cellSize <= 8">−</button>
              <span class="setting-value">{{ local.cellSize ? local.cellSize : t('settings.auto') }}</span>
              <button class="step-btn" @click="adjust('cellSize', 1)" :disabled="local.cellSize !== null && local.cellSize >= 40">+</button>
              <button class="reset-btn" @click="onAutoClick">↔</button>
            </div>
          </div>

          <!-- 起始年份 -->
          <div class="setting-row">
            <label class="setting-label">{{ t('settings.startYear') }}</label>
            <div class="setting-control">
              <button class="step-btn" @click="adjust('startYear', -1)">−</button>
              <input
                class="setting-input"
                type="text"
                inputmode="numeric"
                :value="local.startYear"
                @input="onStartYearInput"
                @blur="validateStartYear"
              />
              <button class="step-btn" @click="adjust('startYear', 1)">+</button>
            </div>
          </div>

          <!-- 结束年份 -->
          <div class="setting-row">
            <label class="setting-label">{{ t('settings.endYear') }}</label>
            <div class="setting-control">
              <button class="step-btn" @click="adjust('endYear', -1)">−</button>
              <input
                class="setting-input"
                type="text"
                inputmode="numeric"
                :value="local.endYear"
                @input="onEndYearInput"
                @blur="validateEndYear"
              />
              <button class="step-btn" @click="adjust('endYear', 1)">+</button>
            </div>
          </div>

          <!-- 预留扩展插槽 -->
          <slot name="extra"></slot>

          <!-- 快捷键提示 -->
          <div class="shortcuts-hint">{{ t('settings.shortcuts') }}</div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="onCancel">{{ t('settings.cancel') }}</button>
          <button class="btn btn-apply" @click="onApply">{{ t('settings.apply') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useI18n } from '../locales/index.js'

const { t, setLocale, localeNames } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  settings: { type: Object, required: true }
})

const emit = defineEmits(['apply', 'cancel', 'recalc-auto'])

const local = reactive({
  cellSize: null,
  startYear: 2024,
  endYear: 2026
})

const langValue = ref(props.settings.locale || 'zh')

// Sync from props when dialog opens
watch(() => props.visible, (v) => {
  if (v) {
    local.cellSize = props.settings.cellSize
    local.startYear = props.settings.startYear
    local.endYear = props.settings.endYear
    langValue.value = props.settings.locale || 'zh'
  }
})

function onLangChange(e) {
  const val = e.target.value
  langValue.value = val
  setLocale(val)
}

function adjust(key, delta) {
  if (key === 'cellSize') {
    const cur = local.cellSize ?? 19
    const next = Math.max(8, Math.min(40, cur + delta))
    local.cellSize = next
    return
  }
  const cur = local[key]
  const next = Math.max(1900, Math.min(2100, cur + delta))
  local[key] = next
}

function filterYearInput(value) {
  return value.replace(/\D/g, '')
}

function onStartYearInput(e) {
  const raw = filterYearInput(e.target.value)
  const num = parseInt(raw, 10)
  if (raw === '' || isNaN(num)) {
    e.target.value = ''
    local.startYear = ''
    return
  }
  local.startYear = num
  e.target.value = num
}

function validateStartYear() {
  let v = local.startYear
  if (v === '' || isNaN(v) || v < 1900) v = 1900
  if (v > 2100) v = 2100
  if (v > local.endYear) v = local.endYear
  local.startYear = v
}

function onEndYearInput(e) {
  const raw = filterYearInput(e.target.value)
  const num = parseInt(raw, 10)
  if (raw === '' || isNaN(num)) {
    e.target.value = ''
    local.endYear = ''
    return
  }
  local.endYear = num
  e.target.value = num
}

function validateEndYear() {
  let v = local.endYear
  if (v === '' || isNaN(v) || v > 2100) v = 2100
  if (v < 1900) v = 1900
  if (v < local.startYear) v = local.startYear
  local.endYear = v
}

function onApply() {
  validateStartYear()
  validateEndYear()
  emit('apply', {
    cellSize: local.cellSize,
    startYear: local.startYear,
    endYear: local.endYear,
    locale: langValue.value
  })
}

function onAutoClick() {
  local.cellSize = null
  emit('recalc-auto')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-panel {
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.dialog-header {
  padding: 16px 20px 0;
}

.dialog-title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.dialog-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.setting-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
  flex-shrink: 0;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lang-dropdown {
  padding: 4px 10px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  outline: none;
  min-width: 100px;
}

.lang-dropdown:hover {
  border-color: rgba(255, 255, 255, 0.25);
}

.lang-dropdown option {
  background: #161b22;
  color: rgba(255, 255, 255, 0.85);
}

.setting-value {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.setting-input {
  width: 72px;
  padding: 4px 8px;
  font-size: 14px;
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
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
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
  padding: 4px 8px;
  font-size: 11px;
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
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
  padding-top: 4px;
  line-height: 1.5;
  user-select: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
}

.btn {
  padding: 6px 20px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.55);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
}

.btn-apply {
  background: #3498db;
  color: #fff;
}

.btn-apply:hover {
  background: #2980b9;
}
</style>
