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
  <g v-if="elementRoot">
    <rect
      v-if="viewBox && settings.showViewbox"
      :x="viewBox.x"
      :y="viewBox.y"
      :width="viewBox.width"
      :height="viewBox.height"
      fill="none"
      stroke="#777"
      :stroke-width="viewboxStrokeWidth"
      :stroke-dasharray="viewboxStrokeDasharray"
    ></rect>
    <g :id="elementRoot.id">
      <NativeElement
        v-for="node in elemntChildren"
        :key="node.id"
        :element="node"
      />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import { Bone, ElementNode, IdMap } from '/@/models'
import {
  getGraphResolvedElementTree,
  getPosedElementTree,
} from '/@/utils/poseResolver'
import { parseViewBoxFromStr } from '/@/utils/elements'
import { useSettings } from '/@/composables/settings'
import type { CanvasMode } from '/@/composables/modes/types'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import { useCanvasStore } from '/@/store/canvas'
import { useStore } from '/@/store'
import { injectScale } from '/@/composables/canvas'
</script>

<script lang="ts" setup>
import NativeElement from '/@/components/elements/atoms/NativeElement.vue'
import { isPlainText } from '/@/utils/elements'

const props = withDefaults(
  defineProps<{
    boneMap?: IdMap<Bone>
    canvasMode?: CanvasMode
  }>(),
  {
    boneMap: () => ({}),
    canvasMode: 'object',
  }
)

const store = useStore()
const graphStore = useAnimationGraphStore()
const elementStore = useElementStore()
const canvasStore = useCanvasStore()
const { settings } = useSettings()

const selectedMap = computed(() => {
  if (props.canvasMode !== 'weight') return {}
  return elementStore.selectedElements.value
})
provide('selectedMap', selectedMap)

const boneMap = computed(() => {
  if (!['pose', 'weight'].includes(props.canvasMode)) return {}

  return props.boneMap
})

const graphEnabled = computed(() => {
  if (!store.lastSelectedArmature.value) return false
  if (!elementStore.lastSelectedActor.value) return false
  if (!graphStore.lastSelectedGraph.value) return false
  if (canvasStore.canvasMode.value === 'edit') return false

  const id = store.lastSelectedArmature.value.id
  return (
    id === elementStore.lastSelectedActor.value.armatureId &&
    id === graphStore.lastSelectedGraph.value.armatureId
  )
})

const posedElementRoot = computed(() => {
  if (!elementStore.lastSelectedActor.value) return
  return getPosedElementTree(
    boneMap.value,
    elementStore.elementMap.value,
    elementStore.lastSelectedActor.value.svgTree
  )
})

const graphResolvedElement = computed(() => {
  if (
    !posedElementRoot.value ||
    !graphEnabled.value ||
    !graphStore.resolvedGraph.value
  )
    return posedElementRoot.value

  // TODO: try-catch is just for debug
  try {
    const graphObjectMap = graphStore.resolvedGraph.value.context.getObjectMap()
    return getGraphResolvedElementTree(graphObjectMap, posedElementRoot.value)
  } catch (e) {
    console.warn(e)
    return posedElementRoot.value
  }
})

const viewBox = computed(() => {
  if (!graphResolvedElement.value) return

  return parseViewBoxFromStr(graphResolvedElement.value.attributes.viewBox)
})

const scale = computed(injectScale())
const viewboxStrokeWidth = computed(() => scale.value)
const viewboxStrokeDasharray = computed(() =>
  [2, 2].map((n) => n * scale.value).join(' ')
)

const elementRoot = graphResolvedElement
// Plain text shouldn't exist right under the SVG root
const elemntChildren = computed(
  () =>
    elementRoot.value?.children.filter((c) => !isPlainText(c)) as ElementNode[]
)
</script>
