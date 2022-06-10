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
import { isPlainText, testEditableTag } from '/@/utils/elements'
import { normalizeAttributes } from '/@/utils/helpers'

const NativeElement: any = defineComponent({
  props: {
    element: {
      type: Object as PropType<ElementNode>,
      required: true,
    },
    groupSelected: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { settings } = useSettings()

    const selectedMap = inject<ComputedRef<{ [id: string]: boolean }>>(
      'selectedMap',
      computed(() => ({}))
    )

    const overrideAttrs = computed<{ [name: string]: string } | undefined>(
      () => {
        if (selectedMap.value[props.element.id] || props.groupSelected) {
          return {
            fill: settings.selectedColor,
            stroke: settings.selectedColor,
          }
        } else {
          return undefined
        }
      }
    )

    const element = computed(() => props.element as ElementNode)

    const groupSelected = computed(() => {
      return props.groupSelected || selectedMap.value[element.value.id]
    })

    const attributes = computed(() => {
      return {
        ...normalizeAttributes({
          ...element.value.attributes,
          ...(overrideAttrs.value ?? {}),
          ...(testEditableTag(element.value.tag)
            ? {
                'data-type': 'element',
                'data-id': element.value.id,
              }
            : {}),
        }),
        key: props.element.id,
      }
    })

    const children = computed(() => {
      return element.value.children.map((c) => {
        if (isPlainText(c)) return c
        return h(NativeElement, {
          element: c,
          groupSelected: groupSelected.value,
          key: c.id,
        })
      })
    })

    return () => {
      return h(element.value.tag, attributes.value, children.value)
    }
  },
})
export default NativeElement
</script>

<style scoped>
g {
  pointer-events: none;
}
g > * {
  pointer-events: initial;
}
</style>
