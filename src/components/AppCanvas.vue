<template>
  <div>
    <svg
      ref="svg"
      tabindex="-1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      font-family="sans-serif"
      :viewBox="`0 0 ${canvasSize.width} ${canvasSize.height}`"
      :width="canvasSize.width"
      :height="canvasSize.height"
      @mouseenter="focus"
      @click.self="complete"
      @keydown.g="keyDownG"
    >
      <slot />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from "vue";

export default defineComponent({
  props: {},
  emits: ["complete", "g"],
  setup(_props, { emit }) {
    const canvasSize = reactive({ width: 600, height: 400 });
    const svg = ref<SVGElement | null>(null);

    return {
      canvasSize,
      svg,
      focus() {
        if (svg.value) svg.value.focus();
      },
      complete: () => emit("complete"),
      keyDownG: () => emit("g"),
    };
  },
});
</script>

<style lang="scss" scoped>
svg {
  border: solid 1px black;
}
</style>
