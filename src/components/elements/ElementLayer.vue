<template>
  <g>
    <NativeElement
      v-for="element in elementNodeList"
      :key="getId(element)"
      :element="element"
    />
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import NativeElement from '/@/components/elements/atoms/NativeElement.vue'
import { ElementNode, getTransform, toMap } from '/@/models'
import { useCanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '/@/store/animation'
import { mapReduce } from '/@/utils/commons'

function getId(elm: ElementNode | string): string {
  if (typeof elm === 'string') return elm
  return elm.id
}

export default defineComponent({
  components: { NativeElement },
  setup() {
    const elementStore = useElementStore()
    const canvasStore = useCanvasStore()
    const animationStore = useAnimationStore()

    const canvasMode = computed(() => canvasStore.state.canvasMode)

    const elementNodeList = computed(() => {
      return elementStore.lastSelectedActor.value?.svgTree.children ?? []
    })

    const elementList = computed(() => {
      return elementStore.lastSelectedActor.value?.elements ?? []
    })

    const selectedMap = computed(() => {
      if (canvasMode.value !== 'weight') return {}
      return elementStore.selectedElements.value
    })

    const transFormMap = computed(() => {
      return mapReduce(toMap(elementList.value), (e) => {
        const born = animationStore.currentPosedBorns.value[e.bornId]
        if (born) {
          return {
            ...born.transform,
            origin: born.head,
          }
        } else {
          return getTransform()
        }
      })
    })

    function clickElement(id: string, shift: boolean) {
      if (canvasMode.value !== 'weight') return
      elementStore.selectElement(id, shift)
    }

    provide('onClickElement', clickElement)
    provide('selectedMap', selectedMap)
    provide('transFormMap', transFormMap)

    return {
      elementNodeList,
      getId,
    }
  },
})
</script>
