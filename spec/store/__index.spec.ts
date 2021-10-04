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

import { createStore } from '/@/store/__index'
import { useHistoryStore } from '/@/composables/stores/history'

describe('src/store/__index.ts', () => {
  describe('addArmature', () => {
    it('should add new armature', () => {
      const target = createStore(useHistoryStore())
      expect(target.armatures.value).toHaveLength(0)
      target.addArmature('arm_a')
      expect(target.armatures.value).toHaveLength(1)
      expect(target.lastSelectedArmatureId.value).toBe('arm_a')
    })
  })

  describe('selectAllBone', () => {
    it('should toggle selected state of all bones', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.selectAllBone()
      expect(target.selectedBones.value).toEqual({
        bone_a: { head: true, tail: true },
        bone_b: { head: true, tail: true },
      })
      target.selectAllBone()
      expect(target.selectedBones.value).toEqual({})
    })
  })

  describe('addBone', () => {
    it('should add new bone', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      expect(target.lastSelectedArmature.value!.b_ones).toHaveLength(0)
      expect(target.boneMap.value).toEqual({})
      target.addBone('bone_a')
      target.addBone('bone_b')
      expect(target.lastSelectedArmature.value!.b_ones).toEqual([
        'bone_a',
        'bone_b',
      ])
      expect(target.boneMap.value).toEqual({
        bone_a: expect.anything(),
        bone_b: expect.anything(),
      })
      expect(target.selectedBones.value).toEqual({
        bone_b: { head: true, tail: true },
      })
    })
  })

  describe('deleteBone', () => {
    it('should delete bones whose all attrs have been selected and clean connections', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.selectBones({
        bone_a: { head: true },
        bone_b: { head: true, tail: true },
      })
      target.deleteBone()
      expect(target.lastSelectedArmature.value!.b_ones).toEqual(['bone_a'])
      expect(target.boneMap.value).toEqual({ bone_a: expect.anything() })
      expect(target.selectedBones.value).toEqual({})
    })
  })

  describe('dissolveBone', () => {
    it('should dissolve bones whose all attrs have been selected and clean connections', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.addBone('bone_c')
      target.updateBones({
        bone_b: { parentId: 'bone_a' },
        bone_c: { parentId: 'bone_b' },
      })
      target.selectBones({
        bone_a: { head: true },
        bone_b: { head: true, tail: true },
      })
      target.dissolveBone()
      expect(target.lastSelectedArmature.value!.b_ones).toEqual([
        'bone_a',
        'bone_c',
      ])
      expect(target.boneMap.value['bone_c'].parentId).toBe('bone_a')
      expect(target.selectedBones.value).toEqual({})
    })
  })

  describe('updateBones', () => {
    it('should update bones clean connections', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.addBone('bone_c')
      target.updateBones({
        bone_b: { parentId: 'bone_a' },
        bone_c: { parentId: 'unknown' },
      })
      expect(target.boneMap.value['bone_b'].parentId).toBe('bone_a')
      expect(target.boneMap.value['bone_c'].parentId).toBe('')
    })
  })

  describe('updateBone', () => {
    it('should update bones fix connections', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.addBone('bone_c')
      target.updateBone({
        parentId: 'unknown',
      })
      expect(target.boneMap.value['bone_c'].parentId).toBe('')
    })
  })
})
