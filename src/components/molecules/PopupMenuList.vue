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
  <div class="popup-menu-list-wrapper" :style="{ transform }">
    <ul>
      <li v-for="item in popupMenuList" :key="item.label">
        <button
          type="button"
          :data-test-id="item.label"
          @click="item.exec"
          @mousemove="item.hover"
        >
          {{ item.label }}
          <UpIcon v-if="item.children" right class="right-arrow" />
        </button>
        <PopupMenuList
          v-if="item.children && item.opened"
          :popup-menu-list="item.children"
          :style="{ top: `${chldrenTop}px` }"
          class="children"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { computed, withDefaults } from 'vue'
import { UIPopupMenuItem } from '/@/composables/menuList'

const ITEM_HEIGHT = 26
</script>

<script setup lang="ts">
import UpIcon from '/@/components/atoms/UpIcon.vue'

const props = withDefaults(
  defineProps<{
    popupMenuList: UIPopupMenuItem[]
  }>(),
  {}
)

const focusedIndex = computed(() =>
  props.popupMenuList.findIndex((p) => p.focus)
)
const transform = computed(() => {
  const index = focusedIndex.value
  return index !== -1 ? `translateY(-${index * ITEM_HEIGHT}px)` : ''
})
const openedIndex = computed(() =>
  props.popupMenuList.findIndex((p) => p.opened)
)
const chldrenTop = computed(() => {
  // -1 makes top line well
  return openedIndex.value * ITEM_HEIGHT - 1
})
</script>

<style scoped>
.popup-menu-list-wrapper {
  position: relative;
  border: solid 1px var(--weak-border);
  background-color: var(--background);
}
ul {
  list-style: none;
  width: max-content;
}
li {
  min-width: 100px;
  display: flex;
  align-items: center;
}
li:hover {
  background-color: var(--background-second);
}
li > button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 26px;
  padding: 0 10px;
  text-align: left;
}
.children {
  position: absolute;
  left: 100%;
}
.right-arrow {
  margin-left: 10px;
  width: 16px;
  height: 16px;
}
</style>
