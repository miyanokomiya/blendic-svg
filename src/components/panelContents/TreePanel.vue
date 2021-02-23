<template>
  <div class="file-panel">
    <h3>Element Tree</h3>
    <div v-if="treeRoot" class="tree-view">
      <TreeNode :node="treeRoot" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useElementStore } from '/@/store/element'
import TreeNode from '/@/components/atoms/TreeNode.vue'

export default defineComponent({
  components: { TreeNode },
  setup() {
    const elementStore = useElementStore()

    const targetActor = computed(() => elementStore.lastSelectedActor.value)

    const rootChildren = computed(() => {
      return targetActor.value?.elements ?? []
    })

    const treeRoot = computed(() => {
      return targetActor.value?.svgTree
    })

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
.tree-view {
}
</style>
