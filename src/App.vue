<template>
  <div>
    <AppCanvas @complete="complete" @g="setEditMode('grab')">
      <rect id="rect1" x="20" y="40" width="100" height="40"></rect>
      <circle id="circle1" cx="150" cy="60" r="20"></circle>
      <g>
        <Armature
          v-for="armature in armatureRoot.armatures"
          :key="armature.name"
          :armature="armature"
          :selected-state="selectedArmatures[armature.name] ?? ''"
          @select="(state) => selectArmature(armature.name, state)"
          @shift-select="(state) => shiftSelectArmature(armature.name, state)"
        />
      </g>
    </AppCanvas>
    <div>
      <p>EditMode: {{ editMode }}</p>
      <pre>Selected: {{ JSON.stringify(selectedArmatures, null, " ") }}</pre>
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
} from "./models/index";

export default defineComponent({
  components: {
    AppCanvas,
    Armature,
  },
  setup() {
    const selectedArmatures = ref<{
      [name: string]: ArmatureSelectedState;
    }>({});
    const editMode = ref<EditMode>("");
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

    function completeEdit() {
      editMode.value = "";
    }

    return {
      armatureRoot,
      selectedArmatures,
      editMode,
      complete() {
        completeEdit();
        selectedArmatures.value = {};
      },
      selectArmature(name: string, state: ArmatureSelectedState) {
        if (editMode.value) {
          completeEdit();
          return;
        }
        selectedArmatures.value = { [name]: state };
      },
      shiftSelectArmature(name: string, state: ArmatureSelectedState) {
        if (editMode.value) {
          completeEdit();
          return;
        }
        selectedArmatures.value[name] = state;
      },
      setEditMode(mode: EditMode) {
        editMode.value = mode;
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
