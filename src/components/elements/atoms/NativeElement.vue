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
import { BElement, Born, ElementNode, IdMap, toMap } from '/@/models'
import { getTransformedBornMap } from '/@/utils/armatures'
import { getParentIdPath } from '/@/utils/commons'
import { parseStyle, toStyle, transform } from '/@/utils/helpers'

const NativeElement: any = defineComponent({
  props: {
    element: {
      type: [Object, String] as PropType<ElementNode | string>,
      required: true,
    },
    relativeRootBornId: {
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

    const bornMap = inject<ComputedRef<IdMap<Born>>>(
      'bornMap',
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

    const groupSelected = computed(() => {
      if (!isElement.value) return props.groupSelected
      return props.groupSelected || selectedMap.value[element.value.id]
    })

    // eslint-disable-next-line no-unused-vars
    const onClickElement = inject<(id: string, shift: boolean) => void>(
      'onClickElement',
      () => {}
    )

    const posedTransform = computed(() => {
      // TODO: improve performance
      if (myElement.value.bornId && bornMap.value[myElement.value.bornId]) {
        // get relative born's transformation from relativeRootBornId's tail
        const parentIdPath = getParentIdPath(
          bornMap.value,
          myElement.value.bornId,
          props.relativeRootBornId
        )
        const posedMap = getTransformedBornMap(
          toMap(
            [...parentIdPath, myElement.value.bornId].map(
              (id) => bornMap.value[id]
            )
          )
        )
        return {
          ...posedMap[myElement.value.bornId].transform,
          origin: posedMap[myElement.value.bornId].head,
        }
      } else {
        return undefined
      }
    })

    const transformStr = computed(() => {
      const posedTransformStr = posedTransform.value
        ? transform(posedTransform.value)
        : ''
      // this order of transformations is important
      return posedTransformStr + (element.value.attributs.transform ?? '')
    })

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

    const children = computed(() => {
      return Array.isArray(element.value.children)
        ? element.value.children.map((c) =>
            h(NativeElement, {
              element: c,
              relativeRootBornId: myElement.value.bornId,
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
