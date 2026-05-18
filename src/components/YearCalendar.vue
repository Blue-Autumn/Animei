<template>
  <div class="year-section">
    <div class="year-header">
      <span class="year-number">{{ year }}</span>
    </div>

    <div class="calendar-grid">
      <!-- Day number headers -->
      <div class="day-headers">
        <div class="month-label-spacer"></div>
        <div
          v-for="d in 31"
          :key="'dh-' + d"
          class="day-header-cell"
        >
          <span>{{ d }}</span>
        </div>
      </div>

      <!-- Month rows -->
      <MonthRow
        v-for="m in 12"
        :key="m"
        :year="year"
        :month="m"
        :records="records"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup>
import MonthRow from './MonthRow.vue'

defineProps({
  year: { type: Number, required: true },
  records: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select'])

function handleSelect(data) {
  emit('select', data)
}
</script>

<style scoped>
.year-section {
  margin-bottom: 48px;
}

.year-header {
  margin-bottom: 16px;
}

.year-number {
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 2px;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-headers {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 6px;
}

.month-label-spacer {
  width: 52px;
  min-width: 52px;
  margin-right: 8px;
}

.day-header-cell {
  width: 16px;
  min-width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 3px;
}

.day-header-cell span {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.25);
  font-weight: 500;
}
</style>
