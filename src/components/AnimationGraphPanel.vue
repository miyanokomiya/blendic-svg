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
  <div class="animation-graph-panel-root">
    <div class="top">
      <div class="select-graph">
        <SelectField v-model="selectedGraphId" :options="graphOptions" />
      </div>
      <input v-model="draftName" type="text" @change="changeGraphName" />
      <div class="graph-buttons">
        <button
          class="add-graph"
          title="Add graph"
          :disabled="!selectedArmature"
          @click="addGraph"
        >
          <AddIcon />
        </button>
        <button
          class="delete-graph"
          title="Delete graph"
          :disabled="!selectedGraphId"
          @click="deleteGraph"
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
    <div class="main">
      <AnimationGraphCanvas class="canvas" :canvas="canvas" :mode="mode">
        <g v-for="(edgeMapOfNode, id) in edgeMap" :key="id">
          <GraphEdge
            v-for="(edge, key) in edgeMapOfNode"
            :key="key"
            :from="edge.from"
            :to="edge.to"
          />
        </g>
        <GraphNode
          v-for="node in editedNodeMap"
          :key="node.id"
          :node="node"
          :edge-positions="edgePositionMap[node.id]"
          :selected="selectedNodes[node.id]"
          @select="selectNode"
          @down-body="downNodeBody"
          @down-edge="downNodeEdge"
          @up-edge="upNodeEdge"
          @update:data="updateNodeData"
        />
        <g v-if="draftEdge">
          <GraphEdge :from="draftEdge.from" :to="draftEdge.to" selected />
        </g>
      </AnimationGraphCanvas>
      <GraphSideBar class="side-bar" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watchEffect, computed, ref, provide } from 'vue'
import { useCanvas } from '/@/composables/canvas'
import { useAnimationGraphMode } from '/@/composables/modes/animationGraphMode'
import { useStore } from '/@/store'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import AnimationGraphCanvas from '/@/components/AnimationGraphCanvas.vue'
import SelectField from './atoms/SelectField.vue'
import AddIcon from '/@/components/atoms/AddIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import GraphNode from '/@/components/elements/GraphNode.vue'
import GraphEdge from '/@/components/elements/GraphEdge.vue'
import { getAnimationGraph, IdMap } from '/@/models'
import { getNotDuplicatedName } from '/@/utils/relations'
import { SelectOptions } from '/@/composables/modes/types'
import { mapReduce } from '/@/utils/commons'
import { add, IVec2 } from 'okageo'
import {
  getGraphNodeInputsPosition,
  getGraphNodeOutputsPosition,
} from '/@/utils/helpers'
import { GraphNodeEdgePositions } from '/@/models/graphNode'
import { useElementStore } from '/@/store/element'
import GraphSideBar from '/@/components/GraphSideBar.vue'
import { getElementLabel } from '/@/utils/elements'

