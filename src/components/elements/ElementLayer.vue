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
import { computed, defineComponent, provide, watch } from 'vue'
import { useElementStore } from '/@/store/element'
import NativeElement from '/@/components/elements/atoms/NativeElement.vue'
import { ElementNode, toMap } from '/@/models'
import { useCanvasStore } from '/@/store/canvas'
import { useAnimationStore } from '/@/store/animation'
import { useStore } from '/@/store'
import { convolutePoseTransforms } from '/@/utils/armatures'
import { TransformCache } from '/@/utils/poseResolver'

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

    const elementNodeList = computed(() => {
      return elementStore.lastSelectedActor.value?.svgTree.children ?? []
    })

    const elementMap = computed(() => {
      return toMap(elementStore.lastSelectedActor.value?.elements ?? [])
    })

    const selectedMap = computed(() => {
      if (canvasMode.value !== 'weight') return {}
      return elementStore.selectedElements.value
    })

    const boneMap = computed(() => {
      return toMap(
        (store.lastSelectedArmature.value?.bones ?? []).map((b) => {
          return {
            ...b,
            transform: convolutePoseTransforms([
              animationStore.getCurrentSelfTransforms(b.id),
              canvasStore.getEditTransforms(b.id),
            ]),
          }
        })
      )
    })

    // keep the same object without using 'ref'
    const transformCache: TransformCache = {}
    // clear cache
    watch(boneMap, () => {
      for (let k in transformCache) {
        delete transformCache[k]
      }
    })
    // provide and each elements uses the same object
    provide('transformCache', transformCache)

    function clickElement(id: string, shift: boolean) {
      if (canvasMode.value !== 'weight') return
      elementStore.selectElement(id, shift)
    }

    provide('onClickElement', clickElement)
    provide('boneMap', boneMap)
    provide('selectedMap', selectedMap)
    provide('elementMap', elementMap)

    return {
      elementNodeList,
      getId,
    }
  },
})
</script>
