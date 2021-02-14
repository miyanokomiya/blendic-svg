<template>
  <div class="tab-panel-root">
    <ul>
      <li
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ current: tab.key === current }"
      >
        <a href="#" @click.prevent="setTab(tab.key)">{{ tab.label }}</a>
      </li>
    </ul>
    <div class="panels">
      <div v-for="tab in tabs" v-show="tab.key === current" :key="tab.key">
        <slot :name="tab.key"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'

export default defineComponent({
  props: {
    tabs: {
      type: Array as PropType<{ key: string; label: string }[]>,
      default: () => [],
    },
  },
  setup(props) {
    const current = ref<string>(props.tabs[0]?.key ?? '')

    return {
      current,
      setTab: (key: string) => (current.value = key),
    }
  },
})
</script>

<style lang="scss" scoped>
.tab-panel-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
}
ul {
  flex: 0;
  list-style: none;
  display: flex;
  align-items: center;
  > li {
    margin-right: 4px;
    padding: 2px 4px;
    border: solid 1px #000;
    border-bottom: none;
    &.current {
      background-color: lime;
    }
    > a {
      text-decoration: none;
      color: #000;
    }
  }
}
.panels {
  flex: 1;
  padding: 10px;
  border: solid 1px #000;
  overflow: auto;
}
</style>
