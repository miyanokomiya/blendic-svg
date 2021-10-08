import { getAnimationGraph } from '/@/models'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import type { AnimationGraphStore } from '/@/store/animationGraph'
import { createGraphNode } from '/@/utils/graphNodes'

describe('src/store/animationGraph.ts', () => {
  let target: AnimationGraphStore

  beforeEach(() => {
    target = useAnimationGraphStore()
    target.initState(
      [
        getAnimationGraph({
          id: 'graph',
          nodes: ['scaler', 'make_vector2'],
        }),
      ],
      [
        createGraphNode('scaler', { id: 'scaler' }),
        createGraphNode('make_vector2', { id: 'make_vector2' }),
      ]
    )
    target.selectGraph('graph')
  })

  describe('selectNode', () => {
    it('should clear selection if the id is undefined', () => {
      target.selectNode('scaler')
      target.selectNode()
      expect(target.selectedNodes.value).toEqual({})
    })

    describe('with shift', () => {
      it('should toggle the selection state of the node', () => {
        target.selectNode('scaler', { shift: true })
        expect(target.selectedNodes.value).toEqual({ scaler: true })
        target.selectNode('make_vector2', { shift: true })
        expect(target.selectedNodes.value).toEqual({
          scaler: true,
          make_vector2: true,
        })
        target.selectNode('scaler', { shift: true })
        expect(target.selectedNodes.value).toEqual({ make_vector2: true })
      })
    })
  })

  describe('selectAllNode', () => {
    it('should select all nodes if some nodes have not been selected yet', () => {
      target.selectNode('scaler')
      target.selectAllNode()
      expect(target.selectedNodes.value).toEqual({
        scaler: true,
        make_vector2: true,
      })
    })
    it('should clear selection if all nodes have been selected already', () => {
      target.selectNode('scaler', { shift: true })
      target.selectNode('make_vector2', { shift: true })
      target.selectAllNode()
      expect(target.selectedNodes.value).toEqual({})
    })
  })
})
