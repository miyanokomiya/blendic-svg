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

import { inject, provide, Ref, ref } from 'vue'
import { SelectOptions } from '/@/composables/modes/types'

const closedState: { [key: string]: Ref<{ [id: string]: boolean }> } = {}

export function clearClosedState() {
  Object.keys(closedState).forEach((k) => delete closedState[k])
}

export function provideTreeContext(
  key: string,
  options: {
    getSelectedMap?: () => { [id: string]: boolean }
    getEditable?: () => boolean
    updateName?: (id: string, name: string) => void
    onClickElement?: (id: string, options?: SelectOptions) => void
    provide?: (key: string, value: any) => void
  }
) {
  const _provide = options.provide ?? provide

  if (options.getSelectedMap) {
    _provide('getSelectedMap', options.getSelectedMap)
  }
  if (options.getEditable) {
    _provide('getEditable', options.getEditable)
  }
  if (options.updateName) {
    _provide('updateName', options.updateName)
  }
  if (options.onClickElement) {
    _provide('onClickElement', options.onClickElement)
  }

  closedState[key] ??= ref<{ [id: string]: boolean }>({})
  _provide('getClosedMap', () => closedState[key].value)
  _provide('setClosed', (id: string, value: boolean) => {
    if (value) {
      closedState[key].value[id] = value
    } else {
      delete closedState[key].value[id]
    }
  })
}

export function injectTreeContext(_inject = inject) {
  return {
    getSelectedMap: _inject<() => { [id: string]: boolean }>(
      'getSelectedMap',
      () => ({})
    ),
    getEditable: _inject<() => boolean>('getEditable', () => false),
    updateName: _inject<(id: string, name: string) => void>(
      'updateName',
      () => {}
    ),
    onClickElement: _inject<(id: string, options?: SelectOptions) => void>(
      'onClickElement',
      () => {}
    ),
    getClosedMap: _inject<() => { [id: string]: boolean }>(
      'getClosedMap',
      () => ({})
    ),
    setClosed: _inject<(id: string, value: boolean) => void>(
      'setClosed',
      () => {}
    ),
  }
}
