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
import { ElementNode, Transform } from '/@/models'
import { parseStyle, toStyle, transform } from '/@/utils/helpers'

const NativeElement: any = defineComponent({
  props: {
    element: {
      type: [Object, String] as PropType<ElementNode | string>,
      required: true,
    },
  },
  emits: ['click-element'],
  setup(props) {
    const { settings } = useSettings()

    const selectedMap = inject<ComputedRef<{ [id: string]: boolean }>>(
      'selectedMap',
      computed(() => ({}))
    )

    const transFormMap = inject<ComputedRef<{ [id: string]: Transform }>>(
      'transFormMap',
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
      // eslint-disable-next-line no-unused-vars
      const onClickElement = inject<(id: string, shift: boolean) => void>(
        'onClickElement',
        () => {}
      )

      const transformStr = transFormMap.value[elm.id]
        ? transform(transFormMap.value[elm.id])
        : ''

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
          transform: transformStr + (elm.attributs.transform ?? ''),
        },
        Array.isArray(elm.children)
          ? elm.children.map((c) =>
              h(NativeElement, {
                element: c,
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
