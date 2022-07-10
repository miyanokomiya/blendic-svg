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
import { AnimationExportingSettings } from '../../../src/composables/settings'
import Target from '/@/components/molecules/dialogs/AnimatedSvgSettingDialog.vue'
import DialogBase from '/@/components/molecules/dialogs/DialogBase.vue'

describe('src/components/molecules/dialogs/AnimatedSvgSettingDialog.vue', () => {
  describe('snapshot', () => {
    it('default', () => {
      const wrapper = mount(Target, {
        props: {
          open: true,
          settings: {
            fps: 30,
            range: 'auto',
            customRange: { from: 0, to: 60 },
            size: 'custom',
            customSize: { width: 200, height: 200 },
          } as AnimationExportingSettings,
        },
      })
      expect(wrapper.getComponent(DialogBase).element).toMatchSnapshot()
    })
  })
})
