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
    initialTab: {
      type: String,
      default: undefined,
    },
  },
  setup(props) {
    const current = ref<string>(props.initialTab ?? props.tabs[0]?.key ?? '')

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
    border: solid 1px var(--weak-border);
    border-radius: 4px 4px 0 0;
    border-bottom: none;
    &.current {
      background-color: var(--input-value-selected-weak);
    }
    > a {
      text-decoration: none;
      color: var(--text);
      font-size: 14px;
    }
  }
}
.panels {
  flex: 1;
  padding: 10px;
  border: solid 1px var(--strong-border);
  overflow: auto;
}
</style>
