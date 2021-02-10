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
      @mousemove="mousemove"
      @click.self="complete"
      @keydown.g="keyDownG"
    >
      <slot />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from "vue";
import { getPagePosition } from "okanvas";
import { IVec2 } from "okageo";

export default defineComponent({
  props: {},
  emits: ["mousemove", "complete", "g"],
  setup(_props, { emit }) {
    const canvasSize = reactive({ width: 600, height: 400 });
    const svg = ref<SVGElement>();
    const editStartPoint = ref<IVec2>();
    const mousePoint = ref<IVec2>();

    return {
      canvasSize,
      svg,
      focus() {
        if (svg.value) svg.value.focus();
      },
      mousemove: (e: MouseEvent) => {
        mousePoint.value = getPagePosition(e);
        emit("mousemove", {
          current: mousePoint.value,
          start: editStartPoint.value,
        });
      },
      complete: () => {
        editStartPoint.value = undefined;
        emit("complete");
      },
      keyDownG: () => {
        if (!mousePoint.value) return;
        editStartPoint.value = mousePoint.value;
        emit("g");
      },
    };
  },
});
</script>

<style lang="scss" scoped>
svg {
  border: solid 1px black;
}
</style>
