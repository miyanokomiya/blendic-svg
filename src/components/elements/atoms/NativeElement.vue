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

<template>
  <component :is="element.tag" v-bind="attributes">
    <template v-for="c in element.children">
      <template v-if="isPlainText(c)">{{ c }}</template>
      <NativeElement
        v-else
        :key="c.id"
        :element="c"
        :group-selected="childGroupSelected"
      />
    </template>
  </component>
</template>

<script lang="ts">
import { computed, ComputedRef, inject } from 'vue'
import { useSettings } from '/@/composables/settings'
import { ElementNode } from '/@/models'
import { testEditableTag } from '/@/utils/elements'
import { normalizeAttributes } from '/@/utils/helpers'

const { settings } = useSettings()
</script>

<script setup lang="ts">
import { isPlainText } from '/@/utils/elements'

const props = withDefaults(
  defineProps<{
    element: ElementNode
    groupSelected?: boolean
  }>(),
  {
    groupSelected: false,
  }
)

const selectedMap = inject<ComputedRef<{ [id: string]: boolean }>>(
  'selectedMap',
  computed(() => ({}))
)

const overrideAttrs = computed<{ [name: string]: string } | undefined>(() => {
  if (selectedMap.value[props.element.id] || props.groupSelected) {
    return {
      fill: settings.selectedColor,
      stroke: settings.selectedColor,
    }
  } else {
    return undefined
  }
})

const childGroupSelected = computed(() => {
  return props.groupSelected || selectedMap.value[props.element.id]
})

const attributes = computed(() => {
  return {
    ...normalizeAttributes({
      ...props.element.attributes,
      ...(overrideAttrs.value ?? {}),
      ...(testEditableTag(props.element.tag)
        ? {
            'data-type': 'element',
            'data-id': props.element.id,
          }
        : {}),
    }),
    key: props.element.id,
  }
})
</script>

<style scoped>
g {
  pointer-events: none;
}
g > * {
  pointer-events: initial;
}
</style>
