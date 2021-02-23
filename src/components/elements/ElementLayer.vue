<template>
  <g>
    <NativeElement
      v-for="element in elementList"
      :key="getId(element)"
      :element="element"
    />
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import NativeElement from '/@/components/elements/atoms/NativeElement.vue'
import { ElementNode } from '/@/models'
import { useCanvasStore } from '/@/store/canvas'

function getId(elm: ElementNode | string): string {
  if (typeof elm === 'string') return elm
  return elm.id
}

export default defineComponent({
  components: { NativeElement },
  setup() {
    const elementStore = useElementStore()
    const canvasStore = useCanvasStore()

    const canvasMode = computed(() => canvasStore.state.canvasMode)

    const elementList = computed(() => {
      return elementStore.lastSelectedActor.value?.svgTree.children ?? []
    })

    const selectedMap = computed(() => {
      if (canvasMode.value !== 'weight') return {}
      return elementStore.selectedElements.value
    })

    function clickElement(id: string, shift: boolean) {
      if (canvasMode.value !== 'weight') return
      elementStore.selectElement(id, shift)
    }

    provide('onClickElement', clickElement)
    provide('selectedMap', selectedMap)

    return {
      elementList,
      getId,
    }
  },
})
</script>
