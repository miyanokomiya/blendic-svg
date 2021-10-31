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
  <div class="tree-node" :class="{ 'has-children': hasChildren }">
    <div class="node-view">
      <div class="spacer" :style="{ width: `${nestIndex * 10}px` }" />
      <button v-if="hasChildren" class="toggle-closed" @click="toggleClosed">
        <UpIcon :flipped="!closed" :right="closed" />
      </button>
      <div v-else class="spacer" :style="{ width: '16px' }" />
      <TextInput
        v-if="editingName"
        :model-value="node.name"
        autofocus
        @update:model-value="updateName"
        @blur="endEditingName"
      />
      <a
        v-else
        class="node-name"
        :class="{ selected }"
        @click.left.prevent="click"
        @dblclick.prevent="startEditingName"
        >{{ node.name }}</a
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
import UpIcon from '/@/components/atoms/UpIcon.vue'
import { TreeNode } from '/@/utils/relations'
import TextInput from '/@/components/atoms/TextInput.vue'
import { SelectOptions } from '/@/composables/modes/types'
import { getMouseOptions } from '/@/utils/devices'

export default defineComponent({
  name: 'TreeNode',
  components: { UpIcon, TextInput },
  props: {
    node: {
      type: Object as PropType<TreeNode>,
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
    })

    // eslint-disable-next-line no-unused-vars
    const onClickElement = inject<
      (id: string, options?: SelectOptions) => void
    >('onClickElement', () => {})

    const selectedMap = inject<ComputedRef<{ [id: string]: boolean }>>(
      'selectedMap',
      computed(() => ({}))
    )

    const selected = computed(() => {
      return !!selectedMap.value[props.node.id]
    })

    const closed = ref(false)
    function toggleClosed() {
      closed.value = !closed.value
    }

    const editingName = ref(false)
    const updateName = inject<(id: string, name: string) => void>(
      'updateName',
      () => {}
    )
    const getEditable = inject<() => boolean>('getEditable', () => false)
    const editable = computed(getEditable)

    return {
      hasChildren: computed(() => props.node.children.length > 0),
      closed,
      toggleClosed,
      children,
      click: (e: MouseEvent) =>
        onClickElement(props.node.id, getMouseOptions(e)),
      selected,

      editingName,
      startEditingName: () => {
        if (!editable.value) return
        editingName.value = true
      },
      endEditingName: () => (editingName.value = false),
      updateName(name: string) {
        if (!editable.value) return
        updateName(props.node.id, name)
        editingName.value = false
      },
    }
  },
})
</script>

<style lang="scss" scoped>
.tree-node {
  width: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;
  font-size: 16px;
  background-color: #fff;
  user-select: none;
  &.has-children {
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
  flex-grow: 1;
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
}
</style>
