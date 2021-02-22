<template>
  <g>
    <!-- eslint-disable vue/no-v-html -->
    <g v-html="svgInnerHtml" />
    <!-- eslint-enable vue/no-v-html -->
  </g>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useElementStore } from '/@/store/element'

export default defineComponent({
  setup() {
    const elementStore = useElementStore()

    const svgInnerHtml = computed(() => {
      return elementStore.lastSelectedActor.value?.svgInnerHtml
    })

    return {
      svgInnerHtml,
    }
  },
})
</script>
