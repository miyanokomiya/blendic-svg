<template>
  <g
    :id="armature.name"
    stroke="black"
    :fill="fill"
    :transform="transform"
    :opacity="opacity"
  >
    <path
      :d="d"
      @click.exact="click('all')"
      @click.shift.exact="shiftClick('all')"
    />
    <circle
      r="10"
      :cx="armature.head.x"
      :cy="armature.head.y"
      :fill="fillHead"
      @click.exact="click('head')"
      @click.shift.exact="shiftClick('head')"
    ></circle>
    <circle
      r="10"
      :cx="armature.tail.x"
      :cy="armature.tail.y"
      :fill="fillTail"
      @click.exact="click('tail')"
      @click.shift.exact="shiftClick('tail')"
    ></circle>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { Armature, ArmatureSelectedState } from "../../models/index";
import { transform, d } from "../../utils/helpers";
import { IVec2, add, sub, multi, rotate } from "okageo";
import { useSettings } from "../../composables/settings";

function d1(head: IVec2, tail: IVec2, invert = false): IVec2 {
  return add(
    head,
    rotate(multi(sub(tail, head), 0.3), (Math.PI / 6) * (invert ? -1 : 1))
  );
}

export default defineComponent({
  props: {
    armature: {
      type: Object as PropType<Armature>,
      required: true,
    },
    opacity: { type: Number, default: 0.5 },
    selectedState: {
      type: String as PropType<ArmatureSelectedState>,
      default: "",
    },
  },
  emits: ["select", "shift-select"],
  setup(props, { emit }) {
    const { settings } = useSettings();

    return {
      transform: computed(() => transform(props.armature.transform)),
      d: computed(() =>
        d(
          [
            props.armature.head,
            d1(props.armature.head, props.armature.tail),
            props.armature.tail,
            d1(props.armature.head, props.armature.tail, true),
          ],
          true
        )
      ),
      fill: computed(() =>
        props.selectedState === "all" ? settings.selectedColor : "#aaa"
      ),
      fillHead: computed(() =>
        props.selectedState === "head" ? settings.selectedColor : ""
      ),
      fillTail: computed(() =>
        props.selectedState === "tail" ? settings.selectedColor : ""
      ),
      click: (state: ArmatureSelectedState) => emit("select", state),
      shiftClick: (state: ArmatureSelectedState) => {
        if (state === "head") {
          if (props.selectedState === "head") emit("shift-select", "");
          else if (props.selectedState === "tail") emit("shift-select", "all");
          else if (props.selectedState === "all") emit("shift-select", "tail");
          else emit("shift-select", "head");
        } else if (state === "tail") {
          if (props.selectedState === "tail") emit("shift-select", "");
          else if (props.selectedState === "head") emit("shift-select", "all");
          else if (props.selectedState === "all") emit("shift-select", "head");
          else emit("shift-select", "tail");
        } else {
          if (props.selectedState === "all") emit("shift-select", "");
          else emit("shift-select", "all");
        }
      },
    };
  },
});
</script>

<style lang="scss" scoped>
path {
  cursor: pointer;
}
circle {
  cursor: pointer;
}
</style>
