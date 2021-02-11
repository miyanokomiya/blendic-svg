<template>
  <g stroke="black" :transform="transform" :opacity="opacity">
    <BornElm
      v-for="born in armature.borns"
      :key="born.name"
      :born="born"
      :selected-state="bornSelectedState"
      :parent="bornMap[born.parentKey]"
      @select="click"
      @shift-select="shiftClick"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { Armature, toMap } from "/@/models/index";
import { transform } from "/@/utils/helpers";
import BornElm from "/@/components/elements/Born.vue";

export default defineComponent({
  components: { BornElm },
  props: {
    armature: {
      type: Object as PropType<Armature>,
      required: true,
    },
    opacity: { type: Number, default: 0.8 },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["select", "shift-select"],
  setup(props, { emit }) {
    return {
      bornMap: computed(() => toMap(props.armature.borns)),
      transform: computed(() => transform(props.armature.transform)),
      bornSelectedState: computed(() =>
        props.selected ? { head: true, tail: true } : undefined
      ),
      click: () => emit("select", !props.selected),
      shiftClick: () => emit("shift-select", !props.selected),
    };
  },
});
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
