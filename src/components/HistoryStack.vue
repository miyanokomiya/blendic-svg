<template>
  <div>
    <h3>history</h3>
    <ul>
      <li
        v-for="(item, i) in allStack"
        :key="i"
        :class="{ current: i === currentItemIndex }"
      >
        {{ item.name }}
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
  margin-bottom: 8px;
  text-align: left;
}
ul {
  list-style: none;
  display: flex;
  align-items: flex-start;
  flex-direction: column-reverse;
  > li {
    width: 100%;
    padding: 4px 8px;
    text-align: left;
    border-bottom: solid 1px #aaa;
    &.current {
      background-color: lime;
    }
  }
}
</style>
