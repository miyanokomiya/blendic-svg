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
    historyStore.clear()
  })

  describe('snapshot', () => {
    it('empty history', () => {
      const wrapper = mount(Target)
      expect(wrapper.element).toMatchSnapshot()
    })

    it('some histories', () => {
      const { dispatch, createAction } = historyStore.defineReducers({
        test0: {
          redo() {},
          undo() {},
        },
        test1: {
          redo() {},
          undo() {},
        },
      })
      dispatch(createAction('test0', undefined))
      dispatch(createAction('test1', undefined))
      dispatch(createAction('test0', undefined))
      historyStore.undo()

      const wrapper = mount(Target)
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
