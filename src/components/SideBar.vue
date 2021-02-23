<template>
  <div class="side-bar">
    <ul class="tab-list">
      <li
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ current: currentTab === tab.key }"
      >
        <a href="#" @click.prevent="toggleTab(tab.key)">{{ tab.label }}</a>
      </li>
    </ul>
    <div v-if="currentTab !== ''" class="tab-content">
      <ItemPanel v-if="currentTab === 'item'" />
      <WeightPanel v-else-if="currentTab === 'weight'" />
      <ViewPanel v-else-if="currentTab === 'view'" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import ItemPanel from '/@/components/panelContents/ItemPanel.vue'
import WeightPanel from '/@/components/panelContents/WeightPanel.vue'
import ViewPanel from '/@/components/panelContents/ViewPanel.vue'

type TabName = '' | 'item' | 'weight' | 'view'

export default defineComponent({
  components: { ItemPanel, WeightPanel, ViewPanel },
  setup() {
    const currentTab = ref<TabName>('item')

    const tabs = computed((): { key: TabName; label: string }[] => [
      { key: 'item', label: 'Item' },
      { key: 'weight', label: 'Weight' },
      { key: 'view', label: 'View' },
    ])

    function toggleTab(tab: TabName) {
      currentTab.value = currentTab.value === tab ? '' : tab
    }

    return { tabs, currentTab, toggleTab }
  },
})
</script>

<style lang="scss" scoped>
.side-bar {
  position: relative;
}
.tab-list {
  list-style: none;
  > li {
    margin-bottom: 4px;
    padding: 4px 2px;
    border: solid 1px #aaa;
    border-left: none;
    border-radius: 0 4px 4px 0;
    writing-mode: sideways-lr;
    &.current {
      background-color: #ddd;
    }
    > a {
      text-decoration: none;
      color: #000;
      font-size: 14px;
    }
  }
}
.tab-content {
  position: absolute;
  top: 0;
  right: 100%;
  padding: 10px;
  border: solid 1px #aaa;
  border-radius: 0 0 0 4px;
  min-width: 140px;
}
</style>
