<template>
  <div>
    <AppCanvas
      @mousemove="mousemove"
      @complete="complete"
      @g="setEditMode('grab')"
    >
      <rect id="rect1" x="20" y="40" width="100" height="40"></rect>
      <circle id="circle1" cx="150" cy="60" r="20"></circle>
      <g>
        <Armature
          v-for="armature in armatureRoot.armatures"
          :key="armature.name"
          :armature="armature"
          :selected-state="selectedArmatures[armature.name] ?? ''"
          :edit-transforms="editTransforms[armature.name]"
          @select="(state) => selectArmature(armature.name, state)"
          @shift-select="(state) => shiftSelectArmature(armature.name, state)"
        />
      </g>
    </AppCanvas>
    <div>
      <p>EditMode: {{ editMode || "none" }}</p>
      <p>EditMovement: {{ JSON.stringify(editMovement, null, " ") }}</p>
      <pre>Selected: {{ JSON.stringify(selectedArmatures, null, " ") }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from "vue";
import AppCanvas from "./components/AppCanvas.vue";
import Armature from "./components/elements/Armature.vue";
import {
  Transform,
  ArmatureRoot,
  getTransform,
  getArmature,
  getArmatureRoot,
  ArmatureSelectedState,
  EditMode,
} from "./models/index";
import { editTransform } from "./utils/armatures";
import { IVec2, sub } from "okageo";

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

    const editMovement = ref<{ current: IVec2; start: IVec2 }>();

    const isAnySelected = computed(
      () => Object.keys(selectedArmatures.value).length > 0
    );

    const editTransforms = computed(() => {
      if (!editMovement.value) return {};

      const translate = sub(
        editMovement.value.current,
        editMovement.value.start
      );
      return Object.keys(selectedArmatures.value).reduce<{
        [name: string]: Transform[];
      }>((map, name) => {
        map[name] = [getTransform({ translate })];
        return map;
      }, {});
    });

    function completeEdit() {
      Object.keys(editTransforms.value).forEach((name) => {
        const index = armatureRoot.armatures.findIndex((a) => a.name === name);
        if (index === -1) return;
        armatureRoot.armatures[index] = editTransform(
          armatureRoot.armatures[index],
          editTransforms.value[name],
          selectedArmatures.value[name]
        );
      });
      editMovement.value = undefined;
      editMode.value = "";
    }

    return {
      armatureRoot,
      selectedArmatures,
      editMode,
      editMovement,
      editTransforms,
      mousemove(arg: { current: IVec2; start: IVec2 }) {
        if (editMode.value === "grab") {
          editMovement.value = arg;
        }
      },
      complete() {
        if (editMode.value) {
          completeEdit();
        } else {
          selectedArmatures.value = {};
        }
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
        if (isAnySelected.value) {
          editMode.value = mode;
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
