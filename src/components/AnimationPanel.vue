<template>
  <div class="animation-panel-root">
    <div class="top">
      <div class="select-action">
        <SelectField v-model="selectedActionId" :options="actionOptions" />
      </div>
      <input v-model="draftName" type="text" @change="changeActionName" />
      <button class="add-action" @click="addAction">+</button>
      <button class="delete-action" @click="deleteAction">x</button>
    </div>
    <div class="middle">
      <TimelineCanvas @up-left="upLeft" @drag="drag" @down-left="downLeft">
        <template #default="{ scale, viewOrigin, viewSize }">
          <g
            :transform="`translate(${labelWidth + axisPadding}, ${
              viewOrigin.y
            })`"
          >
            <TimelineAxis
              :scale="scale"
              :origin-x="viewOrigin.x"
              :view-width="viewSize.width"
              :current-frame="currentFrame"
              @down-current-frame="downCurrentFrame"
            />
          </g>
          <g
            :transform="`translate(${viewOrigin.x}, ${viewOrigin.y}) scale(${scale})`"
          >
            <g>
              <rect
                :width="labelWidth"
                height="10000"
                stroke="none"
                fill="#fff"
              />
              <line
                :x1="labelWidth"
                y1="0"
                :x2="labelWidth"
                y2="10000"
                stroke="black"
              />
              <TimelineRow
                :index="1"
                :label-width="labelWidth"
                label="Summary"
              />
              <TimelineRow
                v-for="(born, i) in selectedBorns"
                :key="born.id"
                :index="i + 2"
                :label-width="labelWidth"
                :label="born.name"
              />
            </g>
          </g>
        </template>
      </TimelineCanvas>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useStore } from '../store'
import { useAnimationStore } from '../store/Animation'
import SelectField from './atoms/SelectField.vue'
import TimelineCanvas from './TimelineCanvas.vue'
import TimelineRow from './elements/atoms/TimelineRow.vue'
import TimelineAxis from './elements/atoms/TimelineAxis.vue'
import { getNearestFrameAtPoint } from '../utils/animations'
import { IVec2 } from 'okageo'

export default defineComponent({
  components: { SelectField, TimelineCanvas, TimelineRow, TimelineAxis },
  setup() {
    const labelWidth = 140
    const axisPadding = 20

    const store = useStore()
    const animationStore = useAnimationStore()

    const editMode = ref<'' | 'move-current-frame'>('')
    const draftName = ref('')

    const selectedAction = computed(() => animationStore.selectedAction.value)
    const selectedBorns = computed(
      () => store.lastSelectedArmature.value?.borns ?? []
    )

    const actionOptions = computed(() =>
      animationStore.actions.map((a) => {
        const valid = store.lastSelectedArmature.value?.id !== a.armatureId
        return {
          value: a.id,
          label: `${valid ? '(x)' : ''} ${a.name}`,
        }
      })
    )

    function downCurrentFrame() {
      editMode.value = 'move-current-frame'
    }
    function downLeft(current: IVec2) {
      drag(current)
    }
    function drag(current: IVec2) {
      if (editMode.value === 'move-current-frame') {
        animationStore.currentFrame.value = getNearestFrameAtPoint(
          current.x - labelWidth - axisPadding
        )
      }
    }
    function upLeft() {
      editMode.value = ''
    }

    watch(
      selectedAction,
      () => (draftName.value = selectedAction.value?.name ?? '')
    )

    return {
      actions: animationStore.actions,
      selectedBorns,
      draftName,
      labelWidth,
      axisPadding,
      currentFrame: animationStore.currentFrame,
      changeActionName: () => {
        if (!draftName.value) return
        animationStore.updateAction({ name: draftName.value })
      },
      addAction: animationStore.addAction,
      deleteAction: animationStore.deleteAction,
      actionOptions,
      selectedActionId: computed({
        get: () => selectedAction.value?.id ?? '',
        set: (id: string) => animationStore.selectAction(id),
      }),
      downCurrentFrame,
      downLeft,
      drag,
      upLeft,
    }
  },
})
</script>

<style lang="scss" scoped>
.animation-panel-root {
  display: flex;
  flex-direction: column;
  align-items: left;
  height: 100%;
}
.top {
  margin-bottom: 4px;
  flex: 0;
  display: flex;
  align-items: center;
  > * {
    margin-right: 8px;
  }
  .select-action {
    width: 160px;
  }
  button {
    width: 20px;
    height: 20px;
    border: solid 1px #000;
  }
}
.middle {
  flex: 1;
  min-height: 0; // for flex grow
}
</style>
