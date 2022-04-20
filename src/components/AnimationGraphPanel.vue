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
      <AnimationGraphCanvas
        ref="canvasRef"
        class="canvas"
        :canvas="canvas"
        @mousedown="handleDownEvent"
        @mouseup="handleUpEvent"
        @mousemove="handleNativeMoveEvent"
        @keydown="handleKeydownEvent"
        @update:data="updateNodeData"
      >
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
import { defineComponent, watchEffect, computed, ref } from 'vue'
import { useCanvas } from '/@/composables/canvas'
import { useAnimationGraphMode } from '/@/composables/modes/animationGraphMode'
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
import { mapReduce } from '/@/utils/commons'
import { add, IVec2, sub } from 'okageo'
import { getGraphNodeEdgePosition } from '/@/utils/helpers'
import { GraphNodeEdgePositions } from '/@/models/graphNode'
import { useElementStore } from '/@/store/element'
import GraphSideBar from '/@/components/GraphSideBar.vue'
import { flatElementTree, getElementLabel } from '/@/utils/elements'
import {
  provideGetBoneOptions,
  provideGetGraphNodeModuleFn,
  provideGetObjectOptions,
} from '/@/composables/animationGraph'
import { parseEventTarget } from '/@/composables/modeStates/animationGraph/utils'
import { getKeyOptions, getMouseOptions, isCtrlOrMeta } from '/@/utils/devices'
import { useThrottle } from '/@/composables/throttle'
import { PointerMovement, usePointerLock } from '../composables/window'

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

    const canvasRef = ref<typeof AnimationGraphCanvas>()

    const canvas = useCanvas()
    const throttleMousemove = useThrottle(handleMoveEvent, 1000 / 60, true)
    const pointerLock = usePointerLock({
      onMove: throttleMousemove,
      onGlobalMove: (arg) => {
        if (!canvasRef.value?.svg) return
        const svgRect = canvasRef.value.svg.getBoundingClientRect()
        const p = add(arg.p, { x: svgRect.left, y: svgRect.top })
        if (!p) return
        canvas.setMousePoint(p)
      },
      onEscape: () => {
        // TODO
      },
    })

    const mode = useAnimationGraphMode({
      graphStore,
      requestPointerLock: () => {
        if (!canvasRef.value?.svg) return
        pointerLock.requestPointerLockFromElement(canvasRef.value.svg)
      },
      exitPointerLock: pointerLock.exitPointerLock,
      startEditMovement: () => {
        canvas.setEditStartPoint(canvas.mousePoint.value)
        graphStore.setEditMovement({
          start: canvas.viewToCanvas(canvas.mousePoint.value),
          current: canvas.viewToCanvas(canvas.mousePoint.value),
          ctrl: false,
          scale: canvas.scale.value,
        })
      },
    })

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

    const editedNodeMap = computed(() => {
      const editMovement = graphStore.editMovement.value
      if (!editMovement) return graphStore.nodeMap.value

      const translate = sub(editMovement.current, editMovement.start)
      const selectedMap = selectedNodes.value
      return mapReduce(graphStore.nodeMap.value, (n, id) => {
        return selectedMap[id]
          ? { ...n, position: add(n.position, translate) }
          : n
      })
    })

    const edgePositionMap = computed<IdMap<GraphNodeEdgePositions>>(() => {
      return mapReduce(editedNodeMap.value, (node) =>
        getGraphNodeEdgePosition(getGraphNodeModule.value, node)
      )
    })

    const edgeMap = computed(() => {
      const draftToInfo =
        graphStore.draftEdge.value?.type === 'draft-from'
          ? {
              id: graphStore.draftEdge.value.to.nodeId,
              key: graphStore.draftEdge.value.to.key,
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
      if (!graphStore.draftEdge.value) return undefined

      if (graphStore.draftEdge.value.type === 'draft-to') {
        return {
          from: add(
            editedNodeMap.value[graphStore.draftEdge.value.from.nodeId]
              .position,
            edgePositionMap.value[graphStore.draftEdge.value.from.nodeId]
              .outputs[graphStore.draftEdge.value.from.key].p
          ),
          to: graphStore.draftEdge.value.to,
        }
      } else {
        return {
          from: graphStore.draftEdge.value.from,
          to: add(
            editedNodeMap.value[graphStore.draftEdge.value.to.nodeId].position,
            edgePositionMap.value[graphStore.draftEdge.value.to.nodeId].inputs[
              graphStore.draftEdge.value.to.key
            ].p
          ),
        }
      }
    })

    function updateNodeData(id: string, data: any, seriesKey?: string) {
      const node = graphStore.nodeMap.value[id]
      graphStore.updateNode(id, { ...node, data }, seriesKey)
    }

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

    function handleDownEvent(e: MouseEvent) {
      if (e.button === 0) {
        canvas.downLeft()
      } else if (e.button === 1) {
        canvas.downMiddle()
      }

      mode.sm.handleEvent({
        type: 'pointerdown',
        target: parseEventTarget(e),
        data: { options: getMouseOptions(e) },
      } as any)
    }
    function handleUpEvent(e: MouseEvent) {
      if (e.button === 0) {
        canvas.upLeft()
      } else if (e.button === 1) {
        canvas.upMiddle()
      }

      mode.sm.handleEvent({
        type: 'pointerup',
        target: parseEventTarget(e),
        data: { options: getMouseOptions(e) },
      } as any)
    }
    function handleMoveEvent(e: PointerMovement) {
      if (canvas.viewMovingInfo.value) {
        canvas.viewMove()
        return
      }

      if (!canvas.editStartPoint.value) return
      mode.sm.handleEvent({
        type: 'pointermove',
        data: {
          start: canvas.viewToCanvas(canvas.editStartPoint.value),
          current: canvas.viewToCanvas(canvas.mousePoint.value),
          ctrl: e.ctrl,
          scale: canvas.scale.value,
        },
      } as any)
    }
    function handleNativeMoveEvent(e: MouseEvent) {
      if (canvas.dragInfo.value) {
        mode.sm.handleEvent({
          type: 'pointerdrag',
          data: {
            start: canvas.viewToCanvas(canvas.dragInfo.value.downAt),
            current: canvas.viewToCanvas(canvas.mousePoint.value),
            ctrl: isCtrlOrMeta(e),
            scale: canvas.scale.value,
          },
        } as any)
      }
    }
    function handleKeydownEvent(e: KeyboardEvent) {
      mode.sm.handleEvent({
        type: 'keydown',
        data: getKeyOptions(e),
        point: canvas.viewToCanvas(canvas.mousePoint.value),
      } as any)
    }

    return {
      GraphNode,
      GraphNodeReroute,

      canvasRef,

      canvasType: graphStore.graphType,
      setGraphType: (val: any) => graphStore.setGraphType(val),
      canvasTypeOptions,

      canvas,
      handleDownEvent,
      handleUpEvent,
      handleNativeMoveEvent,
      handleKeydownEvent,

      selectedArmature,
      editedNodeMap,
      edgePositionMap,
      edgeMap,
      draftEdge,
      nodeErrorMessagesMap: graphStore.nodeErrorMessagesMap,

      draftName,
      changeGraphName,

      selectedGraphId,
      graphOptions,

      addParentGraph,
      deleteParentGraph,

      selectedNodes,
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
