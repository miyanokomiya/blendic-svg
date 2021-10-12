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

import {
  getAction,
  getActor,
  getAnimationGraph,
  getArmature,
  getBElement,
  getBone,
  getElementNode,
} from '/@/models'
import { getKeyframeBone } from '/@/models/keyframe'
import {
  initialize,
  initializeGraph,
  initializeGraphNodes,
} from '/@/models/storage'
import { getConstraint } from '/@/utils/constraints'
import { createGraphNode } from '/@/utils/graphNodes'

describe('src/models/storage.ts', () => {
  describe('initialize', () => {
    it('init migrated properties', () => {
      const src = {
        armatures: [
          {
            id: 'arm',
            bones: ['bone', 'bone_2'],
          },
        ],
        bones: [
          { id: 'bone' },
          {
            id: 'bone_2',
            constraints: ['ik'],
          },
        ],
        constraints: [
          { id: 'ik', type: 'IK', name: 'IK.001', option: { targetId: 'a' } },
        ],
        actions: [
          {
            id: 'act',
            keyframes: ['key'],
          },
        ],
        keyframes: [{ id: 'key' }],
        actors: [
          {
            id: 'actor',
            svgTree: getElementNode({ id: 'svg' }),
            elements: ['svg'],
          },
        ],
        elements: [{ id: 'svg' }],
        graphs: [{ id: 'graph', nodes: ['node'] }],
        nodes: [{ id: 'node', type: 'scaler' }],
      }
      expect(initialize(src as any)).toEqual({
        armatures: [
          getArmature({
            id: 'arm',
            bones: ['bone', 'bone_2'],
          }),
        ],
        bones: [
          getBone({ id: 'bone' }),
          getBone({
            id: 'bone_2',
            constraints: ['ik'],
          }),
        ],
        constraints: [
          getConstraint({
            id: 'ik',
            type: 'IK',
            name: 'IK.001',
            option: { targetId: 'a' },
          }),
        ],
        actions: [getAction({ id: 'act', keyframes: ['key'] })],
        keyframes: [getKeyframeBone({ id: 'key' })],
        actors: [
          getActor({
            id: 'actor',
            svgTree: getElementNode({ id: 'svg' }),
            elements: ['svg'],
          }),
        ],
        elements: [getBElement({ id: 'svg' })],
        graphs: [getAnimationGraph({ id: 'graph', nodes: ['node'] })],
        nodes: [createGraphNode('scaler', { id: 'node' })],
      })
    })
  })

  describe('initializeGraph', () => {
    it('should drop unexisted nodes', () => {
      const valid = createGraphNode('scaler', { id: 'valid' })
      const invalid = createGraphNode('scaler', { id: 'invalid' })
      expect(
        initializeGraph(
          getAnimationGraph({
            nodes: [valid.id, invalid.id],
          }),
          { [valid.id]: valid }
        )
      ).toEqual(
        getAnimationGraph({
          nodes: [valid.id],
        })
      )
    })
  })

  describe('initializeGraphNodes', () => {
    it('should complete new inputs', () => {
      const base = createGraphNode('make_vector2')
      expect(
        initializeGraphNodes([
          {
            type: 'make_vector2',
            inputs: { x: { from: 'a', key: 'b' } },
          },
        ] as any)
      ).toEqual([
        {
          ...base,
          inputs: { ...base.inputs, x: { from: 'a', key: 'b' } },
        },
      ])
    })
    it('should complete new data', () => {
      const base = createGraphNode('scaler')
      expect(
        initializeGraphNodes([
          {
            type: 'scaler',
            data: {},
          },
        ] as any)
      ).toEqual([
        {
          ...base,
          data: { value: 0 },
        },
      ])
    })
    it('should drop invalid props of data and inputs', () => {
      const base = createGraphNode('make_vector2')
      expect(
        initializeGraphNodes([
          {
            type: 'make_vector2',
            data: { tmp: 1 },
            inputs: { x: { value: 2 }, y: { value: 3 }, z: { value: 4 } },
          },
        ] as any)
      ).toEqual([
        {
          ...base,
          data: {},
          inputs: { x: { value: 2 }, y: { value: 3 } },
        },
      ])
    })
    it('should drop invalid nodes', () => {
      expect(
        initializeGraphNodes([
          {
            type: 'invalid',
            inputs: { val: 0 },
          },
        ] as any)
      ).toEqual([])
    })
  })
})
