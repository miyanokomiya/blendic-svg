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
  Keyframe,
  Bone,
  getAction,
  getArmature,
  getBone,
  getKeyframe,
  getActor,
  BElement,
  getBElement,
} from '../models'

export interface StrageRoot {
  armatures: Armature[]
  actions: Action[]
  actors: Actor[]
}

export function initialize(src: StrageRoot): StrageRoot {
  return {
    armatures: src.armatures.map(initializeArmature),
    actions: src.actions.map(initializeAction),
    actors: src.actors.map(initializeActor),
  }
}

function initializeArmature(armature: Partial<Armature>): Armature {
  return getArmature({
    ...armature,
    bones: armature.bones?.map(initializeBone) ?? [],
  })
}

function initializeBone(bone: Bone): Bone {
  return getBone(bone)
}

function initializeAction(action: Partial<Action>): Action {
  return getAction({
    ...action,
    keyframes: action.keyframes?.map(initializeKeyframe) ?? [],
  })
}

function initializeKeyframe(keyframe: Keyframe): Keyframe {
  return getKeyframe(keyframe)
}

function initializeActor(actor: Partial<Actor>): Actor {
  return getActor({
    ...actor,
    elements: actor.elements?.map(initializeElement) ?? [],
  })
}

function initializeElement(elm: BElement): BElement {
  return getBElement(elm)
}
