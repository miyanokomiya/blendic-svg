<template>
  <div>
    <h3>history</h3>
    <ul>
      <li
        v-for="(item, i) in allStack"
        :key="i"
        :class="{ current: i === currentItemIndex }"
      >
        {{ item.command.name }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useHistoryStore } from '../store/history'

export default defineComponent({
  setup() {
    const historyStore = useHistoryStore()

    return {
      allStack: computed(() => historyStore.allStack.value),
      currentItemIndex: computed(() => historyStore.currentItemIndex.value),
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  margin: 0 0 8px;
  padding-left: 8px;
  text-align: left;
}
ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  align-items: flex-start;
  flex-direction: column-reverse;
  > li {
    padding: 4px 8px;
    border-bottom: solid 1px #aaa;
    &.current {
      background-color: lime;
    }
  }
}
</style>
