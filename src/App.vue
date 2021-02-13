<template>
  <div>
    <div class="main">
      <AppCanvas
        class="canvas"
        :current-command="canvasCommand"
        @mousemove="mousemove"
        @click-any="clickAny"
        @click-empty="clickEmpty"
        @tab="toggleCanvasMode"
        @g="setEditMode('grab')"
        @s="setEditMode('scale')"
        @r="setEditMode('rotate')"
        @e="setEditMode('extrude')"
        @x="execDelete"
        @shift-a="addItem"
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
          <ArmatureElm
            v-for="armature in otherArmatures"
            :key="armature.id"
            :armature="armature"
            :opacity="0.3"
          />
          <BornElm
            v-for="born in editBornMap"
            :key="born.id"
            :born="born"
            :parent="editBornMap[born.parentId]"
            :selected-state="selectedBorns[born.id]"
            @select="(state) => selectBorn(born.id, state)"
            @shift-select="(state) => shiftSelectBorn(born.id, state)"
          />
        </g>
      </AppCanvas>
      <SidePanel class="side-panel" />
    </div>
    <div>
      <p>Mode: {{ canvasMode }}</p>
      <p>EditMode: {{ armatureEditMode.state.editMode || 'none' }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import AppCanvas from './components/AppCanvas.vue'
import SidePanel from './components/SidePanel.vue'
import ArmatureElm from './components/elements/ArmatureElm.vue'
import BornElm from './components/elements/Born.vue'
import {
  BornSelectedState,
  EditMode,
  CanvasMode,
  toMap,
  editModeToCanvasCommand,
} from './models/index'
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

    const lastSelectedArmature = computed(
      () => store.lastSelectedArmature.value
    )
    const otherArmatures = computed(() =>
      store.state.armatures.filter(
        (a) => a.id !== store.state.lastSelectedArmatureId
      )
    )

    const editBornMap = computed(() =>
      lastSelectedArmature.value
        ? toMap(
            lastSelectedArmature.value.borns.map((b) =>
              editTransform(
                b,
                armatureEditMode.getEditTransforms(b.id),
                store.state.selectedBorns[b.id] || []
              )
            )
          )
        : {}
    )

    const canvasCommand = computed(() =>
      editModeToCanvasCommand(armatureEditMode.state.editMode)
    )

    return {
      armatures: computed(() => store.state.armatures),
      otherArmatures,
      lastSelectedArmatureId: computed(
        () => store.state.lastSelectedArmatureId
      ),
      editBornMap,
      selectedBorns: computed(() => store.state.selectedBorns),
      armatureEditMode,
      canvasMode,
      canvasCommand,
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
        armatureEditMode.select(id, state)
      },
      shiftSelectBorn(id: string, state: BornSelectedState) {
        armatureEditMode.shiftSelect(id, state)
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
      execDelete() {
        if (canvasMode.value === 'object') {
          store.deleteArmature()
        } else if (armatureEditMode.state.editMode === '') {
          store.deleteBorn()
        }
      },
      addItem() {
        if (canvasMode.value === 'object') {
          store.addArmature()
        } else if (armatureEditMode.state.editMode === '') {
          store.addBorn()
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
