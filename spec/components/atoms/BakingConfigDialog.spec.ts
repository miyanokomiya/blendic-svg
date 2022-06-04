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

import { mount } from '@vue/test-utils'
import Target from '/@/components/molecules/dialogs/BakingConfigDialog.vue'
import DialogBase from '/@/components/molecules/dialogs/DialogBase.vue'

describe('src/components/molecules/dialogs/BakingConfigDialog.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          open: true,
          actions: [
            { id: 'a', name: 'a_name' },
            { id: 'b', name: 'b_name' },
          ],
        },
      })
      expect(wrapper.getComponent(DialogBase).element).toMatchSnapshot()
    })
    it('selected', () => {
      const wrapper = mount(Target, {
        props: {
          open: true,
          actions: [
            { id: 'a', name: 'a_name' },
            { id: 'b', name: 'b_name' },
          ],
          initialActionIds: ['b'],
        },
      })
      expect(wrapper.getComponent(DialogBase).element).toMatchSnapshot()
    })
  })
})
