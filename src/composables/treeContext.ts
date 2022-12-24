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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { inject, provide } from 'vue'
import { SelectOptions } from '/@/composables/modes/types'

export function provideTreeContext(options: {
  getSelectedMap?: () => { [id: string]: boolean }
  getEditable?: () => boolean
  updateName?: (id: string, name: string) => void
  onClickElement?: (id: string, options?: SelectOptions) => void
}) {
  if (options.getSelectedMap) {
    provide('getSelectedMap', options.getSelectedMap)
  }
  if (options.getEditable) {
    provide('getEditable', options.getEditable)
  }
  if (options.updateName) {
    provide('updateName', options.updateName)
  }
  if (options.onClickElement) {
    provide('onClickElement', options.onClickElement)
  }
}

export function injectTreeContext() {
  return {
    getSelectedMap: inject<() => { [id: string]: boolean }>(
      'getSelectedMap',
      () => ({})
    ),
    getEditable: inject<() => boolean>('getEditable', () => false),
    updateName: inject<(id: string, name: string) => void>(
      'updateName',
      () => {}
    ),
    onClickElement: inject<(id: string, options?: SelectOptions) => void>(
      'onClickElement',
      () => {}
    ),
  }
}
