import { getAnimationGraph, getCustomGraph } from '/@/models'
import { createStore } from '/@/store/animationGraph'
import type { AnimationGraphStore } from '/@/store/animationGraph'
import { createGraphNode } from '/@/utils/graphNodes'
import { useHistoryStore } from '/@/composables/stores/history'

describe('src/store/animationGraph.ts', () => {
  let target: AnimationGraphStore

  beforeEach(() => {
    const historyStore = useHistoryStore()
    target = createStore(historyStore, {
      getArmatureId: () => 'arm_id',
      getCurrentFrame: () => 0,
      getEndFrame: () => 60,
      getElementMap: () => ({}),
    })
    target.initState(
      [
        getAnimationGraph({
          id: 'graph',
          nodes: ['scaler', 'make_vector2'],
        }),
      ],
      [
        getCustomGraph({
          id: 'custom',
          nodes: ['custom_scaler'],
        }),
      ],
      [
        createGraphNode('scaler', { id: 'scaler' }),
        createGraphNode('make_vector2', { id: 'make_vector2' }),
        createGraphNode('scaler', { id: 'custom_scaler' }),
      ],
      [],
      [],
      [],
      'graph'
    )
    target.selectGraph('graph')
    target.selectCustomGraph('custom')
  })

  describe('selectGraph', () => {
    it('should select a graph', () => {
      target.selectGraph()
      expect(target.lastSelectedGraph.value?.id).toBeUndefined()
      target.selectGraph('graph')
      expect(target.lastSelectedGraph.value?.id).toBe('graph')
    })
  })

  describe('addGraph', () => {
    it('should add new graph, select it and clear nodes selected', () => {
      target.selectNode('scaler')
      const graph = {
        id: 'new_graph',
        name: 'new_name',
        nodes: [],
      }
      target.addGraph(graph)
      expect(target.graphs.value).toHaveLength(2)
      expect(target.lastSelectedGraph.value?.id).toBe('new_graph')
      expect(target.selectedNodes.value).toEqual({})
      target.addGraph({ ...graph, id: undefined })
      expect(target.graphs.value).toHaveLength(3)
      expect(target.lastSelectedGraph.value?.id).not.toBeUndefined()
      expect(target.lastSelectedGraph.value?.name).toBe('new_name.001')
    })
  })

  describe('updateGraph', () => {
    it('should update current graph', () => {
      target.updateGraph({ name: 'updated' })
      expect(target.lastSelectedGraph.value?.name).toBe('updated')
    })
  })

  describe('deleteGraph', () => {
    it('should delete current graph and clear all selected', () => {
      target.deleteGraph()
      expect(target.exportState().graphs).toHaveLength(0)
      expect(target.exportState().nodes).toHaveLength(1)
      expect(target.lastSelectedGraph.value).toBeUndefined()
      expect(target.selectedNodes.value).toEqual({})
    })
  })

  describe('selectNode', () => {
    it('should select the node', () => {
      target.selectNode('scaler')
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

  describe('selectNodes', () => {
    it('should select the nodes', () => {
      target.selectNodes({ scaler: true, make_vector2: true })
      expect(target.selectedNodes.value).toEqual({
        scaler: true,
        make_vector2: true,
      })
      target.selectNodes({ scaler: true })
      expect(target.selectedNodes.value).toEqual({
        scaler: true,
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

  describe('addNode', () => {
    it('should add new node and select it', () => {
      target.addNode('scaler', { id: 'new', data: { value: 10 } })
      expect(target.nodeMap.value['new']).toEqual(
        createGraphNode('scaler', { id: 'new', data: { value: 10 } })
      )
      expect(target.selectedNodes.value).toEqual({ new: true })
    })
    it('should add new graph if no graph is selected', () => {
      target.selectGraph()
      expect(target.lastSelectedGraph.value).toBeUndefined()
      target.addNode('scaler', { id: 'new', data: { value: 10 } })
      expect(target.lastSelectedGraph.value).not.toBeUndefined()
      expect(target.nodeMap.value['new']).toEqual(
        createGraphNode('scaler', { id: 'new', data: { value: 10 } })
      )
      expect(target.selectedNodes.value).toEqual({ new: true })
    })
  })

  describe('pasteNodes', () => {
    it('should craete new nodes, update existed nodes and select them', () => {
      target.pasteNodes([
        createGraphNode('scaler', { id: 'scaler', data: { value: 10 } }),
        createGraphNode('scaler', { id: 'new', data: { value: 100 } }),
      ])
      expect(target.nodeMap.value['scaler']).toEqual(
        createGraphNode('scaler', { id: 'scaler', data: { value: 10 } })
      )
      expect(target.nodeMap.value['new']).toEqual(
        createGraphNode('scaler', { id: 'new', data: { value: 100 } })
      )
      expect(target.selectedNodes.value).toEqual({ scaler: true, new: true })
    })
  })

  describe('deleteNodes', () => {
    it('should delete selected nodes and clear selected', () => {
      target.selectNode('scaler')
      expect(target.nodeMap.value).toHaveProperty('scaler')
      target.deleteNodes()
      expect(target.nodeMap.value).not.toHaveProperty('scaler')
      expect(target.selectedNodes.value).toEqual({})
    })
  })

  describe('updateNode', () => {
    it('should update the node', () => {
      target.updateNode('scaler', { data: { value: 10 } })
      expect(target.nodeMap.value['scaler']).toEqual(
        createGraphNode('scaler', { id: 'scaler', data: { value: 10 } })
      )
    })
  })

  describe('updateNodes', () => {
    it('should update the nodes', () => {
      target.updateNodes({ scaler: { data: { value: 10 } } })
      expect(target.nodeMap.value['scaler']).toEqual(
        createGraphNode('scaler', { id: 'scaler', data: { value: 10 } })
      )
    })
  })

  describe('setGraphType', () => {
    it('should set graph type', () => {
      target.setGraphType('custom')
      expect(target.graphType.value).toBe('custom')
      target.setGraphType('graph')
      expect(target.graphType.value).toBe('graph')
    })
  })

  describe('customGraphNodeMenuOptionsSrc', () => {
    it('should return custom items when current graph mode is graph', () => {
      target.setGraphType('graph')
      expect(target.customGraphNodeMenuOptionsSrc.value).toHaveLength(1)
      target.setGraphType('custom')
      expect(target.customGraphNodeMenuOptionsSrc.value).toHaveLength(0)
    })
  })

  describe('addCustomGraph', () => {
    it('should add new custom graph, select it and clear nodes selected', () => {
      target.selectNode('scaler')
      const graph = {
        id: 'new_graph',
        name: 'new_name',
        nodes: [],
      }
      target.setGraphType('custom')
      target.addCustomGraph(graph)
      expect(target.customGraphs.value).toHaveLength(2)
      expect(target.lastSelectedCustomGraph.value?.id).toBe('new_graph')
      expect(target.selectedNodes.value).toEqual({})
      target.addCustomGraph({ ...graph, id: undefined })
      expect(target.customGraphs.value).toHaveLength(3)
    })
  })

  describe('updateCustomGraph', () => {
    it('should update current graph', () => {
      target.setGraphType('custom')
      target.updateCustomGraph({ name: 'updated' })
      expect(target.lastSelectedCustomGraph.value?.name).toBe('updated')
    })
  })

  describe('deleteCustomGraph', () => {
    it('should delete current graph and clear all selected', () => {
      target.setGraphType('custom')
      target.deleteCustomGraph()
      expect(target.exportState().customGraphs).toHaveLength(0)
      expect(target.exportState().nodes).toHaveLength(2)
      expect(target.lastSelectedCustomGraph.value).toBeUndefined()
      expect(target.selectedNodes.value).toEqual({})
    })
  })
})
