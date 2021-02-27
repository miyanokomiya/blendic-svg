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

import { useStore } from '/@/store/index'
import { getArmature, getBone } from '/@/models'
import { nextTick } from 'vue'

describe('store/index', () => {
  const store = useStore()
  beforeEach(() => {
    store.state.armatures = []
    store.state.lastSelectedArmatureId = ''
    store.state.lastSelectedBoneId = ''
    store.state.selectedArmatures = {}
    store.state.selectedBones = {}
  })

  describe('lastSelectedArmature', () => {
    it('should clear if the armature is removed', async () => {
      store.state.armatures = [
        getArmature({ id: 'a' }),
        getArmature({ id: 'b' }),
      ]
      store.selectArmature('a')
      expect(store.lastSelectedArmature.value?.id).toBe('a')
      store.state.armatures = [getArmature({ id: 'a' })]
      expect(store.lastSelectedArmature.value?.id).toBe('a')
      store.state.armatures = []
      expect(store.lastSelectedArmature.value).toBe(undefined)
      await nextTick()
      expect(store.state.lastSelectedArmatureId).toBe('')
    })
    it('should clear if the armature is unselected', () => {
      store.state.armatures = [
        getArmature({ id: 'a' }),
        getArmature({ id: 'b' }),
      ]
      store.selectArmature('a')
      expect(store.lastSelectedArmature.value?.id).toBe('a')
      store.state.selectedArmatures = {}
      expect(store.lastSelectedArmature.value).toBe(undefined)
    })
  })

  describe('lastSelectedBone', () => {
    it('should clear if the bone is removed', async () => {
      store.state.armatures = [
        getArmature({
          id: 'arm',
          bones: [getBone({ id: 'a' }), getBone({ id: 'b' })],
        }),
      ]
      store.selectArmature('arm')
      store.selectBone('a')
      expect(store.lastSelectedBone.value?.id).toBe('a')
      store.state.armatures[0].bones = [getBone({ id: 'a' })]
      expect(store.lastSelectedBone.value?.id).toBe('a')
      store.state.armatures[0].bones = []
      expect(store.lastSelectedBone.value).toBe(undefined)
      await nextTick()
      expect(store.state.lastSelectedBoneId).toBe('')
    })
  })
})
