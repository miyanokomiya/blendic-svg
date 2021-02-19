<template>
  <div class="animation-panel-root">
    <div class="top">
      <div class="select-action">
        <SelectField v-model="selectedActionId" :options="actionOptions" />
      </div>
      <input v-model="draftName" type="text" @change="changeActionName" />
      <button class="add-action" @click="addAction">+</button>
      <button class="delete-action" @click="deleteAction">x</button>
      <label class="end-frame-field"
        >End:
        <input v-model="draftEndFrame" type="number" @change="changeEndFrame" />
      </label>
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
              :end-frame="endFrame"
              @down-current-frame="downCurrentFrame"
            />
            <Keyframes
              :scale="scale"
              :keyframe-map-by-frame="keyframeMapByFrame"
              :born-ids="selectedAllBornIdList"
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
                v-for="(born, i) in selectedAllBornList"
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
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import SelectField from './atoms/SelectField.vue'
import TimelineCanvas from './TimelineCanvas.vue'
import TimelineRow from './elements/atoms/TimelineRow.vue'
import TimelineAxis from './elements/atoms/TimelineAxis.vue'
import Keyframes from './elements/Keyframes.vue'
import { getNearestFrameAtPoint } from '../utils/animations'
import { IVec2 } from 'okageo'
import { toList } from '/@/utils/commons'

export default defineComponent({
  components: {
    SelectField,
    TimelineCanvas,
    TimelineRow,
    TimelineAxis,
    Keyframes,
  },
  setup() {
    const labelWidth = 140
    const axisPadding = 20

    const store = useStore()
    const animationStore = useAnimationStore()

    const editMode = ref<'' | 'move-current-frame'>('')
    const draftName = ref('')
    const draftEndFrame = ref('')

    const selectedAction = computed(() => animationStore.selectedAction.value)
    const selectedAllBornList = computed(() =>
      toList(animationStore.selectedAllBorns.value)
    )
    const selectedAllBornIdList = computed(() =>
      selectedAllBornList.value.map((b) => b.id)
    )
    const keyframeMapByFrame = computed(
      () => animationStore.keyframeMapByFrame.value
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
        animationStore.setCurrentFrame(
          getNearestFrameAtPoint(current.x - labelWidth - axisPadding)
        )
      }
    }
    function upLeft() {
      editMode.value = ''
    }

    watchEffect(() => {
      draftName.value = selectedAction.value?.name ?? ''
    })
    watchEffect(() => {
      draftEndFrame.value = animationStore.endFrame.value.toString()
    })

    return {
      actions: animationStore.actions,
      selectedAllBornList,
      selectedAllBornIdList,
      keyframeMapByFrame,
      draftName,
      draftEndFrame,
      labelWidth,
      axisPadding,
      currentFrame: animationStore.currentFrame,
      endFrame: animationStore.endFrame,
      changeActionName: () => {
        if (!draftName.value) return
        animationStore.updateAction({ name: draftName.value })
      },
      changeEndFrame: () => {
        const val = parseInt(draftEndFrame.value, 10)
        if (!isNaN(val) && val >= 0) {
          animationStore.setEndFrame(val)
        } else {
          draftEndFrame.value = animationStore.endFrame.value.toString()
        }
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
  .end-frame-field {
    margin: 0 0 0 auto;
    input {
      width: 4rem;
    }
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
