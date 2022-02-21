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

import { ElementNode, ElementNodeAttributes, IdMap } from '/@/models'
import { isPlainText } from '/@/utils/elements'
import { normalizeAttributes } from '/@/utils/helpers'

export function makeSvg(svgNode: ElementNode, applyId = false): SVGElement {
  return makeNode(svgNode, applyId) as SVGElement
}

function makeNode(
  svgNode: ElementNode | string,
  applyId = false
): SVGElement | string {
  if (isPlainText(svgNode)) return svgNode
  const elm = createSVGElement(
    svgNode.tag,
    normalizeAttributes(svgNode.attributes),
    svgNode.children.map((c) => makeNode(c, applyId))
  )

  if (applyId) {
    elm.id = svgNode.id
  }

  return elm
}

const SVG_URL = 'http://www.w3.org/2000/svg'

type Attributes = { [name: string]: string } | null

export function createSVGElement(
  tag: string,
  attributes: Attributes = null,
  children: (SVGElement | string)[] = []
): SVGElement {
  const $el = document.createElementNS(SVG_URL, tag)
  return createElement($el, attributes, children)
}

function createElement(
  $el: SVGElement,
  attributes: Attributes = null,
  children: (SVGElement | string)[] = []
): SVGElement {
  for (const key in attributes) {
    $el.setAttribute(key, attributes[key].toString())
  }
  if (Array.isArray(children)) {
    appendChildren($el, children)
  } else {
    $el.textContent = children
  }
  return $el
}

function appendChildren($el: SVGElement, children: (SVGElement | string)[]) {
  const $fragment = document.createDocumentFragment()
  for (let i = 0; i < children.length; i++) {
    const item = children[i]
    if (isPlainText(item)) {
      $fragment.appendChild(new Text(item))
    } else {
      $fragment.appendChild(item)
    }
  }
  $el.appendChild($fragment)
}

export function serializeToAnimatedSvg(
  svgRoot: ElementNode,
  allElementIds: string[],
  attributesMapPerFrame: IdMap<ElementNodeAttributes>[],
  duration: number
): SVGElement {
  const svg = makeSvg(svgRoot, true)
  const style = createSVGElement('style')

  style.innerHTML = allElementIds
    .map((id) => {
      return createAnimationStyle(
        id,
        attributesMapPerFrame.map((attrMap) => attrMap[id] ?? {}),
        duration
      )
    })
    .join('')

  svg.appendChild(style)
  return svg
}

function createAnimationStyle(
  id: string,
  attrsPerFrame: ElementNodeAttributes[],
  duration: number
): string {
  return (
    createAnimationKeyframes(id, attrsPerFrame) +
    createAnimationElementStyle(id, duration)
  )
}

export function createAnimationKeyframes(
  id: string,
  attrsPerFrame: ElementNodeAttributes[]
): string {
  const step = 100 / (attrsPerFrame.length - 1)
  return `@keyframes ${getAnimationName(id)} {${attrsPerFrame
    .map((a, i) => createAnimationKeyframeItem(a, step * i))
    .join(' ')}}`
}

export function createAnimationKeyframeItem(
  attrs: ElementNodeAttributes,
  percent: number
): string {
  const content = Object.entries(attrs)
    .map(([key, value]) => `${key}:${value};`)
    .join('')
  return `${percent}%{${content}}`
}

export function createAnimationElementStyle(
  id: string,
  duration: number,
  iteration: number | 'infinite' = 'infinite'
): string {
  return `#${id}{animation-name:${getAnimationName(
    id
  )};animation-duration:${duration}ms;animation-iteration-count:${iteration};}`
}

function getAnimationName(id: string): string {
  return `blendic-keyframes-${id}`
}
