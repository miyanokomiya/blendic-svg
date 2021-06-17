import { getTransform } from '/@/models'
import type { GraphNodeMakeTransform } from '/@/models/graphNode'
import * as target from '/@/utils/graphNodes/nodes/makeTransform'

describe('src/utils/graphNodes/nodes/makeTransform.ts', () => {
  const node: GraphNodeMakeTransform = {
    id: 'node',
    type: 'make_transform',
    data: {},
    inputs: {
      translate: { from: { id: '', key: '' } },
      rotate: { from: { id: '', key: '' } },
      scale: { from: { id: '', key: '' } },
    },
    position: { x: 0, y: 0 },
  }

  describe('computation', () => {
    it('should return a transform', () => {
      expect(
        target.struct.computation(
          {
            translate: { x: 1, y: 2 },
            rotate: 3,
            scale: { x: 4, y: 5 },
          },
          node,
          {} as any
        )
      ).toEqual({
        value: getTransform({
          translate: { x: 1, y: 2 },
          rotate: 3,
          scale: { x: 4, y: 5 },
        }),
      })
    })
  })
})
