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
  <div class="tree-node" :class="{ 'g-tag': node.tag === 'g' }">
    <div class="node-view">
      <div class="spacer" :style="{ width: `${nestIndex * 10}px` }" />
      <a
        class="node-name"
        :class="{ selected, disabled: !canSelect }"
        @click.left.exact.prevent="click"
        @click.left.shift.exact.prevent="shiftClick"
        >{{ node.tag }} #{{ node.id }}</a
      >
    </div>
    <div class="children-space">
      <TreeNode
        v-for="c in children"
        :key="c.id"
        :node="c"
        :nest-index="nestIndex + 1"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, inject, PropType } from 'vue'
import { ElementNode } from '/@/models'

function shouldHide(tag: string): boolean {
  return /defs|metadata|namedview|script|style|tspan/.test(tag)
}

export default defineComponent({
  name: 'TreeNode',
  props: {
    node: {
      type: Object as PropType<ElementNode>,
      required: true,
    },
    nestIndex: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const children = computed(() => {
      return props.node.children
        .filter((c): c is ElementNode => typeof c !== 'string')
        .filter((elm) => !shouldHide(elm.tag))
    })

    // eslint-disable-next-line no-unused-vars
    const onClickElement = inject<(id: string, shift: boolean) => void>(
      'onClickElement',
      () => {}
    )

    const selectedMap = inject<ComputedRef<{ [id: string]: boolean }>>(
      'selectedMap',
      computed(() => ({}))
    )

    const selected = computed(() => {
      return !!selectedMap.value[props.node.id]
    })

    const canSelect = computed(() => props.node.tag !== 'svg')

    return {
      canSelect,
      children,
      click: () =>
        canSelect.value ? onClickElement(props.node.id, false) : '',
      shiftClick: () =>
        canSelect.value ? onClickElement(props.node.id, true) : '',
      selected,
    }
  },
})
</script>

<style lang="scss" scoped>
.tree-node {
  display: flex;
  flex-direction: column;
  text-align: left;
  font-size: 16px;
  width: fit-content;
  background-color: #fff;
  user-select: none;
  &.g-tag {
    border: solid 1px #ccc;
    background-color: #eee;
  }
}
.node-view {
  padding: 2px;
  display: flex;
  align-items: center;
}
.spacer {
  flex-shrink: 0;
}
.node-name {
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
  &.selected {
    color: orange;
  }
  &.disabled {
    pointer-events: none;
  }
  &::before {
    content: ' ';
    margin-right: 4px;
    width: 8px;
    height: 4px;
    border-left: solid 1px #000;
    border-bottom: solid 1px #000;
  }
}
</style>
