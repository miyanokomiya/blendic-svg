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
    <NativeElement
      v-for="node in elementRoot.children"
      :key="getId(node)"
      :element="node"
    />
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import NativeElement from '/@/components/elements/atoms/NativeElement.vue'
import { Bone, CanvasMode, ElementNode, IdMap, toMap } from '/@/models'
import { getPosedElementTree } from '/@/utils/poseResolver'

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
        toMap(elementStore.lastSelectedActor.value?.elements ?? []),
        elementStore.lastSelectedActor.value.svgTree
      )
    })

    function clickElement(id: string, shift: boolean) {
      if (props.canvasMode !== 'weight') return
      elementStore.selectElement(id, shift)
    }
    provide('onClickElement', clickElement)

    return {
      elementRoot: posedElementRoot,
      getId,
    }
  },
})
</script>
