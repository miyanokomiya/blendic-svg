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
  <div>
    <h3>history</h3>
    <ul>
      <li
        v-for="(item, i) in historySummaries"
        :key="i"
        :class="{ done: item.done }"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useHistoryStore } from '/@/store/history'

export default defineComponent({
  setup() {
    const historyStore = useHistoryStore()

    return {
      historySummaries: historyStore.historySummaries,
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
    border-bottom: solid 1px #888;
    &.done {
      background-color: #aaa;
    }
  }
}
</style>
