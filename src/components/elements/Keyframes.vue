<template>
  <g>
    <g class="view-only">
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
            />
            <circle
              v-for="(k, i) in keyframes"
              :key="k.bornId"
              :cy="(i + 1) * 24"
              r="4"
              stroke="#000"
              fill="#fff"
            />
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { IdMap, Keyframe } from '/@/models'
import * as animations from '/@/utils/animations'

export default defineComponent({
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    keyframeMapByFrame: {
      type: Object as PropType<IdMap<Keyframe[]>>,
      default: 0,
    },
    bornIds: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  emits: [],
  setup(props) {
    const frameWidth = animations.frameWidth

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

    return {
      headerHeight: 24,
      frameWidth,
      bornIndexMap,
      sortedKeyframeMapByFrame,
    }
  },
})
</script>

<style lang="scss" scoped>
.view-only {
  pointer-events: none;
}
</style>
