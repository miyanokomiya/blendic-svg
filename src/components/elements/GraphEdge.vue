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
  <g
    class="edge"
    data-type="edge"
    :data-input_id="inputId"
    :data-input_key="inputKey"
    :data-output_id="outputId"
    :data-output_key="outputKey"
    :stroke-opacity="status === 'connecting' ? 0.5 : 1"
  >
    <path :d="pathD" stroke="#222" :stroke-width="5 * scale" fill="none" />
    <path :d="pathD" :stroke="stroke" :stroke-width="4 * scale" fill="none" />
    <path
      v-if="!status"
      class="highlight"
      :d="pathD"
      :stroke="stroke"
      :stroke-width="9 * scale"
      fill="none"
    />
  </g>
</template>

<script lang="ts">
import { computed } from 'vue'
import { IVec2 } from 'okageo'
import { useSettings } from '/@/composables/settings'
import { injectScale } from '/@/composables/canvas'
import { getGraphNodeEdgePath } from '/@/utils/helpers'
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    from: IVec2
    to: IVec2
    status?: 'connecting' | 'connected'
    inputId?: string
    inputKey?: string
    outputId?: string
    outputKey?: string
  }>(),
  {
    status: undefined,
    inputId: undefined,
    inputKey: undefined,
    outputId: undefined,
    outputKey: undefined,
  }
)

const pathD = computed(() => getGraphNodeEdgePath(props.from, props.to))
const { settings } = useSettings()
const scale = computed(injectScale())
const stroke = computed(() => (props.status ? settings.selectedColor : '#888'))
</script>

<style scoped>
.edge:not(:hover) .highlight {
  display: none;
}
</style>
