<template>
  <div>
    <AppCanvas
      @mousemove="mousemove"
      @click-any="clickAny"
      @complete="complete"
      @tab="toggleCanvasMode"
      @g="setEditMode('grab')"
      @e="setEditMode('extrude')"
    >
      <rect id="rect1" x="20" y="40" width="100" height="40"></rect>
      <circle id="circle1" cx="150" cy="60" r="20"></circle>
      <g>
        <Born
          v-for="born in armature.borns"
          :key="born.name"
          :born="born"
          :selected-state="
            armatureEditMode.state.selectedBorns[born.name] ?? ''
          "
          :edit-transforms="armatureEditMode.getEditTransforms(born.name)"
          @select="(state) => selectBorn(born.name, state)"
          @shift-select="(state) => shiftSelectBorn(born.name, state)"
        />
      </g>
    </AppCanvas>
    <div>
      <p>{{ armature.borns.length }}</p>
      <p>Mode: {{ canvasMode }}</p>
      <p>EditMode: {{ armatureEditMode.state.editMode || "none" }}</p>
      <p>
        EditMovement:
        {{ JSON.stringify(armatureEditMode.state.editMovement, null, " ") }}
      </p>
      <pre>
Selected: {{
          JSON.stringify(armatureEditMode.state.selectedBorns, null, " ")
        }}</pre
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from "vue";
import AppCanvas from "./components/AppCanvas.vue";
import Born from "./components/elements/Born.vue";
import {
  Armature,
  getBorn,
  getArmature,
  BornSelectedState,
  EditMode,
  CanvasMode,
} from "./models/index";
import { useBornEditMode } from "./composables/armatureEditMode";
import { IVec2 } from "okageo";

export default defineComponent({
  components: {
    AppCanvas,
    Born,
  },
  setup() {
    const canvasMode = ref<CanvasMode>("object");
    const armature = reactive<Armature>(
      getArmature({
        name: "1",
        borns: [
          getBorn({
            name: "1",
            head: { x: 20, y: 200 },
            tail: { x: 220, y: 200 },
          }),
        ],
      })
    );
    const armatureEditMode = useBornEditMode();

    return {
      armature,
      armatureEditMode: armatureEditMode,
      canvasMode,
      mousemove(arg: { current: IVec2; start: IVec2 }) {
        if (canvasMode.value === "edit") {
          armatureEditMode.mousemove(arg);
        }
      },
      clickAny() {
        if (canvasMode.value === "edit") {
          armatureEditMode.clickAny();
        }
      },
      complete() {
        if (canvasMode.value === "edit") {
          armatureEditMode.complete();
        }
      },
      selectBorn(name: string, state: BornSelectedState) {
        if (canvasMode.value === "edit") {
          armatureEditMode.select(name, state);
        }
      },
      shiftSelectBorn(name: string, state: BornSelectedState) {
        if (canvasMode.value === "edit") {
          armatureEditMode.shiftSelect(name, state);
        }
      },
      toggleCanvasMode() {
        if (canvasMode.value === "object") {
          canvasMode.value = "edit";
          armatureEditMode.begin(armature);
        } else {
          canvasMode.value = "object";
          armatureEditMode.end();
        }
      },
      setEditMode(mode: EditMode) {
        if (canvasMode.value === "edit") {
          armatureEditMode.setEditMode(mode);
        }
      },
    };
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
