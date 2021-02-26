<script lang="ts">
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
import { parseStyle, toStyle } from '/@/utils/helpers'
import {
  resolveRelativePose,
  toTransformStr,
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

    const posedTransform = computed(() => {
      return resolveRelativePose(
        boneMap.value,
        props.relativeRootBoneId,
        myElement.value.boneId,
        transformCache
      )
    })

    const transformStr = computed(() => {
      return toTransformStr(
        element.value.attributs.transform,
        posedTransform.value
      )
    })

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

    const attributs = computed(() => {
      return {
        ...element.value.attributs,
        ...overrideAttrs.value,
        style: overrideStyle.value,
        onClick,
        transform: transformStr.value,
      }
    })

    const groupSelected = computed(() => {
      if (!isElement.value) return props.groupSelected
      return props.groupSelected || selectedMap.value[element.value.id]
    })

    const children = computed(() => {
      return Array.isArray(element.value.children)
        ? element.value.children.map((c) =>
            h(NativeElement, {
              element: c,
              relativeRootBoneId: myElement.value.boneId,
              groupSelected: groupSelected.value,
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
