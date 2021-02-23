<template>
  <div class="file-panel">
    <h3>Element Tree</h3>
    <div v-if="treeRoot" class="tree-view">
      <TreeNode :node="treeRoot" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, provide } from 'vue'
import { useElementStore } from '/@/store/element'
import TreeNode from '/@/components/atoms/TreeNode.vue'
import { useCanvasStore } from '/@/store/canvas'

export default defineComponent({
  components: { TreeNode },
  setup() {
    const elementStore = useElementStore()
    const canvasStore = useCanvasStore()

    const targetActor = computed(() => elementStore.lastSelectedActor.value)

    const rootChildren = computed(() => {
      return targetActor.value?.elements ?? []
    })

    const treeRoot = computed(() => {
      return targetActor.value?.svgTree
    })

    const selectedMap = computed(() => {
      if (canvasStore.state.canvasMode !== 'weight') return {}
      return elementStore.selectedElements.value
    })

    function clickElement(id: string, shift: boolean) {
      if (canvasStore.state.canvasMode !== 'weight') return
      elementStore.selectElement(id, shift)
    }

    provide('onClickElement', clickElement)
    provide('selectedMap', selectedMap)

    return {
      rootChildren,
      treeRoot,
    }
  },
})
</script>

<style lang="scss" scoped>
h3 {
  margin-bottom: 10px;
  text-align: left;
}
</style>
