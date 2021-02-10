<template>
  <g
    :id="editedArmature.name"
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
      :cx="head.x"
      :cy="head.y"
      :fill="fillHead"
      @click.exact="click('head')"
      @click.shift.exact="shiftClick('head')"
    ></circle>
    <circle
      r="10"
      :cx="tail.x"
      :cy="tail.y"
      :fill="fillTail"
      @click.exact="click('tail')"
      @click.shift.exact="shiftClick('tail')"
    ></circle>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { Transform, Armature, ArmatureSelectedState } from "../../models/index";
import { transform, d } from "../../utils/helpers";
import { editTransform } from "../../utils/armatures";
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
    editTransforms: {
      type: Object as PropType<Transform[]>,
      default: () => [],
    },
  },
  emits: ["select", "shift-select"],
  setup(props, { emit }) {
    const { settings } = useSettings();

    const editedArmature = computed(() =>
      editTransform(props.armature, props.editTransforms, props.selectedState)
    );
    const head = computed(() => editedArmature.value.head);
    const tail = computed(() => editedArmature.value.tail);

    return {
      editedArmature,
      transform: computed(() => transform(editedArmature.value.transform)),
      head,
      tail,
      d: computed(() =>
        d(
          [
            head.value,
            d1(head.value, tail.value),
            tail.value,
            d1(head.value, tail.value, true),
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
