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

import { useTargetProps } from '/@/composables/targetProps'

describe('src/composables/targetProps.ts', () => {
  describe('select', () => {
    it('should return history item to do', () => {
      const targetProps = useTargetProps()
      const ret = targetProps.select('a', { id: 'a', props: { x: 'selected' } })
      expect(targetProps.selectedStateMap.value).toEqual({})
      ret.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { id: 'a', props: { x: 'selected' } },
      })
      ret.undo()
      expect(targetProps.selectedStateMap.value).toEqual({})
    })
    describe('shift select', () => {
      it('add selected state', () => {
        const targetProps = useTargetProps()
        targetProps.select('a', { id: 'a', props: { x: 'selected' } }).redo()
        const item = targetProps.select(
          'b',
          { id: 'b', props: { x: 'selected' } },
          true
        )
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
        })
        item.redo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
          b: { id: 'b', props: { x: 'selected' } },
        })
        item.undo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
        })
        item.redo()
        targetProps
          .select('b', { id: 'b', props: { y: 'selected' } }, true)
          .redo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
          b: { id: 'b', props: { x: 'selected', y: 'selected' } },
        })
      })
      it('toggle selected', () => {
        const targetProps = useTargetProps()
        targetProps.select('a', { id: 'a', props: { x: 'selected' } }).redo()
        const item = targetProps.select(
          'a',
          { id: 'a', props: { x: 'selected' } },
          true
        )
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
        })
        item.redo()
        expect(targetProps.selectedStateMap.value).toEqual({})
        item.undo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
        })
      })
      it('not toggle selected if notToggle = true', () => {
        const targetProps = useTargetProps()
        targetProps.select('a', { id: 'a', props: { x: 'selected' } }).redo()
        const item = targetProps.select(
          'a',
          { id: 'a', props: { x: 'selected' } },
          true,
          true
        )
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
        })
        item.redo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
        })
        item.undo()
        expect(targetProps.selectedStateMap.value).toEqual({
          a: { id: 'a', props: { x: 'selected' } },
        })
      })
    })
  })

  describe('selectAll', () => {
    it('should return history item to do', () => {
      const targetProps = useTargetProps()
      const item = targetProps.selectAll({
        a: { id: 'a', props: { x: true, y: false } },
        b: { id: 'b', props: { p: 0, q: 1 } },
      })
      expect(targetProps.selectedStateMap.value).toEqual({})
      item.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { id: 'a', props: { x: 'selected', y: 'selected' } },
        b: { id: 'b', props: { p: 'selected', q: 'selected' } },
      })
      item.undo()
      expect(targetProps.selectedStateMap.value).toEqual({})
    })
  })

  describe('filter', () => {
    it('should return history item to do', () => {
      const targetProps = useTargetProps()
      targetProps
        .selectAll({
          a: { id: 'a', props: { x: true, y: true } },
          b: { id: 'b', props: { p: true, q: true } },
        })
        .redo()
      const item = targetProps.filter({ b: true })
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { id: 'a', props: { x: 'selected', y: 'selected' } },
        b: { id: 'b', props: { p: 'selected', q: 'selected' } },
      })
      item.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        b: { id: 'b', props: { p: 'selected', q: 'selected' } },
      })
      item.undo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { id: 'a', props: { x: 'selected', y: 'selected' } },
        b: { id: 'b', props: { p: 'selected', q: 'selected' } },
      })
    })
  })

  describe('clear', () => {
    it('should return history item to do', () => {
      const targetProps = useTargetProps()
      targetProps
        .selectAll({
          a: { id: 'a', props: { x: true, y: true } },
          b: { id: 'b', props: { p: true, q: true } },
        })
        .redo()
      const item = targetProps.clear({ b: true })
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { id: 'a', props: { x: 'selected', y: 'selected' } },
        b: { id: 'b', props: { p: 'selected', q: 'selected' } },
      })
      item.redo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { id: 'a', props: { x: 'selected', y: 'selected' } },
      })
      item.undo()
      expect(targetProps.selectedStateMap.value).toEqual({
        a: { id: 'a', props: { x: 'selected', y: 'selected' } },
        b: { id: 'b', props: { p: 'selected', q: 'selected' } },
      })
    })
  })
})
