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

import { ref } from '@vue/reactivity'
import { makeRefAccessors } from '/@/composables/commons'
import { getInsertKeyframeItem } from '/@/composables/stores/animation'
import { getTransform, IdMap, Transform } from '/@/models'
import { getKeyframeBone, KeyframeBone } from '/@/models/keyframe'

describe('src/utils/animation.ts', () => {
  describe('getInsertKeyframeItem', () => {
    it('should return history item to do', () => {
      const currentKeyframes = ref<KeyframeBone[]>([])
      const editTransforms = ref<IdMap<Transform>>({ a: getTransform() })
      const item = getInsertKeyframeItem(
        makeRefAccessors(currentKeyframes),
        makeRefAccessors(editTransforms),
        [getKeyframeBone({ id: 'key_a', targetId: 'a' })]
      )

      expect(currentKeyframes.value).toEqual([])
      expect(editTransforms.value).toEqual({ a: getTransform() })

      item.redo()
      expect(currentKeyframes.value).toEqual([
        getKeyframeBone({ id: 'key_a', targetId: 'a' }),
      ])
      expect(editTransforms.value).toEqual({})

      item.undo()
      expect(currentKeyframes.value).toEqual([])
      expect(editTransforms.value).toEqual({ a: getTransform() })
    })

    it('should drop edit target transforms', () => {
      const currentKeyframes = ref<KeyframeBone[]>([])
      const editTransforms = ref<IdMap<Transform>>({
        a: getTransform(),
        b: getTransform(),
      })
      getInsertKeyframeItem(
        makeRefAccessors(currentKeyframes),
        makeRefAccessors(editTransforms),
        [getKeyframeBone({ id: 'key_a', targetId: 'a' })]
      ).redo()

      expect(editTransforms.value).toEqual({ b: getTransform() })
    })
  })
})
