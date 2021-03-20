import { mount } from '@vue/test-utils'
import Target from '/@/components/atoms/ResizableH.vue'

describe('src/components/atoms/ResizableH.vue', () => {
  it('snapshot', () => {
    const wrapper = mount(Target, {
      props: { initialRate: 0.3 },
      slots: {
        left: 'slot_left',
        right: 'slot_right',
      },
    })
    expect(wrapper.element).toMatchSnapshot()
  })
})
