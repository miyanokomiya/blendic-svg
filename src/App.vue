<template>
  <div>
    <div class="main">
      <AppCanvas
        :current-command="canvasCommand"
        class="canvas"
        @mousemove="mousemove"
        @click-any="clickAny"
        @click-empty="clickEmpty"
        @escape="escape"
        @tab="toggleCanvasMode"
        @ctrl-tab="ctrlToggleCanvasMode"
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
        <g v-if="canvasMode === 'pose'">
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
            pose-mode
            @select="(state) => selectBorn(born.id, state)"
            @shift-select="(state) => shiftSelectBorn(born.id, state)"
          />
        </g>
      </AppCanvas>
      <SidePanel class="side-panel" />
    </div>
    <div class="bottom">
      <AnimationPanel />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, onUnmounted } from 'vue'
import AppCanvas from './components/AppCanvas.vue'
import SidePanel from './components/SidePanel.vue'
import AnimationPanel from './components/AnimationPanel.vue'
import ArmatureElm from './components/elements/ArmatureElm.vue'
import BornElm from './components/elements/Born.vue'
import {
  BornSelectedState,
  EditMode,
  editModeToCanvasCommand,
  toMap,
} from './models/index'
import { useBornEditMode } from './composables/armatureEditMode'
import { editTransform } from './utils/armatures'
import { IVec2 } from 'okageo'
import { useStore } from '/@/store/index'
import { useCanvasStore } from './store/canvas'
import { useHistoryStore } from './store/history'
import { useBornPoseMode } from './composables/armaturePoseMode'

export default defineComponent({
  components: {
    AppCanvas,
    ArmatureElm,
    BornElm,
    SidePanel,
    AnimationPanel,
  },
  setup() {
    const store = useStore()
    const canvasStore = useCanvasStore()
    const armatureEditMode = useBornEditMode()
    const armaturePoseMode = useBornPoseMode()
    const historyStore = useHistoryStore()

    const canvasMode = computed(() => canvasStore.state.canvasMode)

    const lastSelectedArmature = computed(
      () => store.lastSelectedArmature.value
    )
    const otherArmatures = computed(() =>
      store.state.armatures.filter(
        (a) => a.id !== store.lastSelectedArmature.value?.id
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

    const canvasCommand = computed(() => {
      if (canvasMode.value === 'edit') {
        return editModeToCanvasCommand(armatureEditMode.state.editMode)
      } else if (canvasMode.value === 'pose') {
        return editModeToCanvasCommand(armaturePoseMode.state.editMode)
      } else {
        return ''
      }
    })

    function onGlobalKeyDown(e: KeyboardEvent) {
      if (
        ['input', 'textarea'].includes(
          (e.target as Element)?.tagName.toLowerCase()
        )
      )
        return

      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          historyStore.redo()
        } else {
          historyStore.undo()
        }
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', onGlobalKeyDown)
    })
    onUnmounted(() => {
      document.removeEventListener('keydown', onGlobalKeyDown)
    })

    return {
      armatures: computed(() => store.state.armatures),
      otherArmatures,
      lastSelectedArmatureId: computed(
        () => store.lastSelectedArmature.value?.id
      ),
      editBornMap,
      selectedBorns: computed(() => store.state.selectedBorns),
      armatureEditMode,
      canvasMode,
      canvasCommand,
      mousemove(arg: { current: IVec2; start: IVec2 }) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.mousemove(arg)
        } else if (canvasMode.value === 'pose') {
          armaturePoseMode.mousemove(arg)
        }
      },
      clickAny() {
        if (canvasMode.value === 'edit') {
          armatureEditMode.clickAny()
        } else if (canvasMode.value === 'pose') {
          armaturePoseMode.clickAny()
        }
      },
      clickEmpty() {
        if (canvasMode.value === 'object') {
          store.selectArmature()
        } else if (canvasMode.value === 'edit') {
          armatureEditMode.clickEmpty()
        } else if (canvasMode.value === 'pose') {
          armaturePoseMode.clickEmpty()
        }
      },
      selectBorn(id: string, state: BornSelectedState) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.select(id, state)
        } else if (canvasMode.value === 'pose') {
          armaturePoseMode.select(id, state)
        }
      },
      shiftSelectBorn(id: string, state: BornSelectedState) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.shiftSelect(id, state)
        } else if (canvasMode.value === 'pose') {
          armaturePoseMode.shiftSelect(id, state)
        }
      },
      selectArmature(id: string, selected: boolean) {
        store.selectArmature(selected ? id : '')
      },
      shiftSelectArmature(id: string, selected: boolean) {
        store.selectArmature(selected ? id : '')
      },
      escape() {
        if (canvasMode.value === 'edit') {
          armatureEditMode.cancel()
        } else if (canvasMode.value === 'pose') {
          armaturePoseMode.cancel()
        }
      },
      toggleCanvasMode() {
        if (!store.lastSelectedArmature.value) return

        if (canvasMode.value !== 'edit') {
          armatureEditMode.end()
          armaturePoseMode.end()
          canvasStore.setCanvasMode('edit')
          armatureEditMode.begin(store.lastSelectedArmature.value)
        } else {
          armatureEditMode.end()
          canvasStore.toggleCanvasMode()
        }
      },
      ctrlToggleCanvasMode() {
        if (!store.lastSelectedArmature.value) return

        if (canvasMode.value === 'object') {
          canvasStore.setCanvasMode('pose')
          armaturePoseMode.begin(store.lastSelectedArmature.value)
        } else {
          armatureEditMode.end()
          armaturePoseMode.end()
          canvasStore.ctrlToggleCanvasMode()
        }
      },
      setEditMode(mode: EditMode) {
        if (canvasMode.value === 'edit') {
          armatureEditMode.setEditMode(mode)
        } else if (canvasMode.value === 'pose') {
          armaturePoseMode.setEditMode(mode)
        }
      },
      execDelete() {
        if (canvasMode.value === 'object') {
          store.deleteArmature()
        } else if (canvasMode.value === 'edit') {
          if (armatureEditMode.state.editMode === '') {
            store.deleteBorn()
          }
        }
      },
      addItem() {
        if (canvasMode.value === 'object') {
          store.addArmature()
        } else if (canvasMode.value === 'edit') {
          if (armatureEditMode.state.editMode === '') {
            store.addBorn()
          }
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
}
input[type='text'] {
  padding: 2px 4px;
  border: solid 1px #000;
}
input[type='number'] {
  padding: 2px 0 2px 4px;
  border: solid 1px #000;
}
</style>

<style lang="scss" scoped>
.main {
  margin: 10px 0;
  padding: 0 10px;
  min-height: 400px;
  height: calc(100vh - 330px);
  display: flex;
  justify-content: center;
  align-items: stretch;
  .canvas {
    margin-right: auto;
    width: calc(100% - 210px);
  }
  .side-panel {
    width: 200px;
    flex-shrink: 0;
  }
}
.bottom {
  padding: 0 10px;
  height: 300px;
}
</style>
