import { mount } from '@vue/test-utils'
import Target from '/@/components/atoms/ResizableV.vue'

describe('src/components/atoms/ResizableV.vue', () => {
  it('snapshot', () => {
    const wrapper = mount(Target, {
      props: { initialRate: 0.3 },
      slots: {
        top: 'slot_top',
        bottom: 'slot_bottom',
      },
    })
    expect(wrapper.element).toMatchSnapshot()
  })
})
