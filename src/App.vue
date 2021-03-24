<!--
This file is part of Blendic SVG.

Blendic SVG is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Blendic SVG is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Blendic SVG.  If not, see <https://www.gnu.org/licenses/>.

Copyright (C) 2021, Tomoya Komiyama.
-->

<template>
  <ResizableV :initial-rate="0.7" class="app-root">
    <template #top>
      <ResizableH :initial-rate="0.8" class="top">
        <template #left>
          <div class="main">
            <AppCanvas
              :original-view-box="viewBox"
              :current-command="canvasCommand"
              class="canvas"
              @change-mode="changeMode"
              @escape="escape"
              @tab="toggleCanvasMode"
              @ctrl-tab="ctrlToggleCanvasMode"
              @g="setEditMode('grab')"
              @s="setEditMode('scale')"
              @r="setEditMode('rotate')"
              @e="setEditMode('extrude')"
              @x="execDelete"
              @a="selectAll"
              @shift-a="addItem"
              @i="saveKeyframe"
              @ctrl-c="clip"
              @ctrl-v="paste"
              @shift-d="duplicate"
            >
              <template #default="{ scale }">
                <ElementLayer
                  :bone-map="posedMap"
                  :canvas-mode="canvasMode"
                  :class="{ 'view-only': canvasMode !== 'weight' }"
                />
                <g v-if="canvasMode === 'object'">
                  <ArmatureElm
                    v-for="armature in armatures"
                    :key="armature.id"
                    :armature="armature"
                    :selected="lastSelectedArmatureId === armature.id"
                    :scale="scale"
                    @select="
                      (selected) => selectArmature(armature.id, selected)
                    "
                    @shift-select="
                      (selected) => shiftSelectArmature(armature.id, selected)
                    "
                  />
                </g>
                <g v-else>
                  <ArmatureElm
                    v-for="armature in otherArmatures"
                    :key="armature.id"
                    :armature="armature"
                    :opacity="0.3"
                    :scale="scale"
                    class="view-only"
                  />
                  <BoneLayer
                    :scale="scale"
                    :bone-map="visibledBoneMap"
                    :selected-bones="selectedBones"
                    :canvas-mode="canvasMode"
                    @select="selectBone"
                    @shift-select="shiftSelectBone"
                  />
                </g>
              </template>
            </AppCanvas>
            <SideBar class="side-bar" />
          </div>
        </template>
        <template #right>
          <SidePanel class="side-panel" />
        </template>
      </ResizableH>
    </template>
    <template #bottom>
      <div class="bottom">
        <AnimationPanel />
      </div>
    </template>
  </ResizableV>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, onUnmounted } from 'vue'
import AppCanvas from './components/AppCanvas.vue'
import SidePanel from './components/SidePanel.vue'
import AnimationPanel from './components/AnimationPanel.vue'
import ElementLayer from './components/elements/ElementLayer.vue'
import ArmatureElm from './components/elements/ArmatureElm.vue'
import SideBar from '/@/components/SideBar.vue'
import BoneLayer from '/@/components/elements/BoneLayer.vue'
import {
  Bone,
  CanvasMode,
  EditMode,
  editModeToCanvasCommand,
  IdMap,
  toMap,
} from './models/index'
import {
  convolutePoseTransforms,
  editTransform,
  getTransformedBoneMap,
  posedTransform,
} from './utils/armatures'
import { useStore } from '/@/store/index'
import { useCanvasStore } from './store/canvas'
import { useHistoryStore } from './store/history'
import { useAnimationStore } from './store/animation'
import { useStrage } from './composables/strage'
import { useElementStore } from './store/element'
import { isCtrlOrMeta } from '/@/utils/devices'
import ResizableV from '/@/components/atoms/ResizableV.vue'
import ResizableH from '/@/components/atoms/ResizableH.vue'

