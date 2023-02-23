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
      <ToggleRadioButtons
        :model-value="canvasType"
        :options="canvasTypeOptions"
        @update:model-value="setGraphType"
      />
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
          type="button"
          class="add-graph"
          title="Add graph"
          :disabled="!selectedArmature"
          @click="addParentGraph"
        >
          <AddIcon />
        </button>
        <button
          type="button"
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
      <AnimationGraphCanvas class="canvas" :canvas="canvas">
        <g v-for="(edgeMapOfNode, id) in edgeSummaryMap" :key="id">
          <GraphEdge
            v-for="(edge, key) in edgeMapOfNode"
            :key="key"
            :from="edge.from"
            :to="edge.to"
            :input-id="edge.inputId"
            :input-key="edge.inputKey"
            :output-id="edge.outputId"
            :output-key="edge.outputKey"
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
        />
        <g v-if="draftEdges">
          <GraphEdge
            v-for="(edge, i) in draftEdges"
            :key="i"
            :from="edge.output"
            :to="edge.input"
            :type="edge.type"
            :status="edge.connected ? 'connected' : 'connecting'"
            :input-marker="edge.draftOutput"
            :output-marker="!edge.draftOutput"
          />
        </g>
      </AnimationGraphCanvas>
      <GraphSideBar class="side-bar" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import AnimationGraphCanvas from '/@/components/AnimationGraphCanvas.vue'
import SelectField from './atoms/SelectField.vue'
import ToggleRadioButtons from '/@/components/atoms/ToggleRadioButtons.vue'
import AddIcon from '/@/components/atoms/AddIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import GraphEdge from '/@/components/elements/GraphEdge.vue'
import GraphSideBar from '/@/components/GraphSideBar.vue'
import { watchEffect, watch, computed, ref } from 'vue'
import { useSvgCanvas } from '/@/composables/canvas'
import { useStore } from '/@/store'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import GraphNode from '/@/components/elements/GraphNode.vue'
import GraphNodeReroute from '/@/components/elements/GraphNodeReroute.vue'
import { toMap } from '/@/models'
import { add, IVec2 } from 'okageo'
import { useElementStore } from '/@/store/element'
import { flatElementTree, getElementLabel } from '/@/utils/elements'
import {
  provideGetBoneOptions,
  provideGetGraphNodeModuleFn,
  provideGetObjectOptions,
} from '/@/composables/animationGraph'
import { getGraphNodeRect } from '/@/utils/helpers'
import { getWrapperRect } from '/@/utils/geometry'
import { ValueType } from '/@/models/graphNode'
import { getInputType, getOutputType } from '/@/utils/graphNodes'

const canvasTypeOptions = [
  { value: 'graph', label: 'Graph' },
  { value: 'custom', label: 'Custom' },
]

const store = useStore()
const elementStore = useElementStore()
const graphStore = useAnimationGraphStore()
const currentGraph = computed(() => graphStore.lastSelectedGraph.value)

const canvas = useSvgCanvas()

const getGraphNodeModule = computed(() =>
  graphStore.getGraphNodeModuleFn.value()
)
provideGetGraphNodeModuleFn(() => getGraphNodeModule.value)

const selectedArmature = computed(() => store.lastSelectedArmature.value)
const selectedGraph = computed(() => graphStore.parentGraph.value)

const viewportCache = ref<Record<string, { scale: number; origin: IVec2 }>>({})
watch(selectedGraph, (to, from) => {
  if (from) {
    viewportCache.value = {
      ...viewportCache.value,
      [from.id]: {
        scale: canvas.scale.value,
        origin: canvas.viewOrigin.value,
      },
    }
  }

  if (to) {
    const cache = viewportCache.value[to.id]
    if (cache) {
      canvas.scale.value = cache.scale
      canvas.viewOrigin.value = cache.origin
    } else {
      const nodes = Object.values(graphStore.nodeMap.value)
      canvas.setViewport(
        nodes.length
          ? getWrapperRect(
              nodes.map((node) =>
                getGraphNodeRect(graphStore.getGraphNodeModuleFn.value(), node)
              )
            )
          : undefined
      )
    }
  }
})

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
  get: () => graphStore.selectedGraphByType.value?.id ?? '',
  set: (id: string) => graphStore.switchGraph(id),
})

const selectedNodes = graphStore.selectedNodes

const editedNodeMap = graphStore.editedNodeMap
const edgePositionMap = graphStore.edgePositionMap

const draftEdges = computed<
  | {
      output: IVec2
      input: IVec2
      type: ValueType
      draftOutput?: boolean
      connected?: boolean
    }[]
  | undefined
>(() => {
  const draftEdge = graphStore.draftEdge.value
  if (!draftEdge) return undefined

  const nodeMap = editedNodeMap.value
  const positions = edgePositionMap.value

  if (draftEdge.type === 'draft-input') {
    const node = nodeMap[draftEdge.output.nodeId]
    const type = getOutputType(
      getGraphNodeModule.value(node.type)?.struct,
      node,
      draftEdge.output.key
    )
    return node
      ? [
          {
            output: add(
              node.position,
              positions[node.id].outputs[draftEdge.output.key].p
            ),
            input: draftEdge.input,
            type,
            connected: draftEdge.connected,
          },
        ]
      : undefined
  } else {
    const indexInput = draftEdge.inputs[0]
    const type = getInputType(
      getGraphNodeModule.value(nodeMap[indexInput.nodeId].type)?.struct,
      nodeMap[indexInput.nodeId],
      indexInput.key
    )
    return draftEdge.inputs
      .filter((input) => nodeMap[input.nodeId])
      .map((input) => ({
        output: draftEdge.output,
        input: add(
          nodeMap[input.nodeId].position,
          positions[input.nodeId].inputs[input.key].p
        ),
        type,
        connected: draftEdge.connected,
        draftOutput: true,
      }))
  }
})

provideGetObjectOptions(() => {
  const actor = elementStore.lastSelectedActor.value
  if (graphStore.graphType.value !== 'graph' || !actor || !currentGraph.value)
    return []
  if (actor.armatureId !== currentGraph.value.armatureId) return []

  const nativeElementMap = toMap(flatElementTree([actor.svgTree]))
  return actor.elements.map((id) => {
    return { value: id, label: getElementLabel(nativeElementMap[id]) }
  })
})

provideGetBoneOptions(() => {
  const armature = store.lastSelectedArmature.value
  if (
    graphStore.graphType.value !== 'graph' ||
    !armature ||
    !currentGraph.value
  )
    return []
  if (armature.id !== currentGraph.value.armatureId) return []

  return Object.values(store.boneMap.value).map((bone) => {
    return { value: bone.id, label: bone.name }
  })
})

const canvasType = graphStore.graphType
const setGraphType = (val: any) => graphStore.setGraphType(val)
const edgeSummaryMap = graphStore.edgeSummaryMap
const nodeErrorMessagesMap = graphStore.nodeErrorMessagesMap
</script>

<style scoped>
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
}
.top > * {
  margin-right: 8px;
}
.top .select-graph {
  width: 160px;
}
.top .name-input {
  overflow: hidden;
}
.top .graph-buttons {
  display: flex;
  align-items: center;
}
.top .graph-buttons button {
  width: 20px;
  height: 20px;
}
.top .graph-buttons button + button {
  margin-left: 4px;
}
.top p {
  white-space: nowrap;
  overflow: hidden;
}
.main {
  flex: 1;
  min-height: 0;
  display: flex;
}
.main .canvas {
  width: calc(100% - 24px);
}
.main .side-bar {
  flex-shrink: 0;
}
</style>
