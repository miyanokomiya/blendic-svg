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
import Target from '/@/components/molecules/dialogs/DialogBase.vue'

describe('src/components/molecules/dialogs/DialogBase.vue', () => {
  describe('snapshot', () => {
    it('close', () => {
      const wrapper = mount(Target, {
        props: { open: false },
        slots: {
          default: 'slot_default',
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('open', () => {
      const wrapper = mount(Target, {
        props: { open: true },
        slots: {
          default: 'slot_default',
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('with buttons', () => {
      const wrapper = mount(Target, {
        props: { open: true },
        slots: {
          default: 'slot_default',
          buttons: 'slot_buttons',
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
  })
})
