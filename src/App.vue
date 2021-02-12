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
            :key="armature.id"
            :armature="armature"
            :selected="lastSelectedArmatureId === armature.id"
            @select="(selected) => selectArmature(armature.id, selected)"
            @shift-select="
              (selected) => shiftSelectArmature(armature.id, selected)
            "
          />
        </g>
        <g v-if="canvasMode === 'edit'">
          <BornElm
            v-for="born in editBornMap"
            :key="born.id"
            :born="born"
            :parent="editBornMap[born.parentId]"
            :selected-state="armatureEditMode.state.selectedBorns[born.id]"
            @select="(state) => selectBorn(born.id, state)"
            @shift-select="(state) => shiftSelectBorn(born.id, state)"
          />
        </g>
      </AppCanvas>
      <SidePanel class="side-panel" :armature="armature" />
    </div>
    <div>
      <p>{{ armature.borns.length }}</p>
      <p>Mode: {{ canvasMode }}</p>
      <p>EditMode: {{ armatureEditMode.state.editMode || 'none' }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import AppCanvas from './components/AppCanvas.vue'
import SidePanel from './components/SidePanel.vue'
import ArmatureElm from './components/elements/ArmatureElm.vue'
import BornElm from './components/elements/Born.vue'
import { BornSelectedState, EditMode, CanvasMode, toMap } from './models/index'
import { useBornEditMode } from './composables/armatureEditMode'
import { editTransform } from './utils/armatures'
import { IVec2 } from 'okageo'
import { useStore } from '/@/store/index'

export default defineComponent({
  components: {
    AppCanvas,
    ArmatureElm,
    BornElm,
    SidePanel,
  },
  setup() {
    const canvasMode = ref<CanvasMode>('object')
    const store = useStore()
    const armatureEditMode = useBornEditMode()
    const armature = computed(() => store.state.armatures[0])

    const editBornMap = computed(() =>
      toMap(
        armature.value.borns.map((b) =>
          editTransform(
            b,
            armatureEditMode.getEditTransforms(b.id),
            armatureEditMode.state.selectedBorns[b.id] || []
          )
        )
      )
    )

    watch(
      () => armatureEditMode.state.lastSelectedBornId,
      (to) => store.selectBorn(to)
    )

    return {
      armatures: computed(() => store.state.armatures),
      lastSelectedArmatureId: computed(
        () => store.state.lastSelectedArmatureId
      ),
      armature,
      editBornMap,
      armatureEditMode,
      canvasMode,
      mousemove(arg: { current: IVec2; start: IVec2 }) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.mousemove(arg)
        }
      },
      clickAny() {
        if (canvasMode.value === 'edit') {
          armatureEditMode.clickAny()
        }
      },
      clickEmpty() {
        if (canvasMode.value === 'edit') {
          armatureEditMode.clickEmpty()
        } else {
          store.selectArmature()
        }
      },
      selectBorn(id: string, state: BornSelectedState) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.select(id, state)
        } else {
          store.selectArmature(armature.value.id)
        }
      },
      shiftSelectBorn(id: string, state: BornSelectedState) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.shiftSelect(id, state)
        } else {
          store.selectArmature(armature.value.id)
        }
      },
      selectArmature(id: string, selected: boolean) {
        store.selectArmature(selected ? id : '')
      },
      shiftSelectArmature(id: string, selected: boolean) {
        store.selectArmature(selected ? id : '')
      },
      toggleCanvasMode() {
        if (canvasMode.value === 'object' && store.lastSelectedArmature.value) {
          canvasMode.value = 'edit'
          armatureEditMode.begin(store.lastSelectedArmature.value)
        } else {
          canvasMode.value = 'object'
          armatureEditMode.end()
        }
      },
      setEditMode(mode: EditMode) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.setEditMode(mode)
        }
      },
    }
  },
})
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
