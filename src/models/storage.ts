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
  Action,
  Actor,
  Armature,
  Bone,
  getAction,
  getArmature,
  getBone,
  getActor,
  BElement,
  AnimationGraph,
  getAnimationGraph,
  toMap,
  IdMap,
} from '/@/models'
import { GraphNodeBase } from '/@/models/graphNode'
import { KeyframeBase } from '/@/models/keyframe'
import { extractMap, mapReduce } from '/@/utils/commons'
import { BoneConstraint, getConstraint } from '/@/utils/constraints'
import { initializeBElements } from '/@/utils/elements'
import { getGraphNodeModule } from '/@/utils/graphNodes'
import { getKeyframe } from '/@/utils/keyframes'
import { migrateConstraint } from '/@/utils/migrations'

export interface StorageRoot {
  armatures: Armature[]
  bones: Bone[]
  constraints: BoneConstraint[]

  actions: Action[]
  keyframes: KeyframeBase[]

  actors: Actor[]
  elements: BElement[]

  graphs: AnimationGraph[]
  nodes: GraphNodeBase[]
}

export function initialize(src: StorageRoot): StorageRoot {
  const keyframeById = toMap(src.keyframes)
  const keyframeMapByActionId = mapReduce(toMap(src.actions), (a) =>
    a.keyframes.map((id) => keyframeById[id])
  )
  const elementById = toMap(src.elements)
  const elementMapByActorId = mapReduce(toMap(src.actors), (a) =>
    a.elements.map((id) => elementById[id])
  )

  const nodeMap = toMap(src.nodes ?? [])
  const graphs = src.graphs?.map((g) => initializeGraph(g, nodeMap)) ?? []
  const nodes = initializeGraphNodes(src.nodes ?? [])

  return {
    armatures: src.armatures.map(initializeArmature),
    bones: src.bones.map(initializeBone),
    constraints: src.constraints.map(initializeConstraint),

    actions: src.actions.map(initializeAction),
    keyframes: src.actions.flatMap((a) =>
      keyframeMapByActionId[a.id].map(initializeKeyframe)
    ),

    actors: src.actors.map(initializeActor),
    elements: src.actors.flatMap((a) =>
      initializeBElements(a.svgTree, elementMapByActorId[a.id])
    ),

    graphs,
    nodes,
  }
}

function initializeArmature(armature: Partial<Armature>): Armature {
  return getArmature(armature)
}

function initializeBone(bone: Partial<Bone>): Bone {
  return getBone(bone)
}

function initializeConstraint(c: BoneConstraint): BoneConstraint {
  return getConstraint(migrateConstraint(c))
}

function initializeAction(action: Partial<Action>): Action {
  return getAction(action)
}

function initializeKeyframe(keyframe: Partial<KeyframeBase>): KeyframeBase {
  return getKeyframe({ name: 'bone', ...keyframe })
}

function initializeActor(actor: Partial<Actor>): Actor {
  return getActor(actor)
}

export function initializeGraph(
  graph: AnimationGraph,
  nodeMap: IdMap<GraphNodeBase>
): AnimationGraph {
  const g = getAnimationGraph(graph)
  return {
    ...g,
    nodes: g.nodes.filter((id) => !!nodeMap[id]),
  }
}

function initializeGraphNode(node: GraphNodeBase): GraphNodeBase {
  const struct = getGraphNodeModule<any>(node.type).struct
  const model = struct.create()
  return {
    ...model,
    ...node,
    inputs: extractMap({ ...model.inputs, ...node.inputs }, struct.inputs),
    data: extractMap({ ...model.data, ...node.data }, struct.data),
  } as GraphNodeBase
}

export function initializeGraphNodes(nodes: GraphNodeBase[]): GraphNodeBase[] {
  return nodes.filter(isValidGraphNodeType).map(initializeGraphNode)
}

function isValidGraphNodeType(node: GraphNodeBase): boolean {
  const module = getGraphNodeModule(node.type)
  return !!module
}
