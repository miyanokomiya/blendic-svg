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
    <button type="button" @click="toggle">{{ label }}</button>
    <ul v-if="opened" class="drop-menu">
      <template v-for="item in items" :key="item.label">
        <li>
          <button type="button" @click="exec(item.exec)">
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
import { ToolMenuItem } from '/@/composables/modes/types'

export default defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
    items: {
      type: Array as PropType<ToolMenuItem[]>,
      default: () => [],
    },
  },
  setup() {
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
      exec(fn?: () => void) {
        fn?.()
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
    padding: 2px 18px 2px 10px;
    border: solid 1px var(--strong-border);
    border-radius: 4px;
    background-color: var(--background);
    &.selected {
      background-color: var(--input-value-selected-weak);
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
      border-top: solid 6px var(--strong-border);
      border-left: solid 5px transparent;
      border-right: solid 5px transparent;
    }
  }
  > ul {
    position: absolute;
    top: 20px;
    left: 1px;
    list-style: none;
    border: solid 1px var(--weak-border);
    background-color: var(--background);
    min-width: 100px;
    border-radius: 0 4px 4px 4px;
    li {
      padding: 4px 0;
    }
    hr {
      margin: 0 auto;
      width: calc(100% - 10px);
      border: none;
      border-top: solid 1px var(--weak-border);
    }
    button {
      display: block;
      width: 100%;
      padding: 4px 10px;
      text-align: left;
      &:hover {
        background-color: var(--background-second);
      }
    }
  }
}
</style>
