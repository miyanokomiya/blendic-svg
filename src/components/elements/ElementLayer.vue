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
        v-for="node in elementRoot.children"
        :key="getId(node)"
        :element="node"
      />
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import NativeElement from '/@/components/elements/atoms/NativeElement.vue'
import { Bone, ElementNode, IdMap, toMap } from '/@/models'
import {
  getGraphResolvedElementTree,
  getPosedElementTree,
} from '/@/utils/poseResolver'
import {
  isPlainText,
  parseViewBoxFromStr,
  resolveAnimationGraph,
} from '/@/utils/elements'
import { useSettings } from '/@/composables/settings'
import type { CanvasMode, SelectOptions } from '/@/composables/modes/types'
import { useAnimationStore } from '/@/store/animation'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import { useCanvasStore } from '/@/store/canvas'
import { useStore } from '/@/store'
import { injectScale } from '/@/composables/canvas'

function getId(elm: ElementNode | string): string {
  if (isPlainText(elm)) return elm
  return elm.id
}

export default defineComponent({
  components: { NativeElement },
  props: {
    boneMap: {
      type: Object as PropType<IdMap<Bone>>,
      default: () => ({}),
    },
    canvasMode: {
      type: String as PropType<CanvasMode>,
      default: 'object',
    },
  },
  setup(props) {
    const store = useStore()
    const animationStore = useAnimationStore()
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
      if (canvasStore.state.canvasMode === 'edit') return false

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
        toMap(elementStore.lastSelectedActor.value.elements),
        elementStore.lastSelectedActor.value.svgTree
      )
    })

    const graphResolvedElement = computed(() => {
      if (!posedElementRoot.value) return
      if (!graphEnabled.value) return posedElementRoot.value

      // TODO: for develop try-catch
      try {
        const graphObjectMap = resolveAnimationGraph(
          elementStore.elementMap.value,
          {
            currentFrame: animationStore.currentFrame.value,
            endFrame: animationStore.endFrame.value,
          },
          graphStore.nodeMap.value
        )
        return getGraphResolvedElementTree(
          graphObjectMap,
          posedElementRoot.value
        )
      } catch (e) {
        console.warn(e)
        return posedElementRoot.value
      }
    })

    const viewBox = computed(() => {
      if (!graphResolvedElement.value) return

      return parseViewBoxFromStr(graphResolvedElement.value.attributes.viewBox)
    })

    function clickElement(id: string, options?: SelectOptions) {
      if (props.canvasMode !== 'weight') return
      elementStore.selectElement(id, options)
    }
    provide('onClickElement', clickElement)

    const scale = computed(injectScale())
    const viewboxStrokeWidth = computed(() => scale.value)
    const viewboxStrokeDasharray = computed(() =>
      [2, 2].map((n) => n * scale.value).join(' ')
    )

    return {
      elementRoot: graphResolvedElement,
      getId,
      viewBox,
      settings,
      viewboxStrokeWidth,
      viewboxStrokeDasharray,
    }
  },
})
</script>