export default defineComponent({
  components: {
    AppCanvas,
    ArmatureElm,
    SidePanel,
    AnimationPanel,
    SideBar,
    ElementLayer,
    BoneLayer,
    ResizableV,
    ResizableH,
  },
  setup() {
    const store = useStore()
    const canvasStore = useCanvasStore()
    const animationStore = useAnimationStore()
    const historyStore = useHistoryStore()
    const elementStore = useElementStore()

    const viewBox = computed(() => {
      return (
        elementStore.lastSelectedActor.value?.viewBox ?? {
          x: 0,
          y: 0,
          width: 400,
          height: 400,
        }
      )
    })

    const canvasMode = computed(() => canvasStore.state.canvasMode)

    const lastSelectedArmature = computed(
      () => store.lastSelectedArmature.value
    )
    const otherArmatures = computed(() =>
      store.state.armatures.filter(
        (a) => a.id !== store.lastSelectedArmature.value?.id
      )
    )

    const posedMap = computed(() => {
      if (!lastSelectedArmature.value) return {}

      if (canvasStore.command.value) {
        return getTransformedBoneMap(
          toMap(
            lastSelectedArmature.value.bones.map((b) => {
              return {
                ...b,
                transform: convolutePoseTransforms([
                  animationStore.getCurrentSelfTransforms(b.id),
                  canvasStore.getEditTransforms(b.id),
                ]),
              }
            })
          )
        )
      } else {
        return animationStore.currentPosedBones.value
      }
    })

    const visibledBoneMap = computed(() => {
      if (!lastSelectedArmature.value) return {}
      if (canvasMode.value === 'edit') {
        return toMap(
          lastSelectedArmature.value.bones.map((b) => {
            return editTransform(
              b,
              canvasStore.getEditTransforms(b.id),
              store.state.selectedBones[b.id] || {}
            )
          })
        )
      } else {
        return Object.keys(posedMap.value).reduce<IdMap<Bone>>((p, id) => {
          const b = posedMap.value[id]
          p[id] = posedTransform(b, [b.transform])
          return p
        }, {})
      }
    })

    const canvasCommand = computed(() => {
      return editModeToCanvasCommand(canvasStore.command.value)
    })

    function onGlobalKeyDown(e: KeyboardEvent) {
      if (
        ['input', 'textarea'].includes(
          (e.target as Element)?.tagName.toLowerCase()
        )
      )
        return

      if (isCtrlOrMeta(e) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          historyStore.redo()
        } else {
          historyStore.undo()
        }
      } else if (e.key.toLowerCase() === ' ') {
        e.preventDefault()
        animationStore.togglePlaying()
      } else if (isCtrlOrMeta(e) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        const strage = useStrage()
        strage.saveProjectFile()
      } else if (isCtrlOrMeta(e) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        if (e.shiftKey) {
          const strage = useStrage()
          strage.loadSvgFile()
        } else {
          const strage = useStrage()
          strage.loadProjectFile()
        }
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', onGlobalKeyDown)
    })
    onUnmounted(() => {
      document.removeEventListener('keydown', onGlobalKeyDown)
    })

    const selectedBones = computed(() => {
      if (canvasMode.value === 'weight') {
        // hilight parent bone for weight paiting
        const selectedElement = elementStore.lastSelectedElement.value
        if (selectedElement?.boneId) {
          return { [selectedElement.boneId]: { head: true, tail: true } }
        } else {
          return {}
        }
      } else {
        return store.state.selectedBones
      }
    })

    return {
      viewBox,
      armatures: computed(() => store.state.armatures),
      otherArmatures,
      lastSelectedArmatureId: computed(
        () => store.lastSelectedArmature.value?.id
      ),
      posedMap,
      visibledBoneMap,
      selectedBones,
      canvasMode,
      canvasCommand,
      selectBone(id: string, state: { [key: string]: boolean }) {
        canvasStore.select(id, state)
      },
      shiftSelectBone(id: string, state: { [key: string]: boolean }) {
        canvasStore.shiftSelect(id, state)
      },
      selectArmature(id: string, selected: boolean) {
        store.selectArmature(selected ? id : '')
      },
      shiftSelectArmature(id: string, selected: boolean) {
        store.selectArmature(selected ? id : '')
      },
      escape() {
        canvasStore.cancel()
      },
      toggleCanvasMode() {
        if (!store.lastSelectedArmature.value) return
        canvasStore.toggleCanvasMode()
      },
      ctrlToggleCanvasMode() {
        if (!store.lastSelectedArmature.value) return
        canvasStore.ctrlToggleCanvasMode()
      },
      changeMode(canvasMode: CanvasMode) {
        if (canvasMode === 'weight') {
          if (elementStore.lastSelectedActor.value) {
            canvasStore.setCanvasMode(canvasMode)
          }
        } else {
          if (store.lastSelectedArmature.value) {
            canvasStore.setCanvasMode(canvasMode)
          } else {
            canvasStore.setCanvasMode('object')
          }
        }
      },
      setEditMode(mode: EditMode) {
        canvasStore.setEditMode(mode)
      },
      execDelete() {
        canvasStore.execDelete()
      },
      selectAll() {
        canvasStore.selectAll()
      },
      addItem() {
        canvasStore.execAdd()
      },
      saveKeyframe() {
        canvasStore.insert()
      },
      clip: canvasStore.clip,
      paste: canvasStore.paste,
      duplicate: canvasStore.duplicate,
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
input {
  max-width: 100%;
}
input:disabled {
  opacity: 0.5;
  cursor: default;
}
input[type='text'] {
  padding: 2px 4px;
  border: solid 1px #777;
}
input[type='number'] {
  padding: 2px 0 2px 4px;
  border: solid 1px #777;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>

<style lang="scss" scoped>
$wide-panel-width: 240px;

.app-root {
  height: 100vh;
}
.top {
  height: 100%;
}
.main {
  height: 100%;
  display: flex;
  .canvas {
    width: calc(100% - 24px);
  }
  .side-bar {
    flex-shrink: 0;
  }
}
.side-panel {
  height: 100%;
}
.bottom {
  height: 100%;
}
.view-only {
  pointer-events: none;
}
</style>
