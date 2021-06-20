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
  getBElement,
  AnimationGraph,
  getAnimationGraph,
} from '../models'
import { KeyframeBase } from '/@/models/keyframe'
import { getConstraint } from '/@/utils/constraints'
import { migrateConstraint, migrateKeyframe } from '/@/utils/migrations'

export interface StorageRoot {
  armatures: Armature[]
  actions: Action[]
  actors: Actor[]
  graphs: AnimationGraph[]
}

export function initialize(src: StorageRoot): StorageRoot {
  return {
    armatures: src.armatures.map(initializeArmature),
    actions: src.actions.map(initializeAction),
    actors: src.actors.map(initializeActor),
    graphs: src.graphs?.map(initializeGraph) ?? [],
  }
}

function initializeArmature(armature: Partial<Armature>): Armature {
  return getArmature({
    ...armature,
    bones: armature.bones?.map(initializeBone) ?? [],
  })
}

function initializeBone(bone: Bone): Bone {
  return getBone({
    ...bone,
    constraints: bone.constraints
      ? bone.constraints
          .map((c) => migrateConstraint(c))
          .map((c) => getConstraint(c))
      : [],
  })
}

function initializeAction(action: Partial<Action>): Action {
  return getAction({
    ...action,
    keyframes: action.keyframes?.map(initializeKeyframe) ?? [],
  })
}

function initializeKeyframe(keyframe: KeyframeBase): KeyframeBase {
  return migrateKeyframe(keyframe)
}

function initializeActor(actor: Partial<Actor>): Actor {
  const elements = actor.elements?.concat() ?? []
  const svg = actor.svgTree
  if (svg && elements.every((e) => e.id !== svg.id)) {
    // for compatible with old data
    elements.unshift(getBElement({ id: svg.id }))
  }

  return getActor({
    ...actor,
    elements: elements.map(initializeElement),
  })
}

function initializeElement(elm: BElement): BElement {
  return getBElement(elm)
}

function initializeGraph(graph: AnimationGraph): AnimationGraph {
  return getAnimationGraph(graph)
}
