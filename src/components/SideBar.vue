<!--
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
-->

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
      <ViewPanel v-else-if="currentTab === 'view'" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import ItemPanel from '/@/components/panelContents/ItemPanel.vue'
import ViewPanel from '/@/components/panelContents/ViewPanel.vue'

type TabName = '' | 'item' | 'weight' | 'view'

export default defineComponent({
  components: { ItemPanel, ViewPanel },
  setup() {
    const currentTab = ref<TabName>('item')

    const tabs = computed((): { key: TabName; label: string }[] => [
      { key: 'item', label: 'Item' },
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
    border-right: none;
    border-radius: 4px 0 0 4px;
    writing-mode: vertical-lr;
    transform: scale(-1);
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
  background-color: #fff;
  min-width: 140px;
  max-width: 140px;
}
</style>
