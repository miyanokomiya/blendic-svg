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
import { BElement, Born, ElementNode, IdMap, toMap, Transform } from '/@/models'
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
      if (typeof props.element === 'string') return {}
      return selectedMap.value[props.element.id]
        ? {
            fill: settings.selectedColor,
            stroke: settings.selectedColor,
          }
        : {}
    })

    const overrideStyle = computed(() => {
      if (typeof props.element === 'string') return ''
      return toStyle({
        ...parseStyle(props.element.attributs.style),
        ...overrideAttrs.value,
      })
    })

    return () => {
      if (typeof props.element === 'string') return props.element

      const elm = props.element
      const myElement = elementMap.value[props.element.id]
      // eslint-disable-next-line no-unused-vars
      const onClickElement = inject<(id: string, shift: boolean) => void>(
        'onClickElement',
        () => {}
      )

      let posedTransform: Transform | null = null

      // TODO: improve performance
      if (myElement.bornId && bornMap.value[myElement.bornId]) {
        // get relative born's transformation from relativeRootBornId's tail
        const parentIdPath = getParentIdPath(
          bornMap.value,
          myElement.bornId,
          props.relativeRootBornId
        )
        const posedMap = getTransformedBornMap(
          toMap(
            [...parentIdPath, myElement.bornId].map((id) => bornMap.value[id])
          )
        )
        posedTransform = {
          ...posedMap[myElement.bornId].transform,
          origin: posedMap[myElement.bornId].head,
        }
      }

      const transformStr = posedTransform ? transform(posedTransform) : ''

      const onClick =
        elm.tag === 'g'
          ? undefined
          : (e: MouseEvent) => {
              e.stopPropagation()
              onClickElement(elm.id, e.shiftKey)
            }

      return h(
        elm.tag,
        {
          ...elm.attributs,
          ...overrideAttrs.value,
          style: overrideStyle.value,
          onClick,
          // this order of transformations is important
          transform: transformStr + (elm.attributs.transform ?? ''),
        },
        Array.isArray(elm.children)
          ? elm.children.map((c) =>
              h(NativeElement, {
                element: c,
                relativeRootBornId: myElement.bornId,
              })
            )
          : elm.children
      )
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
