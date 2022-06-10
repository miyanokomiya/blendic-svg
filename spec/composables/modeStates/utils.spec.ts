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

import { parseEventTarget } from '/@/composables/modeStates/utils'

describe('src/composables/modeStates/utils.ts', () => {
  describe('parseEventTarget', () => {
    it('should return closest event target having meta data', () => {
      const root = document.createElement('div')
      const a = document.createElement('div')
      a.setAttribute('data-id', 'id-a')
      a.setAttribute('data-type', 'type-a')
      a.setAttribute('data-value', 'value-a')
      const b = document.createElement('div')
      const c = document.createElement('div')
      const d = document.createElement('div')
      root.appendChild(a)
      a.appendChild(b)
      b.appendChild(c)

      expect(parseEventTarget({ target: d })).toEqual({ id: '', type: 'empty' })
      expect(parseEventTarget({ target: c })).toEqual({
        id: 'id-a',
        type: 'type-a',
        data: {
          id: 'id-a',
          type: 'type-a',
          value: 'value-a',
        },
      })
    })
  })
})
