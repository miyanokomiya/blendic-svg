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
      <slot :name="currentTab" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    tabs?: { key: string; label: string }[]
    defaultTab?: string
  }>(),
  {
    tabs: () => [],
    defaultTab: '',
  }
)

const currentTab = ref(props.defaultTab)

function toggleTab(tab: string) {
  currentTab.value = currentTab.value === tab ? '' : tab
}
</script>

<style scoped>
.side-bar {
  position: relative;
}
.tab-list {
  list-style: none;
}
.tab-list > li {
  margin-bottom: 4px;
  padding: 4px 2px;
  border: solid 1px var(--weak-border);
  border-right: none;
  border-radius: 4px 0 0 4px;
  writing-mode: vertical-lr;
  transform: scale(-1);
}
.tab-list > li.current {
  background-color: var(--input-value-selected-weak);
}
.tab-list > li > a {
  text-decoration: none;
  color: var(--text);
  font-size: 14px;
}
.tab-content {
  position: absolute;
  top: 0;
  right: 100%;
  padding: 10px;
  border: solid 1px var(--weak-border);
  border-radius: 0 0 0 4px;
  background-color: var(--background);
  min-width: 140px;
  max-width: 140px;
  max-height: 100%;
  overflow: auto;
}
</style>
