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
        <button @click="item.exec">
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { PopupMenuItem } from '/@/models'

export default defineComponent({
  props: {
    popupMenuList: {
      type: Array as PropType<PopupMenuItem[]>,
      required: true,
    },
  },
  setup(props) {
    const transform = computed(() => {
      const index = props.popupMenuList.findIndex((p) => p.focus)
      return index !== -1 ? `translateY(-${index * 26}px)` : ''
    })

    return { transform }
  },
})
</script>

<style lang="scss" scoped>
.popup-menu-list-wrapper {
  border: solid 1px #aaa;
  background-color: #fff;
}
ul {
  list-style: none;
}
li {
  min-width: 100px;
  display: flex;
  align-items: center;
  &:hover {
    background-color: #eee;
  }
  > button {
    width: 100%;
    height: 26px;
    padding: 0 10px;
    text-align: left;
  }
}
</style>
