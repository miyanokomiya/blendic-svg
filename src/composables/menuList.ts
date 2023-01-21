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

export interface UIPopupMenuItem {
  label: string
  hover?: () => void
  exec?: () => void
  focus?: boolean
  opened?: boolean
  children?: UIPopupMenuItem[]
}

export function useMenuList(getSrcList: () => PopupMenuItem[]) {
  const lastSelectedItem = ref<string>()
  const openedParent = ref<string>()

  const list = computed<UIPopupMenuItem[]>(() => {
    return getSrcList().map((item) => {
      return {
        ...item,
        focus: item.label === lastSelectedItem.value,
        opened: item.label === openedParent.value,
        hover() {
          if (item.children) {
            openedParent.value = item.label
          }
        },
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
            // save the parent
            lastSelectedItem.value = item.label
          },
        })),
      }
    })
  })

  function clearOpened() {
    openedParent.value = lastSelectedItem.value
  }

  return { list, clearOpened }
}
