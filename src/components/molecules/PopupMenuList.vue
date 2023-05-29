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
    <div v-if="enabledSearch" class="keyword-block">
      <TextInput v-model="keyword" realtime autofocus keep-focus />
    </div>
    <div v-if="keyword && filteredList.length === 0" class="not-found">
      <p>Not found</p>
    </div>
    <ul v-else>
      <li v-for="item in filteredList" :key="item.label">
        <button
          type="button"
          :data-test-id="item.label"
          @click="item.exec"
          @mousemove="item.hover"
        >
          <DeltaText
            v-if="keyword"
            :delta-list="splitByKeyword(keyword, item.label)"
          />
          <p v-else>
            {{ item.label }}
          </p>
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
import { ref, computed } from 'vue'
import { UIPopupMenuItem } from '/@/composables/menuList'

const ITEM_HEIGHT = 26
const SEARCH_FIELD_HEIGHT = 26
</script>

<script setup lang="ts">
import UpIcon from '/@/components/atoms/UpIcon.vue'
import TextInput from '/@/components/atoms/TextInput.vue'
import DeltaText from '/@/components/atoms/DeltaText.vue'
import { splitByKeyword } from '/@/utils/textSearch'

const props = withDefaults(
  defineProps<{
    popupMenuList: UIPopupMenuItem[]
    enabledSearch?: boolean
  }>(),
  {
    enabledSearch: false,
  }
)

const focusedIndex = computed(() =>
  props.popupMenuList.findIndex((p) => p.focus)
)
const transform = computed(() => {
  const index = focusedIndex.value
  return index !== -1
    ? `translateY(-${index * ITEM_HEIGHT + SEARCH_FIELD_HEIGHT}px)`
    : ''
})
const openedIndex = computed(() =>
  props.popupMenuList.findIndex((p) => p.opened)
)
const chldrenTop = computed(() => {
  const children = props.popupMenuList[openedIndex.value]?.children
  if (!children) return 0

  const centralized = Math.ceil(children.length / 2) - 1
  // -1 makes top line well
  return (
    (openedIndex.value - centralized) * ITEM_HEIGHT + SEARCH_FIELD_HEIGHT - 1
  )
})

const keyword = ref('')

const filteredList = computed(() => {
  if (!keyword.value) return props.popupMenuList

  const value = keyword.value.toLowerCase()
  return props.popupMenuList
    .flatMap((item) => {
      return [item, ...(item.children ?? [])].filter(
        (n) => n.exec && !n.children && n.label.toLowerCase().includes(value)
      )
    })
    .sort((a, b) => a.label.length - b.label.length)
})
</script>

<style scoped>
.popup-menu-list-wrapper {
  position: relative;
  border: solid 1px var(--weak-border);
  background-color: var(--background);
  width: max-content;
}
ul {
  list-style: none;
  width: 100%;
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
  background-color: initial;
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
.keyword-block {
  width: 140px;
}
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
}
</style>
