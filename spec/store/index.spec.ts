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

import { createStore } from '/@/store/index'
import { useHistoryStore } from '/@/composables/stores/history'
import { getBone } from '/@/models'

describe('src/store/index.ts', () => {
  describe('bonesByArmatureId', () => {
    it('should return bones by armature id', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('0_arm')
      target.deleteBone()
      target.addBone('0_0_bone')
      target.addArmature('1_arm')
      target.deleteBone()
      target.addBone('1_0_bone')
      target.addBone('1_1_bone')
      expect(target.bonesByArmatureId.value['0_arm'].map((b) => b.id)).toEqual([
        '0_0_bone',
      ])
      expect(target.bonesByArmatureId.value['1_arm'].map((b) => b.id)).toEqual([
        '1_0_bone',
        '1_1_bone',
      ])
    })
  })

  describe('addArmature', () => {
    it('should add new armature with a bone', () => {
      const target = createStore(useHistoryStore())
      expect(target.armatures.value).toHaveLength(0)
      target.addArmature('arm_a', 'bo_a')
      expect(target.armatures.value).toHaveLength(1)
      expect(target.boneMap.value).not.toEqual({})
      expect(target.lastSelectedArmatureId.value).toBe('arm_a')
      expect(target.selectedBones.value).toEqual({
        bo_a: { head: true, tail: true },
      })
    })
  })

  describe('deleteArmature', () => {
    it('should delete an armature and beloging bones', () => {
      const target = createStore(useHistoryStore())
      expect(target.armatures.value).toHaveLength(0)
      target.addArmature('arm_a', 'bo_a')
      target.deleteArmature()
      expect(target.armatures.value).toHaveLength(0)
      expect(target.lastSelectedArmature.value).toBe(undefined)
      expect(target.boneMap.value).toEqual({})
      expect(target.selectedBones.value).toEqual({})
    })
  })

  describe('getBonesByArmatureId', () => {
    it('should return bones belonging the armature', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.deleteBone()
      target.addBone('bone_a_0')
      target.addBone('bone_a_1')
      target.addArmature('arm_b')
      target.deleteBone()
      target.addBone('bone_b_0')
      target.addBone('bone_b_1')
      expect(target.getBonesByArmatureId('arm_a').map((b) => b.id)).toEqual([
        'bone_a_0',
        'bone_a_1',
      ])
      expect(target.getBonesByArmatureId('arm_b').map((b) => b.id)).toEqual([
        'bone_b_0',
        'bone_b_1',
      ])
    })
  })

  describe('selectAllBone', () => {
    it('should toggle selected state of all bones', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.deleteBone()
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
      target.deleteBone()
      expect(target.lastSelectedArmature.value!.bones).toHaveLength(0)
      expect(target.boneMap.value).toEqual({})
      target.addBone('bone_a')
      target.addBone('bone_b')
      expect(target.lastSelectedArmature.value!.bones).toEqual([
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
      target.deleteBone()
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.selectBones({
        bone_a: { head: true },
        bone_b: { head: true, tail: true },
      })
      target.deleteBone()
      expect(target.lastSelectedArmature.value!.bones).toEqual(['bone_a'])
      expect(target.boneMap.value).toEqual({ bone_a: expect.anything() })
      expect(target.selectedBones.value).toEqual({})
    })
  })

  describe('dissolveBone', () => {
    it('should dissolve bones whose all attrs have been selected and clean connections', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.deleteBone()
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
      expect(target.lastSelectedArmature.value!.bones).toEqual([
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
      target.deleteBone()
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
    it('should update bones and fix connections', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.deleteBone()
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.addBone('bone_c')
      target.updateBone({
        parentId: 'unknown',
      })
      expect(target.boneMap.value['bone_c'].parentId).toBe('')
    })
  })

  describe('updateBoneName', () => {
    it('should update name of a bone and avoid duplication', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.deleteBone()
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.selectBone('bone_a')
      target.updateBoneName('name_a')
      target.selectBone('bone_b')
      target.updateBoneName('name_a')
      expect(target.boneMap.value['bone_a'].name).toBe('name_a')
      expect(target.boneMap.value['bone_b'].name).toBe('name_a.001')
    })
  })

  describe('upsertBones', () => {
    it('should upsert bones and fix connections', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.deleteBone()
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.addBone('bone_c')
      target.upsertBones([
        getBone({
          id: 'bone_a',
          parentId: 'unknown',
          head: { x: 10, y: 20 },
        }),
        getBone({
          id: 'bone_d',
        }),
      ])
      expect(target.boneMap.value['bone_a'].parentId).toBe('')
      expect(target.boneMap.value['bone_a'].head).toEqual({ x: 10, y: 20 })
      expect(target.boneMap.value['bone_d']).toBeDefined()
    })
  })
})
