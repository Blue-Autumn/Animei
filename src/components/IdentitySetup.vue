<template>
  <Teleport to="body">
    <div class="identity-overlay">
      <div class="identity-card">
        <div class="identity-logo">🎨 Animei</div>
        <div class="identity-title">欢迎使用 — 首次设置</div>
        <p class="identity-desc">
          在启用云端同步前，请为当前设备起一个名字。<br />
          此名称会标注在每份同步记录上，可帮助您区分来自不同设备的数据。
        </p>

        <div class="identity-form">
          <label class="identity-label">设备名称</label>
          <input
            ref="inputRef"
            v-model="name"
            class="identity-input"
            type="text"
            placeholder="例如：小明的工作电脑"
            maxlength="30"
            @keydown.enter="onConfirm"
          />
          <div v-if="error" class="identity-error">{{ error }}</div>
        </div>

        <div class="identity-footer">
          <button class="identity-btn" @click="onConfirm" :disabled="!name.trim()">
            确认并继续
          </button>
          <button class="identity-btn skip-btn" @click="onSkip">暂不设置</button>
        </div>

        <p class="identity-hint">
          您可以在侧边栏设置中随时修改名称。
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { setIdentityName } from '../utils/identity.js'

const emit = defineEmits(['done'])

const name = ref('')
const error = ref('')
const inputRef = ref(null)

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})

function onConfirm() {
  const val = name.value.trim()
  if (!val) {
    error.value = '名称不能为空'
    return
  }
  setIdentityName(val)
  emit('done')
}

function onSkip() {
  // 跳过 — 保持默认名称"未命名设备"
  emit('done')
}
</script>

<style scoped>
.identity-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.identity-card {
  background: #1a202c;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 40px 36px 28px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.identity-logo {
  font-size: 28px;
  font-weight: 800;
  color: #3498db;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.identity-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 14px;
}

.identity-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.7;
  margin-bottom: 24px;
}

.identity-form {
  text-align: left;
  margin-bottom: 20px;
}

.identity-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 6px;
}

.identity-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.identity-input:focus {
  border-color: #3498db;
}

.identity-error {
  font-size: 11px;
  color: #e74c3c;
  margin-top: 6px;
}

.identity-footer {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 14px;
}

.identity-btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #3498db;
  color: #fff;
  transition: all 0.2s;
}

.identity-btn:hover:not(:disabled) {
  background: #2980b9;
}

.identity-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.skip-btn {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.skip-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.identity-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
}
</style>