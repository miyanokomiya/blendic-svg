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
      stroke-dasharray="2 2"
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
import { getPosedElementTree } from '/@/utils/poseResolver'
import { parseViewBoxFromStr } from '/@/utils/elements'
import { useSettings } from '/@/composables/settings'
import type { CanvasMode, SelectOptions } from '/@/composables/modes/types'

function getId(elm: ElementNode | string): string {
  if (typeof elm === 'string') return elm
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
    const elementStore = useElementStore()
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

    const posedElementRoot = computed(() => {
      if (!elementStore.lastSelectedActor.value) return
      return getPosedElementTree(
        boneMap.value,
        toMap(elementStore.lastSelectedActor.value.elements),
        elementStore.lastSelectedActor.value.svgTree
      )
    })

    const viewBox = computed(() => {
      if (!posedElementRoot.value) return

      return parseViewBoxFromStr(posedElementRoot.value.attributes.viewBox)
    })

    function clickElement(id: string, options?: SelectOptions) {
      if (props.canvasMode !== 'weight') return
      elementStore.selectElement(id, options)
    }
    provide('onClickElement', clickElement)

    return {
      elementRoot: posedElementRoot,
      getId,
      viewBox,
      settings,
    }
  },
})
</script>
