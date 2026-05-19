<template>
  <div class="hsl-picker">
    <!-- 色相×饱和度矩形 (X=饱和度, Y=明度, 固定当前色相) -->
    <div
      class="hue-sat-area"
      ref="hsAreaRef"
      @mousedown.prevent="onHsMouseDown"
      :style="{ background: hsBg }"
    >
      <div
        class="hs-dot"
        :style="{ left: satPct + '%', top: lDotTop + '%' }"
      ></div>
    </div>

    <!-- 色相彩虹条 -->
    <div class="hue-track">
      <div
        class="hue-bar"
        ref="hBarRef"
        @mousedown.prevent="onHBarMouseDown"
        :style="{ background: hBarBg }"
      >
        <div class="h-handle" :style="{ left: huePct + '%' }"></div>
      </div>
    </div>

    <!-- 预览色块 + 参数 -->
    <div class="preview-row">
      <div class="preview-swatch" :style="{ background: previewHex }"></div>
      <div class="params">
        <label
          v-for="p in params"
          :key="p.key"
          class="param-item"
        >
          <span class="param-label">{{ p.label }}</span>
          <input
            class="param-input"
            type="text"
            :value="p.value"
            @input="onParamInput(p.key, $event)"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { hexToHsl, hslToHex } from '../utils/color.js'

const props = defineProps({
  modelValue: { type: String, default: '#3498db' }
})

const emit = defineEmits(['update:modelValue'])

// ── Internal HSL state ──
const hsl = ref(hexToHsl(props.modelValue))

watch(() => props.modelValue, (hex) => {
  const newHsl = hexToHsl(hex)
  if (newHsl.h !== hsl.value.h || newHsl.s !== hsl.value.s || newHsl.l !== hsl.value.l) {
    hsl.value = newHsl
  }
})

function emitHex() {
  const hex = hslToHex(hsl.value.h, hsl.value.s, hsl.value.l)
  emit('update:modelValue', hex)
}

// ── Rect area (Saturation × Lightness, fixed hue) ──
const hsAreaRef = ref(null)
const hsBg = computed(() => {
  const h = hsl.value.h
  // X = saturation (top layer: white→pure hue)
  // Y = lightness (bottom layer: transparent→black)
  return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))`
})

const satPct = computed(() => hsl.value.s)
const lDotTop = computed(() => 100 - hsl.value.l)

function hsPosFromEvent(e) {
  const rect = hsAreaRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
  return {
    s: Math.round(x * 100),
    l: Math.round((1 - y) * 100)
  }
}

function onHsMouseDown(e) {
  const pos = hsPosFromEvent(e)
  hsl.value = { ...hsl.value, s: pos.s, l: pos.l }
  emitHex()
  const onMove = (ev) => {
    const p = hsPosFromEvent(ev)
    hsl.value = { ...hsl.value, s: p.s, l: p.l }
    emitHex()
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ── Hue bar (rainbow gradient) ──
const hBarRef = ref(null)
const hBarBg = computed(() => {
  const stops = []
  for (let deg = 0; deg <= 360; deg += 60) {
    stops.push(`hsl(${deg}, 100%, 50%)`)
  }
  return `linear-gradient(to right, ${stops.join(', ')})`
})

const huePct = computed(() => (hsl.value.h / 360) * 100)

function hPosFromEvent(e) {
  const rect = hBarRef.value.getBoundingClientRect()
  const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  return Math.round((pct / 100) * 360)
}

function onHBarMouseDown(e) {
  hsl.value = { ...hsl.value, h: hPosFromEvent(e) }
  emitHex()
  const onMove = (ev) => {
    hsl.value = { ...hsl.value, h: hPosFromEvent(ev) }
    emitHex()
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ── Params ──
const previewHex = computed(() => hslToHex(hsl.value.h, hsl.value.s, hsl.value.l))

const params = computed(() => [
  { key: 'h', label: 'H', value: hsl.value.h },
  { key: 's', label: 'S', value: hsl.value.s + '%' },
  { key: 'l', label: 'L', value: hsl.value.l + '%' },
  { key: 'hex', label: 'Hex', value: previewHex.value }
])

function onParamInput(key, e) {
  if (key === 'hex') {
    const val = e.target.value.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const newHsl = hexToHsl(val)
      hsl.value = newHsl
      emitHex()
    }
    return
  }
  const raw = parseInt(e.target.value, 10)
  if (isNaN(raw)) return
  if (key === 'h') {
    hsl.value = { ...hsl.value, h: Math.max(0, Math.min(360, raw)) }
  } else if (key === 's') {
    hsl.value = { ...hsl.value, s: Math.max(0, Math.min(100, raw)) }
  } else if (key === 'l') {
    hsl.value = { ...hsl.value, l: Math.max(0, Math.min(100, raw)) }
  }
  emitHex()
}
</script>

<style scoped>
.hsl-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

/* ── Saturation × Lightness rect ── */
.hue-sat-area {
  position: relative;
  width: 100%;
  aspect-ratio: 1.5;
  border-radius: 6px;
  cursor: crosshair;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hs-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 4px rgba(0,0,0,0.4);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ── Hue bar (rainbow) ── */
.hue-track {
  width: 100%;
}

.hue-bar {
  position: relative;
  height: 14px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.h-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 20px;
  border-radius: 3px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.2);
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

/* ── Preview + params ── */
.preview-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

.params {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.param-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  min-width: 18px;
}

.param-input {
  width: 44px;
  padding: 2px 4px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
  outline: none;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.param-input:focus {
  border-color: #3498db;
}
</style>
