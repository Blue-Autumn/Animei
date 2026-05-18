<template>
  <div class="month-row">
    <div class="month-label">{{ monthName }}</div>
    <div class="days-row">
      <div class="day-header" v-for="d in 31" :key="'h' + d">
        <span v-if="d <= daysInMonth">{{ d }}</span>
      </div>
    </div>
    <div class="cells-row">
      <DayCell
        v-for="d in 31"
        :key="d"
        :day="d <= daysInMonth ? d : null"
        :month="month"
        :year="year"
        :record="getCellRecord(d)"
        @select="handleCellSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DayCell from './DayCell.vue'

const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  records: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select'])

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const monthName = computed(() => monthNames[props.month - 1])

const daysInMonth = computed(() => {
  return new Date(props.year, props.month, 0).getDate()
})

function getCellRecord(day) {
  if (day > daysInMonth.value) return null
  const dateStr = `${props.year}-${String(props.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return props.records[dateStr] || null
}

function handleCellSelect(data) {
  emit('select', data)
}
</script>

<style scoped>
.month-row {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.month-label {
  width: 52px;
  min-width: 52px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  padding-right: 8px;
  text-align: right;
  justify-content: flex-end;
}

.days-row {
  display: none;
}

.cells-row {
  display: flex;
  gap: 3px;
  flex-wrap: nowrap;
}

/* Show day numbers as a header row above month rows */
.month-row:hover .month-label {
  color: rgba(255, 255, 255, 0.8);
}
</style>
