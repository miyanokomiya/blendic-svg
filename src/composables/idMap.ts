/*
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
*/

import { ref, watch } from 'vue'
import { IdMap } from '/@/models'
import { mapFilter } from '/@/utils/commons'

export function useBooleanMap(getIds: () => string[]) {
  const booleanMap = ref<IdMap<boolean>>({})

  function toggle(id: string) {
    if (booleanMap.value[id]) {
      delete booleanMap.value[id]
    } else {
      booleanMap.value[id] = true
    }
  }

  watch(getIds, (ids) => {
    const idMap = ids.reduce<{ [id: string]: unknown }>(
      (p, c) => ({ ...p, [c]: true }),
      {}
    )
    // drop if the target is removed
    booleanMap.value = mapFilter(booleanMap.value, (_, id) => id in idMap)
  })

  return {
    booleanMap,
    toggle,
  }
}
