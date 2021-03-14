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
  BElement,
  Bone,
  ElementNode,
  IdMap,
  ElementNodeAttributes,
} from '../models'
import { viewbox } from './helpers'
import { parseViewBoxFromStr } from '/@/utils/elements'
import { transformRect } from '/@/utils/geometry'

export function getPosedAttributesWithoutTransform(
  boneMap: IdMap<Bone>,
  element: BElement,
  node: ElementNode
): ElementNodeAttributes {
  const ret: ElementNodeAttributes = {}

  if (element.viewBoxBoneId) {
    const viewBoxBone = boneMap[element.viewBoxBoneId]
    if (viewBoxBone) {
      const viewBox = posedViewBox(node, viewBoxBone)
      if (viewBox) {
        ret.viewBox = viewBox
      }
    }
  }
  if (element.fillBoneId) {
    const fillBone = boneMap[element.fillBoneId]
    if (fillBone) {
      const fill = posedColor(fillBone, element.fillType)
      if (fill) {
        ret.fill = fill
      }
    }
  }
  if (element.strokeBoneId) {
    const strokeBone = boneMap[element.strokeBoneId]
    if (strokeBone) {
      const stroke = posedColor(strokeBone, element.strokeType)
      if (stroke) {
        ret.stroke = stroke
      }
    }
  }

  return ret
}

function posedViewBox(node: ElementNode, bone: Bone): string | undefined {
  const orgViewBox = parseViewBoxFromStr(node.attributs.viewBox)
  if (!orgViewBox) return
  return viewbox(
    transformRect(orgViewBox, {
      ...bone.transform,
      origin: bone.head,
    })
  )
}

function posedColor(bone: Bone, colorType = 'rgb'): string {
  if (colorType === 'rgb') {
    const r = bone.transform.translate.x
    const g = bone.transform.translate.y
    const b = bone.transform.rotate
    const a = bone.transform.scale.x
    return `rgba(${r},${g},${b},${a})`
  } else {
    const h = bone.transform.rotate
    const s = bone.transform.translate.x
    const l = bone.transform.translate.y
    const a = bone.transform.scale.x
    return `hsla(${h},${s}%,${l}%,${a})`
  }
}
