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
            selected
          />
        </g>
      </AnimationGraphCanvas>
      <GraphSideBar class="side-bar" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watchEffect, computed, ref } from 'vue'
import { useSvgCanvas } from '/@/composables/canvas'
import { useStore } from '/@/store'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import AnimationGraphCanvas from '/@/components/AnimationGraphCanvas.vue'
import SelectField from './atoms/SelectField.vue'
import AddIcon from '/@/components/atoms/AddIcon.vue'
import DeleteIcon from '/@/components/atoms/DeleteIcon.vue'
import GraphNode from '/@/components/elements/GraphNode.vue'
import GraphNodeReroute from '/@/components/elements/GraphNodeReroute.vue'
import GraphEdge from '/@/components/elements/GraphEdge.vue'
import { toMap } from '/@/models'
import { add, IVec2 } from 'okageo'
import { useElementStore } from '/@/store/element'
import GraphSideBar from '/@/components/GraphSideBar.vue'
import { flatElementTree, getElementLabel } from '/@/utils/elements'
import {
  provideGetBoneOptions,
  provideGetGraphNodeModuleFn,
  provideGetObjectOptions,
} from '/@/composables/animationGraph'

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

    const canvas = useSvgCanvas()

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
      get: () =>
        (graphStore.graphType.value === 'graph'
          ? graphStore.lastSelectedGraph.value?.id
          : graphStore.lastSelectedCustomGraph.value?.id) ?? '',
      set: (id: string) =>
        graphStore.graphType.value === 'graph'
          ? graphStore.selectGraph(id)
          : graphStore.selectCustomGraph(id),
    })

    const selectedNodes = graphStore.selectedNodes

    const editedNodeMap = graphStore.editedNodeMap
    const edgePositionMap = graphStore.edgePositionMap

    const draftEdges = computed<{ output: IVec2; input: IVec2 }[] | undefined>(
      () => {
        const draftEdge = graphStore.draftEdge.value
        if (!draftEdge) return undefined

        if (draftEdge.type === 'draft-input') {
          return [
            {
              output: add(
                editedNodeMap.value[draftEdge.output.nodeId].position,
                edgePositionMap.value[draftEdge.output.nodeId].outputs[
                  draftEdge.output.key
                ].p
              ),
              input: draftEdge.input,
            },
          ]
        } else {
          return draftEdge.inputs.map((input) => ({
            output: draftEdge.output,
            input: add(
              editedNodeMap.value[input.nodeId].position,
              edgePositionMap.value[input.nodeId].inputs[input.key].p
            ),
          }))
        }
      }
    )

    provideGetObjectOptions(() => {
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

    return {
      GraphNode,
      GraphNodeReroute,

      canvasType: graphStore.graphType,
      setGraphType: (val: any) => graphStore.setGraphType(val),
      canvasTypeOptions,
      canvas,

      selectedArmature,
      editedNodeMap,
      edgePositionMap,
      edgeSummaryMap: graphStore.edgeSummaryMap,
      draftEdges,
      nodeErrorMessagesMap: graphStore.nodeErrorMessagesMap,

      draftName,
      changeGraphName,

      selectedGraphId,
      graphOptions,

      addParentGraph,
      deleteParentGraph,

      selectedNodes,
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
