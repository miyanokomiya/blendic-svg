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
      <div class="select-graph-type">
        <SelectField
          :options="canvasTypeOptions"
          :model-value="canvasType"
          no-placeholder
          @update:model-value="setGraphType"
        />
      </div>
      <div class="select-graph">
        <SelectField v-model="selectedGraphId" :options="graphOptions" />
      </div>
      <input
        v-model="draftName"
        type="text"
        class="name-input"
        @change="changeGraphName"
      />
      <div class="graph-buttons">
        <button
          class="add-graph"
          title="Add graph"
          :disabled="!selectedArmature"
          @click="addParentGraph"
        >
          <AddIcon />
        </button>
        <button
          class="delete-graph"
          title="Delete graph"
          :disabled="!selectedGraphId"
          @click="deleteParentGraph"
        >
          <DeleteIcon />
        </button>
      </div>
      <p>(!!Experimental!!)</p>
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
        <component
          :is="node.type === 'reroute' ? GraphNodeReroute : GraphNode"
          v-for="node in editedNodeMap"
          :key="node.id"
          :node="node"
          :edge-positions="edgePositionMap[node.id]"
          :selected="selectedNodes[node.id]"
          :errors="nodeErrorMessagesMap[node.id]"
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
import {
  ClosestEdgeInfo,
  DraftGraphEdge,
  useAnimationGraphMode,
} from '/@/composables/modes/animationGraphMode'
import { useStore } from '/@/store'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import AnimationGraphCanvas from '/@/components/AnimationGraphCanvas.vue'
import SelectField from './atoms/SelectField.vue'
import AddIcon from '/@/components/atoms/AddIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import GraphNode from '/@/components/elements/GraphNode.vue'
import GraphNodeReroute from '/@/components/elements/GraphNodeReroute.vue'
import GraphEdge from '/@/components/elements/GraphEdge.vue'
import { IdMap, toMap } from '/@/models'
import { SelectOptions } from '/@/composables/modes/types'
import { mapReduce } from '/@/utils/commons'
import { add, IVec2 } from 'okageo'
import { getGraphNodeEdgePosition } from '/@/utils/helpers'
import { GraphNodeEdgePositions } from '/@/models/graphNode'
import { useElementStore } from '/@/store/element'
import GraphSideBar from '/@/components/GraphSideBar.vue'
import { flatElementTree, getElementLabel } from '/@/utils/elements'
import { getNodeErrors } from '/@/utils/graphNodes'
import { provideGetGraphNodeModuleFn } from '/@/composables/animationGraph'

