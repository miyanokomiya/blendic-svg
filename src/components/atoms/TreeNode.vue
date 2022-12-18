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
    <div :data-scroll_anchor="node.id" class="node-view">
      <div class="spacer" :style="{ width: `${nestIndex * 8}px` }" />
      <button
        v-if="hasChildren"
        type="button"
        class="toggle-closed"
        @click="toggleClosed"
      >
        <UpIcon :flipped="!closed" :right="closed" />
      </button>
      <div v-else class="spacer" :style="{ width: '16px' }" />
      <TextInput
        v-if="editingName"
        :model-value="node.name"
        autofocus
        @update:model-value="updateNameHandler"
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
      <TreeNodeVue
        v-for="c in children"
        :key="c.id"
        :node="c"
        :nest-index="nestIndex + 1"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, inject, ref, withDefaults } from 'vue'
import { TreeNode } from '/@/utils/relations'
import { SelectOptions } from '/@/composables/modes/types'
import { getMouseOptions } from '/@/utils/devices'

export default {
  name: 'TreeNodeVue',
}
</script>

<script setup lang="ts">
import UpIcon from '/@/components/atoms/UpIcon.vue'
import TextInput from '/@/components/atoms/TextInput.vue'

const props = withDefaults(
  defineProps<{
    node: TreeNode
    nestIndex?: number
  }>(),
  { nestIndex: 0 }
)

const children = computed(() => {
  return props.node.children
})

const onClickElement = inject<(id: string, options?: SelectOptions) => void>(
  'onClickElement',
  () => {}
)

const getSelectedMap = inject<() => { [id: string]: boolean }>(
  'getSelectedMap',
  () => ({})
)

const selected = computed(() => {
  return !!getSelectedMap()[props.node.id]
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

const hasChildren = computed(() => props.node.children.length > 0)

const click = (e: MouseEvent) =>
  onClickElement(props.node.id, getMouseOptions(e))

function startEditingName() {
  if (!editable.value) return
  editingName.value = true
}

function endEditingName() {
  editingName.value = false
}

function updateNameHandler(name: string) {
  if (!editable.value) return
  updateName(props.node.id, name)
  editingName.value = false
}
</script>

<style scoped>
.tree-node {
  width: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;
  font-size: 16px;
  background-color: var(--background);
  user-select: none;
}
.tree-node.has-children {
  border: solid 1px var(--weak-border);
  border-right: none;
  background-color: var(--background-slight);
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
  flex-shrink: 0;
  align-items: center;
  border-radius: 2px;
  overflow: hidden;
}
.toggle-closed > * {
  height: 14px;
}
.node-name {
  flex-grow: 1;
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
}
.node-name:hover {
  opacity: 0.7;
}
.node-name.selected {
  color: orange;
}
</style>
