<template>
  <div class="color-palette">
    <button
      v-for="(c, idx) in themeColors"
      :key="idx"
      class="color-btn"
      :class="{ active: selected === idx }"
      :style="{ backgroundColor: c }"
      @click="$emit('select', idx)"
      :title="'颜色 ' + idx"
    ></button>
    <button
      class="color-btn remove-btn"
      :class="{ active: selected === null }"
      @click="$emit('select', null)"
      title="清除颜色"
    >
      <span>✕</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  selected: { type: Number, default: null },
  themeColors: { type: Array, default: () => [] }
})

defineEmits(['select'])
</script>

<style scoped>
.color-palette {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.color-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  outline: none;
  flex-shrink: 0;
}

.color-btn:hover {
  transform: scale(1.2);
}

.color-btn.active {
  border-color: #ffffff;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
}

.remove-btn {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.8);
}

.remove-btn span {
  pointer-events: none;
}
</style>
