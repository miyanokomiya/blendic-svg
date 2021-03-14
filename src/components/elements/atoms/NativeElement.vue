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
  computed,
  ComputedRef,
  defineComponent,
  h,
  inject,
  PropType,
} from 'vue'
import { useSettings } from '/@/composables/settings'
import { ElementNode } from '/@/models'
import { dropMap } from '/@/utils/commons'
import { parseStyle, toStyle } from '/@/utils/helpers'

const NativeElement: any = defineComponent({
  props: {
    element: {
      type: [Object, String] as PropType<ElementNode | string>,
      required: true,
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
        ...dropMap(
          parseStyle(props.element.attributes.style),
          element.value.attributes
        ),
        ...overrideAttrs.value,
      })
    })

    const isElement = computed(() => typeof props.element !== 'string')
    const element = computed(() => props.element as ElementNode)

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

    const attributes = computed(() => {
      return {
        ...element.value.attributes,
        ...overrideAttrs.value,
        style: overrideStyle.value,
        onClick,
      }
    })

    const children = computed(() => {
      return Array.isArray(element.value.children)
        ? element.value.children.map((c) =>
            h(NativeElement, {
              element: c,
              groupSelected: groupSelected.value,
            })
          )
        : element.value.children
    })

    return () => {
      if (!isElement.value) return props.element
      return h(element.value.tag, attributes.value, children.value)
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
