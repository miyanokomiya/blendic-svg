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
import { HSVA, hsvaToRgba, rednerRGBA, rednerRGBByHSV } from '/@/utils/color'
import { parseViewBoxFromStr } from '/@/utils/elements'
import { circleClamp, clamp } from 'okageo'
import { transformRect } from '/@/utils/geometry'
import { parseStyle, toStyle } from './helpers'

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
      const fill = posedColorAttributes(fillBone.transform)
      if (fill) {
        ret.fill = fill.color
        ret['fill-opacity'] = fill.opacity
      }
    }
  }
  if (element.strokeBoneId) {
    const strokeBone = boneMap[element.strokeBoneId]
    if (strokeBone) {
      const stroke = posedColorAttributes(strokeBone.transform)
      if (stroke) {
        ret.stroke = stroke.color
        ret['stroke-opacity'] = stroke.opacity
      }
    }
  }

  return dropColorStyles(ret)
}

const COLOR_ATTRUBTES = ['fill', 'stroke', 'fill-opacity', 'stroke-opacity']

export function dropColorStyles(
  src: ElementNodeAttributes
): ElementNodeAttributes {
  if (!src.style) return src

  const parsed = parseStyle(src.style)
  COLOR_ATTRUBTES.filter((name) => parsed[name] && src[name]).forEach(
    (name) => delete parsed[name]
  )
  const style = toStyle(parsed)

  const ret = { ...src }
  if (style) {
    ret.style = style
  } else {
    delete ret.style
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

export function posedColorAttributes(transform: Transform): {
  color: string
  opacity: string
} {
  const hsva = posedHsva(transform)
  return {
    color: rednerRGBByHSV(hsva),
    opacity: hsva.a.toString(),
  }
}

export function posedColor(transform: Transform): string {
  const hsva = posedHsva(transform)
  return rednerRGBA(
    hsvaToRgba({
      ...hsva,
      h: circleClamp(0, 360, hsva.h),
    })
  )
}

export function posedHsva(transform: Transform): HSVA {
  return {
    // hue is circular and not clamped
    h: transform.rotate,
    s: clamp(0, 1, transform.translate.x / 100),
    v: clamp(0, 1, transform.translate.y / 100),
    a: clamp(0, 1, transform.scale.x),
  }
}
