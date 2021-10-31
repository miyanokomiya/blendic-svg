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
            :label="key"
            :type="data.type"
            :model-value="data.value"
            @update:model-value="
              (val, seriesKey) => updateData(key, val, seriesKey)
            "
          />
        </BlockField>
      </template>
      <template v-if="hasInput">
        <h5>Inputs</h5>
        <template v-for="(input, key) in inputsMap" :key="key">
          <BlockField>
            <GraphNodeDataField
              v-if="input.disabled"
              :label="key"
              :type="input.type"
              model-value="connected"
              disabled
            />
            <GraphNodeDataField
              v-else
              :label="key"
              :type="input.type"
              :model-value="input.value"
              @update:model-value="
                (val, seriesKey) => updateInput(key, val, seriesKey)
              "
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
import { computed, defineComponent } from 'vue'
import BlockField from '/@/components/atoms/BlockField.vue'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import { getGraphNodeModule } from '/@/utils/graphNodes'
import { mapReduce } from '/@/utils/commons'
import GraphNodeDataField from '/@/components/atoms/GraphNodeDataField.vue'

interface DataInfo {
  type: string
  value: unknown
  disabled?: boolean
}

export default defineComponent({
  components: {
    BlockField,
    GraphNodeDataField,
  },
  setup() {
    const graphStore = useAnimationGraphStore()
    const targetNode = graphStore.lastSelectedNode

    const struct = computed(() => {
      if (!targetNode.value) return
      return getGraphNodeModule(targetNode.value.type).struct
    })

    const dataMap = computed<{
      [key: string]: DataInfo
    }>(() => {
      if (!targetNode.value || !struct.value) return {}

      const dataStruct = struct.value.data
      return mapReduce(targetNode.value.data, (value, key) => {
        return {
          type: (dataStruct as any)[key].type as string,
          value,
        }
      })
    })
    function updateData(key: string, val: any, seriesKey?: string) {
      if (!targetNode.value) return

      graphStore.updateNode(
        targetNode.value.id,
        { data: { ...targetNode.value.data, [key]: val } },
        seriesKey
      )
    }

    const inputsMap = computed<{
      [key: string]: DataInfo
    }>(() => {
      if (!targetNode.value || !struct.value) return {}

      const inputsStruct = struct.value.inputs
      const inputs = targetNode.value.inputs
      return mapReduce(inputs, (value, key) => {
        return {
          type: (inputsStruct as any)[key].type as string,
          value: value.value,
          disabled: !!value.from,
        }
      })
    })
    function updateInput(key: string, value: any, seriesKey?: string) {
      if (!targetNode.value) return

      graphStore.updateNode(
        targetNode.value.id,
        { inputs: { ...targetNode.value.inputs, [key]: { value } } },
        seriesKey
      )
    }
    const hasInput = computed(() => Object.keys(inputsMap.value).length > 0)

    return {
      labelWidth: '20px',
      targetNode,
      dataMap,
      updateData,
      inputsMap,
      updateInput,
      hasInput,
    }
  },
})
</script>

<style lang="scss" scoped>
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
