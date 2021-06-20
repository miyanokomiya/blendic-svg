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

import { computed, ref } from 'vue'
import { PopupMenuItem } from '/@/composables/modes/types'

export function useMenuList(getSrcList: () => PopupMenuItem[]) {
  const lastSelectedItem = ref<string>()
  const openedParent = ref<string>()

  const list = computed<PopupMenuItem[]>(() => {
    return getSrcList().map((item) => {
      return {
        ...item,
        focus: item.label === lastSelectedItem.value,
        opened: item.label === openedParent.value,
        exec() {
          if (item.exec) {
            lastSelectedItem.value = item.label
            openedParent.value = ''
            item.exec()
          } else if (item.children) {
            openedParent.value =
              openedParent.value === item.label ? '' : item.label
          }
        },
        // child items cannot be focused
        children: item.children?.map((child) => ({
          ...child,
          exec() {
            child.exec?.()
          },
        })),
      }
    })
  })

  return { list }
}
