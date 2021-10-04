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

import { useStore } from '/@/store/__index'

describe('src/store/__index.ts', () => {
  describe('addArmature', () => {
    it('should add new armature', () => {
      const target = useStore()
      expect(target.armatures.value).toHaveLength(0)
      target.addArmature('arm_a')
      expect(target.armatures.value).toHaveLength(1)
      expect(target.lastSelectedArmatureId.value).toBe('arm_a')
    })
  })

  describe('addBone', () => {
    it('should add new bone', () => {
      const target = useStore()
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
    it('should delete bones and clean connections', () => {
      const target = useStore()
      target.addArmature('arm_a')
      target.addBone('bone_a')
      target.addBone('bone_b')
      target.deleteBone()
      expect(target.lastSelectedArmature.value!.b_ones).toEqual(['bone_a'])
      expect(target.boneMap.value).toEqual({ bone_a: expect.anything() })
      expect(target.selectedBones.value).toEqual({})
    })
  })
})