export default defineComponent({
  components: {
    AnimationGraphCanvas,
    SelectField,
    AddIcon,
    DeleteIcon,
    GraphNode,
    GraphEdge,
    GraphSideBar,
  },
  setup() {
    const store = useStore()
    const elementStore = useElementStore()
    const graphStore = useAnimationGraphStore()
    const currentGraph = computed(() => graphStore.lastSelectedGraph.value)

    const canvas = useCanvas()
    const mode = useAnimationGraphMode(graphStore)

    const selectedArmature = computed(() => store.lastSelectedArmature.value)
    const selectedGraph = computed(() => graphStore.lastSelectedGraph.value)

    const allNames = computed(() =>
      graphStore.graphList.value.map((g) => g.name)
    )

    const draftName = ref('')
    watchEffect(() => {
      draftName.value = selectedGraph.value?.name ?? ''
    })

    function changeGraphName() {
      if (allNames.value.includes(draftName.value)) {
        draftName.value = selectedGraph.value?.name ?? ''
      } else {
        graphStore.updateGraph({ name: draftName.value })
      }
    }

    const graphOptions = computed(() =>
      graphStore.graphList.value.map((g) => {
        const valid = selectedArmature.value?.id !== g.armatureId
        return {
          value: g.id,
          label: `${valid ? '(x)' : ''} ${g.name}`,
        }
      })
    )

    function addGraph() {
      graphStore.addGraph(
        getAnimationGraph(
          {
            name: getNotDuplicatedName('Graph', allNames.value),
            armatureId: selectedArmature.value?.id ?? '',
          },
          true
        )
      )
    }

    const selectedGraphId = computed({
      get: () => selectedGraph.value?.id ?? '',
      set: (id: string) => graphStore.selectGraph(id),
    })

    const selectedNodes = graphStore.selectedNodes

    function selectNode(id: string, options: SelectOptions) {
      graphStore.selectNode(id, options)
    }

    function downNodeBody(id: string) {
      mode.downNodeBody(id)
    }

    const editedNodeMap = computed(() => {
      return mapReduce(graphStore.nodeMap.value, (n, id) => {
        return {
          ...n,
          position: add(n.position, mode.getEditTransforms(id).translate),
        }
      })
    })

    const edgePositionMap = computed<IdMap<GraphNodeEdgePositions>>(() => {
      return mapReduce(editedNodeMap.value, (node) => {
        const inputsPosition = getGraphNodeInputsPosition(node)
        const outputsPosition = getGraphNodeOutputsPosition(node)
        return { inputs: inputsPosition, outputs: outputsPosition }
      })
    })

    const edgeMap = computed(() => {
      const draftToInfo =
        mode.draftEdgeInfo.value?.type === 'draft-from'
          ? {
              id: mode.draftEdgeInfo.value.to.nodeId,
              key: mode.draftEdgeInfo.value.to.key,
            }
          : undefined

      const allNodes = editedNodeMap.value

      return mapReduce(allNodes, (node) => {
        const inputsPositions = edgePositionMap.value[node.id].inputs
        return Object.entries(node.inputs).reduce<{
          [key: string]: { from: IVec2; to: IVec2 }
        }>((p, [key, input]) => {
          if (!input.from || !edgePositionMap.value[input.from.id]) return p
          if (
            draftToInfo &&
            draftToInfo.id === node.id &&
            draftToInfo.key === key
          )
            return p
          p[key] = {
            from: add(
              allNodes[input.from.id].position,
              edgePositionMap.value[input.from.id].outputs[input.from.key]
            ),
            to: add(node.position, inputsPositions[key]),
          }
          return p
        }, {})
      })
    })

    const draftEdge = computed<{ from: IVec2; to: IVec2 } | undefined>(() => {
      if (!mode.draftEdgeInfo.value) return undefined

      if (mode.draftEdgeInfo.value.type === 'draft-to') {
        return {
          from: add(
            editedNodeMap.value[mode.draftEdgeInfo.value.from.nodeId].position,
            edgePositionMap.value[mode.draftEdgeInfo.value.from.nodeId].outputs[
              mode.draftEdgeInfo.value.from.key
            ]
          ),
          to: mode.draftEdgeInfo.value.to,
        }
      } else {
        return {
          from: mode.draftEdgeInfo.value.from,
          to: add(
            editedNodeMap.value[mode.draftEdgeInfo.value.to.nodeId].position,
            edgePositionMap.value[mode.draftEdgeInfo.value.to.nodeId].inputs[
              mode.draftEdgeInfo.value.to.key
            ]
          ),
        }
      }
    })

    function updateNodeData(id: string, data: any, seriesKey?: string) {
      const node = graphStore.nodeMap.value[id]
      graphStore.updateNode(id, { ...node, data }, seriesKey)
    }

    provide('getObjectOptions', () => {
      if (!currentGraph.value) return []

      const elementMap = elementStore.nativeElementMap.value
      const actor = elementStore.actors.value.find(
        (a) => a.armatureId === currentGraph.value!.armatureId
      )
      return (
        actor?.elements.map((e) => {
          return { value: e.id, label: getElementLabel(elementMap[e.id]) }
        }) ?? []
      )
    })

    return {
      canvas,
      mode,

      selectedArmature,
      currentGraph,
      editedNodeMap,
      edgePositionMap,
      edgeMap,
      draftEdge,

      draftName,
      changeGraphName,

      selectedGraphId,
      graphOptions,

      addGraph,
      deleteGraph: graphStore.deleteGraph,

      selectedNodes,
      selectNode,
      downNodeBody,
      downNodeEdge: mode.downNodeEdge,
      upNodeEdge: mode.upNodeEdge,
      updateNodeData,
    }
  },
})
</script>

<style lang="scss" scoped>
.animation-graph-panel-root {
  display: flex;
  flex-direction: column;
  align-items: left;
  height: 100%;
}
.top {
  margin-bottom: 4px;
  flex: 0;
  display: flex;
  align-items: center;
  > * {
    margin-right: 8px;
  }
  .select-graph {
    width: 160px;
  }
  .graph-buttons {
    display: flex;
    align-items: center;
    button {
      width: 20px;
      height: 20px;
      & + button {
        margin-left: 4px;
      }
    }
  }
}
.main {
  flex: 1;
  min-height: 0;
  display: flex;
  .canvas {
    width: calc(100% - 24px);
  }
  .side-bar {
    flex-shrink: 0;
  }
}
</style>
