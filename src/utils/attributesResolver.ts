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
  Transform,
} from '../models'
import { viewbox } from './helpers'
import { HSVA, hsvaToRgba, rednerRGBA } from '/@/utils/color'
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
      const fill = posedColor(fillBone.transform)
      if (fill) {
        ret.fill = fill
      }
    }
  }
  if (element.strokeBoneId) {
    const strokeBone = boneMap[element.strokeBoneId]
    if (strokeBone) {
      const stroke = posedColor(strokeBone.transform)
      if (stroke) {
        ret.stroke = stroke
      }
    }
  }

  return ret
}

function posedViewBox(node: ElementNode, bone: Bone): string | undefined {
  const orgViewBox = parseViewBoxFromStr(node.attributes.viewBox)
  if (!orgViewBox) return
  return viewbox(
    transformRect(orgViewBox, {
      ...bone.transform,
      origin: bone.head,
    })
  )
}

export function posedColor(transform: Transform): string {
  return rednerRGBA(hsvaToRgba(posedHsva(transform)))
}

export function posedHsva(transform: Transform): HSVA {
  return {
    h: transform.rotate,
    s: transform.translate.x / 100,
    v: transform.translate.y / 100,
    a: transform.scale.x,
  }
}
