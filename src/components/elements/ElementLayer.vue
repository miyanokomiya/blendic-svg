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

function getId(elm: ElementNode | string): string {
  if (typeof elm === 'string') return elm
  return elm.id
}

export default defineComponent({
  components: { NativeElement },
  setup() {
    const elementStore = useElementStore()

    const elementList = computed(() => {
      return elementStore.lastSelectedActor.value?.svgTree.children ?? []
    })

    const selectedMap = computed(() => elementStore.selectedElements.value)

    function clickElement(id: string, shift: boolean) {
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
