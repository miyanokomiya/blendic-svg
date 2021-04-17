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
import Target from '/@/components/molecules/constraints/CopyLocationOptionField.vue'
import { getOptionByType } from '/@/utils/constraints'

describe('/@/src/components/molecules/constraints/CopyLocationOptionField.vue', () => {
  it('snapshot', () => {
    const wrapper = mount(Target, {
      props: {
        modelValue: getOptionByType('COPY_LOCATION'),
        boneOptions: [
          { value: 'a', label: 'bone_a' },
          { value: 'b', label: 'bone_b' },
        ],
      },
    })
    expect(wrapper.element).toMatchSnapshot()
  })
})
