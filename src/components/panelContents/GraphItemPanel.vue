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
        <InlineField :label-width="labelWidth">
          <GraphNodeDataField
            :label="key"
            :type="data.type"
            :model-value="data.value"
            @update:modelValue="
              (val, seriesKey) => updateData(key, val, seriesKey)
            "
          />
        </InlineField>
      </template>
    </form>
  </div>
  <div v-else>
    <p>No Item</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import InlineField from '/@/components/atoms/InlineField.vue'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import { getGraphNodeModule } from '/@/utils/graphNodes'
import { mapReduce } from '/@/utils/commons'
import GraphNodeDataField from '/@/components/atoms/GraphNodeDataField.vue'

export default defineComponent({
  components: {
    InlineField,
    GraphNodeDataField,
  },
  setup() {
    const graphStore = useAnimationGraphStore()
    const targetNode = graphStore.lastSelectedNode

    const dataMap = computed(() => {
      if (!targetNode.value) return {}

      const dataStruct = getGraphNodeModule(targetNode.value.type).struct.data
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

    return {
      labelWidth: '20px',
      targetNode,
      dataMap,
      updateData,
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
