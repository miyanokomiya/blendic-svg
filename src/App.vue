<template>
  <div>
    <div class="main">
      <AppCanvas
        class="canvas"
        @mousemove="mousemove"
        @click-any="clickAny"
        @click-empty="clickEmpty"
        @tab="toggleCanvasMode"
        @g="setEditMode('grab')"
        @e="setEditMode('extrude')"
      >
        <g v-if="canvasMode === 'object'">
          <ArmatureElm
            v-for="armature in armatures"
            :key="armature.name"
            :armature="armature"
            :selected="lastSelectedArmatureName === armature.name"
            @select="(selected) => selectArmature(armature.name, selected)"
            @shift-select="
              (selected) => shiftSelectArmature(armature.name, selected)
            "
          />
        </g>
        <g v-if="canvasMode === 'edit'">
          <BornElm
            v-for="born in editBornMap"
            :key="born.name"
            :born="born"
            :parent="editBornMap[born.parentKey]"
            :selected-state="armatureEditMode.state.selectedBorns[born.name]"
            @select="(state) => selectBorn(born.name, state)"
            @shift-select="(state) => shiftSelectBorn(born.name, state)"
          />
        </g>
      </AppCanvas>
      <SidePanel
        class="side-panel"
        :armature="armature"
        :last-selected-born-name="armatureEditMode.state.lastSelectedBornName"
      />
    </div>
    <div>
      <p>{{ armature.borns.length }}</p>
      <p>Mode: {{ canvasMode }}</p>
      <p>EditMode: {{ armatureEditMode.state.editMode || "none" }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";
import AppCanvas from "./components/AppCanvas.vue";
import SidePanel from "./components/SidePanel.vue";
import ArmatureElm from "./components/elements/ArmatureElm.vue";
import BornElm from "./components/elements/Born.vue";
import {
  Born,
  BornSelectedState,
  EditMode,
  CanvasMode,
  toMap,
} from "./models/index";
import { useBornEditMode } from "./composables/armatureEditMode";
import { editTransform } from "./utils/armatures";
import { IVec2 } from "okageo";
import { useStore } from "/@/store/index";

export default defineComponent({
  components: {
    AppCanvas,
    ArmatureElm,
    BornElm,
    SidePanel,
  },
  setup() {
    const canvasMode = ref<CanvasMode>("object");
    const store = useStore();
    const armatureEditMode = useBornEditMode();
    const armature = computed(() => store.state.armatures[0]);

    const editBornMap = computed(() =>
      toMap(
        armature.value.borns.map((b) =>
          editTransform(
            b,
            armatureEditMode.getEditTransforms(b.name),
            armatureEditMode.state.selectedBorns[b.name] || []
          )
        )
      )
    );

    watch(
      () => armatureEditMode.state.lastSelectedBornName,
      (to) => store.selectBorn(to)
    );

    return {
      armatures: computed(() => store.state.armatures),
      lastSelectedArmatureName: computed(
        () => store.state.lastSelectedArmatureName
      ),
      armature,
      editBornMap,
      armatureEditMode,
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
      clickEmpty() {
        if (canvasMode.value === "edit") {
          armatureEditMode.clickEmpty();
        } else {
          store.selectArmature();
        }
      },
      selectBorn(name: string, state: BornSelectedState) {
        if (canvasMode.value === "edit") {
          armatureEditMode.select(name, state);
        } else {
          store.selectArmature(armature.value.name);
        }
      },
      shiftSelectBorn(name: string, state: BornSelectedState) {
        if (canvasMode.value === "edit") {
          armatureEditMode.shiftSelect(name, state);
        } else {
          store.selectArmature(armature.value.name);
        }
      },
      selectArmature(name: string, selected: boolean) {
        store.selectArmature(selected ? name : "");
      },
      shiftSelectArmature(name: string, selected: boolean) {
        store.selectArmature(selected ? name : "");
      },
      toggleCanvasMode() {
        if (canvasMode.value === "object" && store.lastSelectedArmature.value) {
          canvasMode.value = "edit";
          armatureEditMode.begin(store.lastSelectedArmature.value);
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

<style lang="scss" scoped>
.main {
  display: flex;
  justify-content: center;
  .canvas {
    width: calc(100% - 200px);
  }
  .side-panel {
    width: 200px;
    flex-shrink: 0;
  }
}
</style>
