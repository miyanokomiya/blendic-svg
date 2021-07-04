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
import { nextTick } from '@vue/runtime-core'
import { shallowMount } from '@vue/test-utils'
import { useCache, useKeysCache } from '/@/composables/cache'

describe('src/composables/cache.ts', () => {
  describe('useKeysCache', () => {
    function getWrapper() {
      return shallowMount<any>({
        template: '<div>{{ cache }} {{ data }}</div>',
        setup() {
          const keyMap = ref({ a: 1, b: 2 })
          const data = ref({ x: 10, y: 20 })
          const { cache, updateCache } = useKeysCache(() => keyMap.value, data)

          return {
            cache,
            data,
            keyMap,
            setKeyMap(val: any) {
              keyMap.value = val
            },
            setData(val: any) {
              data.value = val
            },
            updateCache,
          }
        },
      })
    }

    it('should init cache', async () => {
      const wrapper = getWrapper()
      expect(wrapper.vm.cache).toEqual({ x: 10, y: 20 })
    })
    it('should not update cache if keyMap is not updated', async () => {
      const wrapper = getWrapper()
      wrapper.vm.setData({ x: 1, y: 2 })
      await nextTick()
      expect(wrapper.vm.cache).toEqual({ x: 10, y: 20 })
    })
    it('should not update cache if keys of keyMap is not updated', async () => {
      const wrapper = getWrapper()
      wrapper.vm.setData({ x: 1, y: 2 })
      wrapper.vm.setKeyMap({ a: 10, b: 20 })
      await nextTick()
      expect(wrapper.vm.cache).toEqual({ x: 10, y: 20 })
    })
    it('should update cache if keys of keyMap is updated', async () => {
      const wrapper = getWrapper()
      wrapper.vm.setData({ x: 1, y: 2 })
      wrapper.vm.setKeyMap({ a: 1, b: 2, c: 3 })
      await nextTick()
      expect(wrapper.vm.cache).toEqual({ x: 1, y: 2 })
    })
    it('should update cache if updateCache is called', async () => {
      const wrapper = getWrapper()
      wrapper.vm.setData({ x: 1, y: 2 })
      wrapper.vm.updateCache()
      expect(wrapper.vm.cache).toEqual({ x: 1, y: 2 })
    })
  })

  describe('useCache', () => {
    it('should return cached value and reset it if update func is called', () => {
      let count = 0
      const cache = useCache(() => count)
      expect(cache.getValue()).toBe(0)
      count++
      expect(cache.getValue()).toBe(0)
      cache.update()
      expect(cache.getValue()).toBe(1)
    })
  })
})
