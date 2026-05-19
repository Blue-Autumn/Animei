<template>
  <Teleport to="body">
    <div class="dialog-overlay" @mousedown.self="onCancel">
      <div class="dialog-box">
        <div class="dialog-title">{{ title }}</div>
        <div class="dialog-message">{{ message }}</div>
        <div class="dialog-actions">
          <button
            v-for="(btn, i) in buttons"
            :key="i"
            class="dialog-btn"
            :class="btn.class"
            @click="btn.action"
          >{{ btn.label }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  /** 按钮数组: [{ label, class, action }] */
  buttons: { type: Array, required: true }
})

const emit = defineEmits(['cancel'])

function onCancel() {
  emit('cancel')
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    onCancel()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
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

.dialog-box {
  background: #1c2333;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  min-width: 300px;
  max-width: 400px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.dialog-title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.dialog-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 20px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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

.dialog-btn.primary {
  background: #3498db;
  border-color: #3498db;
  color: #fff;
}

.dialog-btn.primary:hover {
  background: #2980b9;
}

.dialog-btn.danger {
  background: rgba(255, 80, 80, 0.15);
  border-color: rgba(255, 80, 80, 0.3);
  color: #ff5555;
}

.dialog-btn.danger:hover {
  background: rgba(255, 80, 80, 0.25);
}
</style>
