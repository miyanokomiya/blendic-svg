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

import { mount } from '@vue/test-utils'
import Target from '/@/components/panelContents/HistoryStack.vue'
import { useHistoryStore } from '/@/store/history'

describe('src/components/panelContents/HistoryStack.vue', () => {
  const historyStore = useHistoryStore()
  beforeEach(() => {
    historyStore.clearHistory()
  })

  describe('snapshot', () => {
    it('empty history', () => {
      const wrapper = mount(Target)
      expect(wrapper.element).toMatchSnapshot()
    })

    it('some histories', () => {
      historyStore.push({ name: 'item 1', undo: () => {}, redo: () => {} })
      historyStore.push({ name: 'item 2', undo: () => {}, redo: () => {} })
      historyStore.push({ name: 'item 3', undo: () => {}, redo: () => {} })
      historyStore.undo()
      const wrapper = mount(Target)
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
