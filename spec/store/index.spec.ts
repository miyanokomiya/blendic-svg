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
import { getArmature, getBone } from '/@/models'
import { getConstraint } from '/@/utils/constraints'

describe('src/store/index.ts', () => {
  describe('initState', () => {
    it('should create initial armature if no armature supplied', () => {
      const target = createStore(useHistoryStore())
      target.initState([], [], [], [], [])
      expect(target.armatures.value.map((a) => a.id)).toEqual([
        'initial-armature',
      ])
      expect(target.lastSelectedArmatureId.value).toBe('initial-armature')
    })

    it('should select an armature if no armature selected', () => {
      const target = createStore(useHistoryStore())
      target.initState([getArmature({ id: 'a' })], [], [], [], [])
      expect(target.lastSelectedArmatureId.value).toBe('a')
    })
  })

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

  describe('selectArmature', () => {
    it('should select an armature and clear bone selecte state', () => {
      const target = createStore(useHistoryStore())
      expect(target.armatures.value).toHaveLength(0)
      target.addArmature('arm_a', 'bo_a')
      target.addArmature('arm_b', 'bo_b')
      expect(target.lastSelectedArmatureId.value).toBe('arm_b')
      expect(target.selectedBones.value).toHaveProperty('bo_b')
      target.selectArmature('arm_a')
      expect(target.lastSelectedArmatureId.value).toBe('arm_a')
      expect(target.selectedBones.value).toEqual({})
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
    it('should delete an armature and beloging bones and constraints', () => {
      const target = createStore(useHistoryStore())
      expect(target.armatures.value).toHaveLength(0)
      target.addArmature('arm_a', 'bo_a')
      target.updateBoneConstraints([getConstraint({ id: 'ik', type: 'IK' })])
      expect(target.boneMap.value).not.toEqual({})
      expect(target.constraintMap.value).not.toEqual({})
      target.deleteArmature()
      expect(target.armatures.value).toHaveLength(0)
      expect(target.lastSelectedArmature.value).toBe(undefined)
      expect(target.boneMap.value).toEqual({})
      expect(target.selectedBones.value).toEqual({})
      expect(target.constraintMap.value).toEqual({})
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

  describe('selectBone', () => {
    describe('empty target', () => {
      it('should clear all selected', () => {
        const target = createStore(useHistoryStore())
        target.addArmature('arm_a')
        target.deleteBone()
        target.addBone('bone_a')
        target.addBone('bone_b')

        target.selectAllBones()
        expect(target.selectedBones.value).not.toEqual({})

        target.selectBone()
        expect(target.selectedBones.value).toEqual({})
      })
    })

    describe('without options', () => {
      it('should select a bone', () => {
        const target = createStore(useHistoryStore())
        target.addArmature('arm_a')
        target.deleteBone()
        target.addBone('bone_a')
        target.addBone('bone_b')

        target.selectBone('bone_a', { head: true })
        expect(target.selectedBones.value).toEqual({
          bone_a: { head: true },
        })

        target.selectBone('bone_a', { tail: true })
        expect(target.selectedBones.value).toEqual({
          bone_a: { tail: true },
        })

        target.selectBone('bone_b', { head: true, tail: true })
        expect(target.selectedBones.value).toEqual({
          bone_b: { head: true, tail: true },
        })
      })
    })

    describe('with shift option', () => {
      it('should shift-select a bone', () => {
        const target = createStore(useHistoryStore())
        target.addArmature('arm_a')
        target.deleteBone()
        target.addBone('bone_a')
        target.addBone('bone_b')

        target.selectBone('bone_a', { head: true })
        target.selectBone('bone_a', { tail: true }, { shift: true })
        expect(target.selectedBones.value).toEqual({
          bone_a: { head: true, tail: true },
        })

        target.selectBone('bone_b', { head: true, tail: true }, { shift: true })
        expect(target.selectedBones.value).toEqual({
          bone_a: { head: true, tail: true },
          bone_b: { head: true, tail: true },
        })

        target.selectBone('bone_a', { head: true }, { shift: true })
        target.selectBone('bone_a', { tail: true }, { shift: true })
        target.selectBone('bone_b', { head: true }, { shift: true })
        expect(target.selectedBones.value).toEqual({
          bone_b: { tail: true },
        })
      })
    })

    describe('connected bone', () => {
      it('should select connected parts', () => {
        const target = createStore(useHistoryStore())
        target.addArmature('arm_a')
        target.deleteBone()
        target.addBones([
          getBone({ id: 'bone_a' }),
          getBone({ id: 'bone_b', parentId: 'bone_a', connected: true }),
        ])

        target.selectBone('bone_b', { head: true })
        expect(target.selectedBones.value).toEqual({
          bone_a: { tail: true },
          bone_b: { head: true },
        })
        expect(target.lastSelectedBoneId.value).toBe('bone_b')

        target.selectBone('bone_a', { head: true, tail: true })
        expect(target.selectedBones.value).toEqual({
          bone_a: { head: true, tail: true },
          bone_b: { head: true },
        })
        expect(target.lastSelectedBoneId.value).toBe('bone_a')
      })
    })
  })

  describe('selectAllBones', () => {
    it('should toggle selected state of all bones', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      target.deleteBone()
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.selectAllBones()
      expect(target.selectedBones.value).toEqual({
        bone_a: { head: true, tail: true },
        bone_b: { head: true, tail: true },
      })
      target.selectAllBones()
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

  describe('updateBoneConstraints', () => {
    it('should replace all constraints of the bone', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      expect(target.lastSelectedBone.value?.constraints).toEqual([])
      expect(target.constraintMap.value).toEqual({})
      target.updateBoneConstraints([
        getConstraint({ id: 'ik_0', type: 'IK' }),
        getConstraint({ id: 'ik_1', type: 'IK' }),
      ])
      expect(target.lastSelectedBone.value?.constraints).toEqual([
        'ik_0',
        'ik_1',
      ])
      expect(target.constraintMap.value).toEqual({
        ik_0: getConstraint({ id: 'ik_0', type: 'IK' }),
        ik_1: getConstraint({ id: 'ik_1', type: 'IK' }),
      })

      target.updateBoneConstraints([
        getConstraint({ id: 'ik_0', type: 'IK', name: 'updated' }),
        getConstraint({ id: 'copy_0', type: 'COPY_SCALE' }),
        getConstraint({ id: 'copy_1', type: 'COPY_LOCATION' }),
      ])
      expect(target.lastSelectedBone.value?.constraints).toEqual([
        'ik_0',
        'copy_0',
        'copy_1',
      ])
      expect(target.constraintMap.value).toEqual({
        ik_0: getConstraint({ id: 'ik_0', type: 'IK', name: 'updated' }),
        copy_0: getConstraint({ id: 'copy_0', type: 'COPY_SCALE' }),
        copy_1: getConstraint({ id: 'copy_1', type: 'COPY_LOCATION' }),
      })
    })
    it('should be able to sort constraints', () => {
      const target = createStore(useHistoryStore())
      target.addArmature('arm_a')
      expect(target.lastSelectedBone.value?.constraints).toEqual([])
      expect(target.constraintMap.value).toEqual({})

      target.updateBoneConstraints([
        getConstraint({ id: 'ik_0', type: 'IK' }),
        getConstraint({ id: 'ik_1', type: 'IK' }),
      ])
      expect(target.lastSelectedBone.value?.constraints).toEqual([
        'ik_0',
        'ik_1',
      ])

      target.updateBoneConstraints([
        getConstraint({ id: 'ik_1', type: 'IK' }),
        getConstraint({ id: 'ik_0', type: 'IK' }),
      ])
      expect(target.lastSelectedBone.value?.constraints).toEqual([
        'ik_1',
        'ik_0',
      ])
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
