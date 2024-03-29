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
import { ref } from 'vue'
import Target from '/@/components/atoms/TreeNode.vue'
import { provideTreeContext } from '/@/composables/treeContext'

describe('src/components/atoms/TreeNode.vue', () => {
  describe('snapshot', () => {
    it('nested tree', () => {
      const wrapper = mount(Target, {
        props: {
          node: {
            id: 'a',
            name: 'name_a',
            children: [
              { id: 'aa', name: 'name_aa', children: [] },
              { id: 'bb', name: 'name_bb', children: [] },
            ],
          },
        },
      })
      expect(wrapper.element).toMatchSnapshot()
    })
    it('closed nested tree', () => {
      const closed = ref<{ [id: string]: boolean }>({})
      const wrapper = mount<any>(Target, {
        props: {
          node: {
            id: 'a',
            name: 'name_a',
            children: [
              { id: 'aa', name: 'name_aa', children: [] },
              { id: 'bb', name: 'name_bb', children: [] },
            ],
          },
        },
        global: {
          provide: {
            getClosedMap: () => closed.value,
            setClosed: (id: string, val: boolean) => (closed.value[id] = val),
          },
        },
      })
      expect(wrapper.vm.closed).toBe(false)
      wrapper.find('.toggle-closed').trigger('click')
      expect(wrapper.vm.closed).toBe(true)
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('rename', () => {
    const node = {
      id: 'a',
      name: 'name_a',
      children: [],
    }

    it('should show text field to rename if getEditable is provided', async () => {
      const wrapper = mount(Target, {
        props: { node },
        global: {
          provide: {
            getEditable: () => true,
          },
        },
      })
      await wrapper.find('.node-name').trigger('dblclick')
      expect(wrapper.find('.node-name').exists()).toBe(false)
      expect(wrapper.find('input').exists()).toBe(true)
    })
    it('should show text field to rename if getEditable is not provided', async () => {
      const wrapper = mount(Target, {
        props: { node },
      })
      await wrapper.find('.node-name').trigger('dblclick')
      expect(wrapper.find('.node-name').exists()).toBe(true)
      expect(wrapper.find('input').exists()).toBe(false)
    })
  })

  describe('expand all', () => {
    const node = {
      id: 'a',
      name: 'name_a',
      children: [
        {
          id: 'aa',
          name: 'name_aa',
          children: [
            {
              id: 'aaa',
              name: 'name_aaa',
              children: [{ id: 'aaaa', name: 'name_aaaa', children: [] }],
            },
          ],
        },
        { id: 'bb', name: 'name_bb', children: [] },
      ],
    }

    it('should expand all along newly selected node', async () => {
      const selected = ref<{ [id: string]: boolean }>({})
      const provided: { [key: string]: any } = {}
      provideTreeContext('test', {
        getSelectedMap: () => selected.value,
        provide: (key, value) => (provided[key] = value),
      })
      provided.setClosed('a', true)
      provided.setClosed('aa', true)
      provided.setClosed('aaa', true)
      provided.setClosed('aaaa', true)
      provided.setClosed('b', true)
      provided.setClosed('bb', true)

      const wrapper = mount(Target, {
        props: { node },
        global: { provide: provided },
      })
      selected.value['aaa'] = true
      await wrapper.vm.$nextTick()
      expect(provided.getClosedMap()).toEqual({
        aaa: true,
        aaaa: true,
        b: true,
        bb: true,
      })
    })
  })
})
