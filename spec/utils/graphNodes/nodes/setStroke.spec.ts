import { getTransform } from '/@/models'
import type { GraphNodeSetStroke } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/setStroke'

describe('src/utils/graphNodes/nodes/setStroke.ts', () => {
  const node: GraphNodeSetStroke = {
    id: 'node',
    type: 'set_stroke',
    data: {},
    inputs: {
      object: { value: 'a' },
      color: { value: getTransform() },
      linecap: { value: 0 },
      linejoin: { value: 0 },
    },
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should call setStroke of the context and return the object', () => {
      const setStroke = jest.fn()
      const setAttributes = jest.fn()
      expect(
        target.struct.computation(
          {
            object: 'a',
            color: getTransform({ rotate: 1 }),
            linecap: 1,
            linejoin: 2,
          },
          node,
          { setStroke, setAttributes } as any
        )
      ).toEqual({ object: 'a' })
      expect(setStroke).toHaveBeenCalledWith('a', getTransform({ rotate: 1 }))
      expect(setAttributes).toHaveBeenCalledWith('a', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'bevel',
      })
    })
  })
})
