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
  <div ref="root" class="dropdown-menu">
    <button @click="toggle">{{ label }}</button>
    <ul v-if="opened" class="drop-menu">
      <template v-for="item in items" :key="item.value">
        <li>
          <button type="button" @click="exec(item.value)">
            {{ item.label }}
          </button>
        </li>
        <hr v-if="item.underline" />
      </template>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue'

export default defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
    items: {
      type: Array as PropType<
        { value: string; label: string; underline: boolean }[]
      >,
      default: () => [],
    },
  },
  emits: ['select'],
  setup(_, { emit }) {
    const root = ref<Element>()
    const opened = ref(false)

    function mousemove(e: MouseEvent) {
      if (e.target instanceof Element) {
        if (!root.value?.contains(e.target)) {
          opened.value = false
        }
      }
    }

    watch(opened, (to) => {
      if (to) {
        window.addEventListener('mousemove', mousemove)
      } else {
        window.removeEventListener('mousemove', mousemove)
      }
    })

    return {
      root,
      opened,
      toggle() {
        opened.value = !opened.value
      },
      exec(action: string) {
        emit('select', action)
        opened.value = false
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.dropdown-menu {
  position: relative;
  font-size: 12px;
  > button {
    position: relative;
    margin-right: 4px;
    padding: 2px 18px 2px 10px;
    border: solid 1px #777;
    border-radius: 4px;
    background-color: #fff;
    &.selected {
      background-color: #ddd;
    }
    &:last-child {
      margin-right: 0;
    }
    &::after {
      display: block;
      content: ' ';
      position: absolute;
      top: 7px;
      right: 4px;
      width: 0;
      height: 0;
      pointer-events: none;
      border-top: solid 6px #999;
      border-left: solid 5px transparent;
      border-right: solid 5px transparent;
    }
  }
  > ul {
    position: absolute;
    top: 20px;
    left: 1px;
    list-style: none;
    border: solid 1px #aaa;
    background-color: #fff;
    min-width: 100px;
    border-radius: 0 4px 4px 4px;
    li {
      padding: 4px 0;
    }
    hr {
      margin: 0 auto;
      width: calc(100% - 10px);
      border: none;
      border-top: solid 1px #aaa;
    }
    button {
      display: block;
      width: 100%;
      padding: 4px 10px;
      text-align: left;
      &:hover {
        background-color: #eee;
      }
    }
  }
}
</style>
