<template>
  <div v-if="availableCommandList.length > 0" class="canvas-command">
    <ul>
      <li v-for="item in availableCommandList" :key="item.command">
        <span class="command">{{ item.command }}</span
        >: {{ item.title }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { CommandExam } from '/@/models'

export default defineComponent({
  props: {
    availableCommandList: {
      type: Array as PropType<CommandExam[]>,
      default: () => [],
    },
  },
})
</script>

<style lang="scss" scoped>
.canvas-command {
  margin-top: 4px;
  text-align: left;
  font-size: 14px;
  pointer-events: none;
}
ul {
  list-style: none;
  display: flex;
  flex-direction: column;
}
li {
  display: flex;
  align-items: center;
}
.command {
  min-width: 12px;
}
</style>
