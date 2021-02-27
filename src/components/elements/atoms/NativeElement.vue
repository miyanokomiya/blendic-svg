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

<script lang="ts">
import {
  AffineMatrix,
  affineToTransform,
  multiAffines,
  parseTransform,
} from 'okageo'
import {
  computed,
  ComputedRef,
  defineComponent,
  h,
  inject,
  PropType,
} from 'vue'
import { useSettings } from '/@/composables/settings'
import { BElement, Bone, ElementNode, IdMap } from '/@/models'
import { poseToAffine } from '/@/utils/armatures'
import { parseStyle, toStyle } from '/@/utils/helpers'
import {
  getNativeDeformMatrix,
  getPoseDeformMatrix,
  resolveRelativePose,
  TransformCache,
} from '/@/utils/poseResolver'

const NativeElement: any = defineComponent({
  props: {
    element: {
      type: [Object, String] as PropType<ElementNode | string>,
      required: true,
    },
    relativeRootBoneId: {
      type: String,
      default: '',
    },
    groupSelected: {
      type: Boolean,
      default: false,
    },
    nativeMatrix: {
      type: Object as PropType<AffineMatrix | undefined>,
      default: undefined,
    },
  },
  emits: ['click-element'],
  setup(props) {
    const { settings } = useSettings()

    const selectedMap = inject<ComputedRef<{ [id: string]: boolean }>>(
      'selectedMap',
      computed(() => ({}))
    )

    const elementMap = inject<ComputedRef<IdMap<BElement>>>(
      'elementMap',
      computed(() => ({}))
    )

    const boneMap = inject<ComputedRef<IdMap<Bone>>>(
      'boneMap',
      computed(() => ({}))
    )

    const overrideAttrs = computed((): { [name: string]: string } => {
      if (typeof props.element === 'string') {
        return {}
      } else if (selectedMap.value[props.element.id] || props.groupSelected) {
        return {
          fill: settings.selectedColor,
          stroke: settings.selectedColor,
        }
      } else {
        return {}
      }
    })

    const overrideStyle = computed(() => {
      if (typeof props.element === 'string') return ''
      return toStyle({
        ...parseStyle(props.element.attributs.style),
        ...overrideAttrs.value,
      })
    })

    const isElement = computed(() => typeof props.element !== 'string')
    const element = computed(() => props.element as ElementNode)
    const myElement = computed(() => elementMap.value[element.value.id])

    const transformCache = inject<TransformCache>('transformCache')

    // eslint-disable-next-line no-unused-vars
    const onClickElement = inject<(id: string, shift: boolean) => void>(
      'onClickElement',
      () => {}
    )

    function onClick(e: MouseEvent) {
      if (element.value.tag === 'g') return
      e.stopPropagation()
      onClickElement(element.value.id, e.shiftKey)
    }

    const groupSelected = computed(() => {
      if (!isElement.value) return props.groupSelected
      return props.groupSelected || selectedMap.value[element.value.id]
    })

    const spacePoseMatrix = computed(() => {
      const t = resolveRelativePose(
        boneMap.value,
        '',
        props.relativeRootBoneId,
        transformCache
      )
      return t ? poseToAffine(t) : undefined
    })

    const boundBoneId = computed(() => {
      return myElement.value.boneId || props.relativeRootBoneId
    })

    const selfPoseMatrix = computed(() => {
      const t = resolveRelativePose(
        boneMap.value,
        '',
        boundBoneId.value,
        transformCache
      )
      return t ? poseToAffine(t) : undefined
    })

    const nativeMatrix = computed(() => {
      if (!isElement.value) return

      return getNativeDeformMatrix(
        props.nativeMatrix,
        element.value.attributs.transform
          ? parseTransform(element.value.attributs.transform)
          : undefined
      )
    })

    const transformStr = computed(() => {
      if (!isElement.value) return
      return affineToTransform(
        multiAffines(
          [
            getPoseDeformMatrix(
              spacePoseMatrix.value,
              selfPoseMatrix.value,
              props.nativeMatrix
            ),
            nativeMatrix.value,
          ].filter((m): m is AffineMatrix => !!m)
        )
      )
    })

    const attributs = computed(() => {
      return {
        ...element.value.attributs,
        ...overrideAttrs.value,
        style: overrideStyle.value,
        onClick,
        transform: transformStr.value,
      }
    })

    const children = computed(() => {
      return Array.isArray(element.value.children)
        ? element.value.children.map((c) =>
            h(NativeElement, {
              element: c,
              relativeRootBoneId: boundBoneId.value,
              groupSelected: groupSelected.value,
              nativeMatrix: nativeMatrix.value,
            })
          )
        : element.value.children
    })

    return () => {
      if (!isElement.value) return props.element
      return h(element.value.tag, attributs.value, children.value)
    }
  },
})
export default NativeElement
</script>

<style lang="scss" scoped>
g {
  pointer-events: none;
  > * {
    pointer-events: initial;
  }
}
</style>
