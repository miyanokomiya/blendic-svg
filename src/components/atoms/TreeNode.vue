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
  <div class="tree-node" :class="{ 'g-tag': isG }">
    <div class="node-view">
      <div class="spacer" :style="{ width: `${nestIndex * 10}px` }" />
      <button v-if="isG" class="toggle-closed" @click="toggleClosed">
        <UpIcon :flipped="!closed" :right="closed" />
      </button>
      <div v-else class="spacer" :style="{ width: '16px' }" />
      <a
        class="node-name"
        :class="{ selected, disabled: !canSelect }"
        @click.left.exact.prevent="click"
        @click.left.shift.exact.prevent="shiftClick"
        >{{ node.tag }} #{{ node.id }}</a
      >
    </div>
    <div v-if="!closed" class="children-space">
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
import {
  computed,
  ComputedRef,
  defineComponent,
  inject,
  PropType,
  ref,
} from 'vue'
import { ElementNode } from '/@/models'
import UpIcon from '/@/components/atoms/UpIcon.vue'

function shouldHide(tag: string): boolean {
  return /defs|metadata|namedview|script|style|tspan/.test(tag)
}

export default defineComponent({
  name: 'TreeNode',
  components: { UpIcon },
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

    const isG = computed(() => props.node.tag === 'g')
    const closed = ref(false)
    function toggleClosed() {
      closed.value = !closed.value
    }

    return {
      isG,
      closed,
      toggleClosed,
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
.toggle-closed {
  margin-right: 4px;
  display: flex;
  align-items: center;
  border-radius: 2px;
  overflow: hidden;
  > * {
    height: 14px;
  }
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
}
</style>
