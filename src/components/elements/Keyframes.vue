<template>
  <g>
    <g>
      <g>
        <g
          v-for="(keyframes, f) in sortedKeyframeMapByFrame"
          :key="f"
          :transform="`translate(${parseInt(f) * frameWidth}, 0)`"
        >
          <g :transform="`scale(${scale}) translate(0, 36)`">
            <circle
              v-if="keyframes.length > 0"
              key="all"
              r="4"
              stroke="#000"
              fill="#fff"
              @click.left.exact="selectFrame(f)"
              @click.left.shift.exact="shiftSelectFrame(f)"
            />
            <circle
              v-for="(k, i) in keyframes"
              :key="k.bornId"
              :cy="(i + 1) * 24"
              r="4"
              stroke="#000"
              :fill="selectedKeyframeMap[k.id] ? selectedColor : '#fff'"
              @click.left.exact="select(k.id)"
              @click.left.shift.exact="shiftSelect(k.id)"
            />
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useSettings } from '/@/composables/settings'
import { IdMap, Keyframe, frameWidth } from '/@/models'

export default defineComponent({
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    keyframeMapByFrame: {
      type: Object as PropType<IdMap<Keyframe[]>>,
      default: () => ({}),
    },
    bornIds: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    selectedKeyframeMap: {
      type: Object as PropType<IdMap<boolean>>,
      default: () => ({}),
    },
  },
  emits: ['select', 'shift-select', 'select-frame', 'shift-select-frame'],
  setup(props, { emit }) {
    const { settings } = useSettings()

    const bornIndexMap = computed(
      (): IdMap<number> => {
        return props.bornIds.reduce<IdMap<number>>((p, id, i) => {
          p[id] = i
          return p
        }, {})
      }
    )

    const sortedKeyframeMapByFrame = computed(() => {
      return Object.keys(props.keyframeMapByFrame).reduce<IdMap<Keyframe[]>>(
        (p, bornId) => {
          p[bornId] = sortAndFilterKeyframesByBornId(
            props.keyframeMapByFrame[bornId]
          )
          return p
        },
        {}
      )
    })

    function sortAndFilterKeyframesByBornId(keyframes: Keyframe[]): Keyframe[] {
      return keyframes
        .filter((k) => bornIndexMap.value[k.bornId] > -1)
        .sort(
          (a, b) => bornIndexMap.value[a.bornId] - bornIndexMap.value[b.bornId]
        )
    }

    function select(keyframeId: string) {
      emit('select', keyframeId)
    }
    function shiftSelect(keyframeId: string) {
      emit('shift-select', keyframeId)
    }
    function selectFrame(keyframeId: string) {
      emit('select-frame', keyframeId)
    }
    function shiftSelectFrame(keyframeId: string) {
      emit('shift-select-frame', keyframeId)
    }

    return {
      headerHeight: 24,
      frameWidth,
      bornIndexMap,
      sortedKeyframeMapByFrame,
      select,
      shiftSelect,
      selectFrame,
      shiftSelectFrame,
      selectedColor: settings.selectedColor,
    }
  },
})
</script>