export default defineComponent({
  components: {
    AnimationGraphCanvas,
    SelectField,
    AddIcon,
    DeleteIcon,
    GraphEdge,
    GraphSideBar,
  },
  setup() {
    const canvasTypeOptions = [
      { value: 'graph', label: 'Graph' },
      { value: 'custom', label: 'Custom Node' },
    ]

    const store = useStore()
    const elementStore = useElementStore()
    const graphStore = useAnimationGraphStore()
    const currentGraph = computed(() => graphStore.lastSelectedGraph.value)

    const canvas = useCanvas()
    const mode = useAnimationGraphMode(graphStore)

    const getGraphNodeModule = computed(() =>
      graphStore.getGraphNodeModuleFn.value()
    )
    provideGetGraphNodeModuleFn(() => getGraphNodeModule.value)

    const selectedArmature = computed(() => store.lastSelectedArmature.value)
    const selectedGraph = computed(() => graphStore.parentGraph.value)

    const allNames = computed(() =>
      graphStore.parentGraphs.value.map((g) => g.name)
    )

    const draftName = ref('')
    watchEffect(() => {
      draftName.value = selectedGraph.value?.name ?? ''
    })

    function addParentGraph() {
      if (graphStore.graphType.value === 'graph') {
        graphStore.addGraph()
      } else {
        graphStore.addCustomGraph()
      }
    }

    function deleteParentGraph() {
      if (graphStore.graphType.value === 'graph') {
        graphStore.deleteGraph()
      } else {
        graphStore.deleteCustomGraph()
      }
    }

    function changeGraphName() {
      if (allNames.value.includes(draftName.value)) {
        draftName.value = selectedGraph.value?.name ?? ''
      } else {
        if (graphStore.graphType.value === 'graph') {
          graphStore.updateGraph({ name: draftName.value })
        } else {
          graphStore.updateCustomGraph({ name: draftName.value })
        }
      }
    }

    const graphOptions = computed(() =>
      graphStore.graphType.value === 'graph'
        ? graphStore.graphs.value.map((g) => {
            const valid = selectedArmature.value?.id !== g.armatureId
            return {
              value: g.id,
              label: `${valid ? '(x)' : ''} ${g.name}`,
            }
          })
        : graphStore.customGraphs.value.map((g) => {
            return { value: g.id, label: g.name }
          })
    )

    const selectedGraphId = computed({
      get: () => selectedGraph.value?.id ?? '',
      set: (id: string) => graphStore.selectGraph(id),
    })

    const selectedNodes = graphStore.selectedNodes

    function downNodeBody(id: string, options?: SelectOptions) {
      mode.downNodeBody(id, options)
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
      return mapReduce(editedNodeMap.value, (node) =>
        getGraphNodeEdgePosition(getGraphNodeModule.value, node)
      )
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
          if (
            !input.from ||
            !edgePositionMap.value[input.from.id] ||
            !edgePositionMap.value[input.from.id].outputs[input.from.key]
          )
            return p

          if (
            draftToInfo &&
            draftToInfo.id === node.id &&
            draftToInfo.key === key
          )
            return p

          p[key] = {
            from: add(
              allNodes[input.from.id].position,
              edgePositionMap.value[input.from.id].outputs[input.from.key].p
            ),
            to: add(node.position, inputsPositions[key].p),
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
            ].p
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
            ].p
          ),
        }
      }
    })

    const nodeErrorMessagesMap = computed<IdMap<string[]>>(() => {
      return getNodeErrors(getGraphNodeModule.value, graphStore.nodeMap.value)
    })

    function updateNodeData(id: string, data: any, seriesKey?: string) {
      const node = graphStore.nodeMap.value[id]
      graphStore.updateNode(id, { ...node, data }, seriesKey)
    }

    function downNodeEdge(draftGraphEdge: DraftGraphEdge) {
      mode.downNodeEdge(draftGraphEdge)
    }

    function upNodeEdge(closestEdgeInfo: ClosestEdgeInfo) {
      mode.upNodeEdge(closestEdgeInfo)
    }

    provide<() => { value: string; label: string }[]>(
      'getObjectOptions',
      () => {
        const actor = elementStore.lastSelectedActor.value
        if (
          graphStore.graphType.value !== 'graph' ||
          !actor ||
          !currentGraph.value
        )
          return []
        if (actor.armatureId !== currentGraph.value.armatureId) return []

        const nativeElementMap = toMap(flatElementTree([actor.svgTree]))
        return actor.elements.map((id) => {
          return { value: id, label: getElementLabel(nativeElementMap[id]) }
        })
      }
    )

    return {
      GraphNode,
      GraphNodeReroute,

      canvasType: graphStore.graphType,
      setGraphType: (val: any) => graphStore.setGraphType(val),
      canvasTypeOptions,

      canvas,
      mode,

      selectedArmature,
      editedNodeMap,
      edgePositionMap,
      edgeMap,
      draftEdge,
      nodeErrorMessagesMap,

      draftName,
      changeGraphName,

      selectedGraphId,
      graphOptions,

      addParentGraph,
      deleteParentGraph,

      selectedNodes,
      downNodeBody,
      downNodeEdge,
      upNodeEdge,
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
  .select-graph-type {
    width: 130px;
  }
  .select-graph {
    width: 160px;
  }
  .name-input {
    overflow: hidden;
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
  p {
    white-space: nowrap;
    overflow: hidden;
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
