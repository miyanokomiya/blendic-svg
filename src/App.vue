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
        <Armature
          v-for="armature in armatureRoot.armatures"
          :key="armature.name"
          :armature="armature"
          :selected-state="
            armatureEditMode.state.selectedArmatures[armature.name] ?? ''
          "
          :edit-transforms="armatureEditMode.getEditTransforms(armature.name)"
          @select="(state) => selectArmature(armature.name, state)"
          @shift-select="(state) => shiftSelectArmature(armature.name, state)"
        />
      </g>
    </AppCanvas>
    <div>
      <p>Mode: {{ canvasMode }}</p>
      <p>EditMode: {{ armatureEditMode.state.editMode || "none" }}</p>
      <p>
        EditMovement:
        {{ JSON.stringify(armatureEditMode.state.editMovement, null, " ") }}
      </p>
      <pre>
Selected: {{
          JSON.stringify(armatureEditMode.state.selectedArmatures, null, " ")
        }}</pre
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from "vue";
import AppCanvas from "./components/AppCanvas.vue";
import Armature from "./components/elements/Armature.vue";
import {
  ArmatureRoot,
  getArmature,
  getArmatureRoot,
  ArmatureSelectedState,
  EditMode,
  CanvasMode,
} from "./models/index";
import { useArmatureEditMode } from "./composables/armatureEditMode";
import { IVec2 } from "okageo";

export default defineComponent({
  components: {
    AppCanvas,
    Armature,
  },
  setup() {
    const canvasMode = ref<CanvasMode>("object");
    const armatureRoot = reactive<ArmatureRoot>(
      getArmatureRoot({
        name: "1",
        armatures: [
          getArmature({
            name: "1",
            head: { x: 20, y: 200 },
            tail: { x: 220, y: 200 },
          }),
        ],
      })
    );
    const armatureEditMode = useArmatureEditMode();

    return {
      armatureRoot,
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
      selectArmature(name: string, state: ArmatureSelectedState) {
        if (canvasMode.value === "edit") {
          armatureEditMode.select(name, state);
        }
      },
      shiftSelectArmature(name: string, state: ArmatureSelectedState) {
        if (canvasMode.value === "edit") {
          armatureEditMode.shiftSelect(name, state);
        }
      },
      toggleCanvasMode() {
        if (canvasMode.value === "object") {
          canvasMode.value = "edit";
          armatureEditMode.begin(armatureRoot);
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
