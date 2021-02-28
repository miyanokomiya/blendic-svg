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
import { computed, defineComponent, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import NativeElement from '/@/components/elements/atoms/NativeElement.vue'
import { ElementNode, toMap } from '/@/models'
import { useCanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '/@/store/animation'
import { useStore } from '/@/store'
import { convolutePoseTransforms } from '/@/utils/armatures'
import { getPosedElementTree } from '/@/utils/poseResolver'

function getId(elm: ElementNode | string): string {
  if (typeof elm === 'string') return elm
  return elm.id
}

export default defineComponent({
  components: { NativeElement },
  setup() {
    const store = useStore()
    const elementStore = useElementStore()
    const canvasStore = useCanvasStore()
    const animationStore = useAnimationStore()

    const canvasMode = computed(() => canvasStore.state.canvasMode)

    const selectedMap = computed(() => {
      if (canvasMode.value !== 'weight') return {}
      return elementStore.selectedElements.value
    })
    provide('selectedMap', selectedMap)

    const boneMap = computed(() => {
      if (!['pose', 'weight'].includes(canvasMode.value)) return {}

      const armature = store.state.armatures.find(
        (a) => a.id === elementStore.lastSelectedActor.value?.armatureId
      )
      if (!armature) return {}

      return toMap(
        armature.bones.map((b) => {
          return {
            ...b,
            transform: convolutePoseTransforms([
              animationStore.getCurrentSelfTransforms(b.id),
              canvasStore.getEditPoseTransforms(b.id),
            ]),
          }
        })
      )
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
      if (canvasMode.value !== 'weight') return
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
