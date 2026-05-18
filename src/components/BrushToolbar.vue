<template>
  <div class="brush-toolbar">
    <!-- Row 1: controls -->
    <div class="brush-row1">
      <!-- Brush toggle -->
      <button
        class="tb-btn brush-toggle"
        :class="{ active: active }"
        @click="$emit('toggle')"
        :title="active ? t('brush.off') : t('brush.on')"
      >
        <span>🖌</span>
        <span>{{ active ? t('brush.on') : t('brush.off') }}</span>
      </button>

      <!-- Undo / Redo (only when brush active) -->
      <button
        v-if="active"
        class="tb-btn undo-btn"
        :disabled="!canUndo"
        @click="$emit('undo')"
        :title="t('brush.undo') + ' (Ctrl+Z)'"
      >↩</button>
      <button
        v-if="active"
        class="tb-btn redo-btn"
        :disabled="!canRedo"
        @click="$emit('redo')"
        :title="t('brush.redo') + ' (Ctrl+Shift+Z)'"
      >↪</button>

      <!-- Expanded options (only when brush active) -->
      <template v-if="active">
        <div class="tb-sep"></div>

        <!-- Theme selector -->
        <div class="theme-selector">
          <label class="theme-label">{{ t('brush.palette') }}</label>
          <select
            class="theme-dropdown"
            :value="currentTheme"
            @change="$emit('set-theme', Number($event.target.value))"
          >
            <option
              v-for="(theme, idx) in themes"
              :key="idx"
              :value="idx"
            >{{ theme.name }}</option>
          </select>
        </div>

        <div class="tb-sep"></div>

        <!-- Overwrite toggle (button style) -->
        <button
          class="tb-btn overwrite-btn"
          :class="{ active: overwriteMode }"
          @click="$emit('toggle-overwrite', !overwriteMode)"
          :title="t('brush.overwrite')"
        >{{ t('brush.overwrite') }}</button>
      </template>
    </div>

    <!-- Row 2: Color palette (only when brush active, wraps independently) -->
    <div v-if="active" class="brush-row2">
      <ColorPalette
        :selected="brushColor"
        :theme-colors="themeColors"
        @select="c => $emit('set-color', c)"
      />
    </div>
  </div>
</template>

<script setup>
import ColorPalette from './ColorPalette.vue'
import { useI18n } from '../locales/index.js'

const { t } = useI18n()

defineProps({
  active: { type: Boolean, default: false },
  brushColor: { type: Number, default: null },
  overwriteMode: { type: Boolean, default: true },
  currentTheme: { type: Number, default: 0 },
  themes: { type: Array, default: () => [] },
  themeColors: { type: Array, default: () => [] },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false }
})

defineEmits(['toggle', 'set-color', 'set-theme', 'toggle-overwrite', 'undo', 'redo'])
</script>

<style scoped>
.brush-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.brush-row1 {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.brush-row2 {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tb-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 4px 8px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.tb-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.tb-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.brush-toggle.active {
  background: rgba(52, 152, 219, 0.15);
  border-color: rgba(52, 152, 219, 0.4);
  color: #3498db;
}

.undo-btn,
.redo-btn {
  font-size: 14px;
  padding: 4px 6px;
}

.overwrite-btn.active {
  background: rgba(46, 204, 113, 0.15);
  border-color: rgba(46, 204, 113, 0.4);
  color: #2ecc71;
}

.tb-sep {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.theme-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.theme-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
}

.theme-dropdown {
  padding: 2px 5px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  outline: none;
  max-width: 100px;
}

.theme-dropdown:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.theme-dropdown option {
  background: #161b22;
  color: rgba(255, 255, 255, 0.85);
}
</style>
