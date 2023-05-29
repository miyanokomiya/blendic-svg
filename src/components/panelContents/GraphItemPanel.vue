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
  <div v-if="targetNode" class="item-panel">
    <form @submit.prevent>
      <h5>Data</h5>
      <template v-for="(data, key) in dataMap" :key="key">
        <BlockField>
          <GraphNodeDataField
            :label="key as string"
            :type="data.type"
            :model-value="data.value"
            @update:model-value="updateDataMap[key]"
            @start-pick-bone="startPickBone"
          />
        </BlockField>
      </template>
      <template v-if="hasInput">
        <h5>Inputs</h5>
        <template v-for="(input, key) in inputsMap" :key="key">
          <BlockField>
            <GraphNodeDataField
              :label="input.label"
              :type="input.type"
              :model-value="input.value"
              :disabled="input.disabled"
              @update:model-value="updateInputMap[key]"
              @start-pick-bone="startPickBone"
            />
          </BlockField>
        </template>
      </template>
    </form>
  </div>
  <div v-else>
    <p>No Item</p>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import {
  getDataTypeAndValue,
  getInputTypes,
  updateDataField,
} from '/@/utils/graphNodes'
import { mapReduce } from '/@/utils/commons'
import { ValueType } from '/@/models/graphNode'
import { injectGetGraphNodeModuleFn } from '/@/composables/animationGraph'
import { PickerOptions } from '/@/composables/modes/types'
import { useCanvasStore } from '/@/store/canvas'

interface DataInfo {
  type: ValueType
  value: unknown
  label: string
  disabled?: boolean
}
</script>

<script lang="ts" setup>
import BlockField from '/@/components/atoms/BlockField.vue'
import GraphNodeDataField from '/@/components/atoms/GraphNodeDataField.vue'

const canvasStore = useCanvasStore()
const graphStore = useAnimationGraphStore()
const targetNode = graphStore.lastSelectedNode

const getGraphNodeModule = computed(injectGetGraphNodeModuleFn())
const struct = computed(() => {
  if (!targetNode.value) return
  return getGraphNodeModule.value(targetNode.value.type)?.struct
})

const dataMap = computed<{
  [key: string]: DataInfo
}>(() => {
  const node = targetNode.value
  if (!node || !struct.value) return {}
  return mapReduce(node.data, (_, key) => ({
    ...getDataTypeAndValue(getGraphNodeModule.value, node, key),
    label: key,
  }))
})

const updateDataMap = computed(() =>
  mapReduce(
    dataMap.value,
    (_, key) => (val: any, seriesKey?: string) =>
      updateData(key, val, seriesKey)
  )
)

function updateData(key: string, val: any, seriesKey?: string) {
  const node = targetNode.value
  if (!node) return

  graphStore.updateNode(
    node.id,
    {
      data: {
        ...node.data,
        [key]: updateDataField(
          getGraphNodeModule.value,
          node.type,
          key,
          node.data[key],
          val
        ),
      },
    },
    seriesKey
  )
}

const inputsMap = computed<{
  [key: string]: DataInfo
}>(() => {
  if (!targetNode.value || !struct.value) return {}

  const inputs = targetNode.value.inputs
  const types = getInputTypes(
    getGraphNodeModule.value(targetNode.value.type)?.struct,
    targetNode.value
  )
  const resolvedNodeMap = graphStore.resolvedGraph.value?.nodeMap ?? {}
  struct.value.inputs

  return mapReduce(inputs, (value, key) => {
    const label = struct.value?.inputs[key]?.label ?? key
    return value.from
      ? {
          type: types[key],
          value: resolvedNodeMap[value.from.id]?.[value.from.key] ?? '',
          disabled: true,
          label,
        }
      : { type: types[key], value: value.value, label }
  })
})

const updateInputMap = computed(() =>
  mapReduce(
    inputsMap.value,
    (_, key) => (val: any, seriesKey?: string) =>
      updateInput(key, val, seriesKey)
  )
)

function updateInput(key: string, value: any, seriesKey?: string) {
  if (!targetNode.value) return

  graphStore.updateNode(
    targetNode.value.id,
    {
      inputs: {
        ...targetNode.value.inputs,
        [key]: { ...targetNode.value.inputs[key], value },
      },
    },
    seriesKey
  )
}
const hasInput = computed(() => Object.keys(inputsMap.value).length > 0)

function startPickBone(val?: PickerOptions) {
  canvasStore.dispatchCanvasEvent({
    type: 'state',
    data: { name: 'pick-bone', options: val },
  })
}
</script>

<style scoped>
.item-panel {
  text-align: left;
}
h4,
h5 {
  margin-bottom: 8px;
}
* + h5 {
  margin-top: 8px;
}
</style>
