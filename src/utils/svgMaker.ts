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
import { thinOutSameAttributes } from '/@/utils/commons'
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
  const g = createSVGElement('g')
  g.classList.add('blendic-anim-group')
  g.innerHTML = allElementIds
    .map((id) =>
      createAnimationTagsForElement(
        id,
        attributesMapPerFrame.map((attrMap) => attrMap[id]),
        duration
      )
    )
    .join('')

  const style = createSVGElement('style')
  style.innerHTML = allElementIds
    .map((id) =>
      createAnimationStyle(
        id,
        attributesMapPerFrame.map((attrMap) => attrMap[id]),
        duration
      )
    )
    .join('')

  const svg = makeSvg(svgRoot, true)
  svg.appendChild(g)
  svg.appendChild(style)
  return svg
}

function createAnimationStyle(
  id: string,
  attrsPerFrame: (ElementNodeAttributes | undefined)[],
  duration: number
): string {
  const adjustedAttrsPerFrame = completeEdgeAttrs(
    thinOutSameAttributes(attrsPerFrame) as ElementNodeAttributes[]
  )
  const keyframeStyle = createAnimationKeyframes(id, adjustedAttrsPerFrame)
  return keyframeStyle
    ? keyframeStyle + createAnimationElementStyle(id, duration)
    : ''
}

export function createAnimationKeyframes(
  id: string,
  attrsPerFrame: (ElementNodeAttributes | undefined)[]
): string {
  const step = 100 / (attrsPerFrame.length - 1)
  const keyframeValues = completeEdgeAttrs(attrsPerFrame)
    .map((a, i) => createAnimationKeyframeItem(a, step * i))
    .filter((s) => s)

  if (keyframeValues.length === 0) {
    return ''
  }

  return `@keyframes ${getAnimationName(id)} {${keyframeValues.join(' ')}}`
}

/**
 * [, { x: '1' }, { y: '2' }, ]
 * => [{ x: '1', y: '2' } ,{ x: '1' } ,{ y: '2' } ,{ x: '1', y: '2' }]
 */
export function completeEdgeAttrs(
  attrsPerFrame: (ElementNodeAttributes | undefined)[]
): (ElementNodeAttributes | undefined)[] {
  const allKeys = Array.from(
    new Set(attrsPerFrame.flatMap((attrs) => (attrs ? Object.keys(attrs) : [])))
  )

  const head: ElementNodeAttributes = pickAllValuesFromHead(
    attrsPerFrame,
    allKeys
  )
  const tail: ElementNodeAttributes = pickAllValuesFromHead(
    attrsPerFrame.concat().reverse(),
    allKeys
  )

  const clonedList = attrsPerFrame.concat()
  clonedList[0] = head
  clonedList[clonedList.length - 1] = tail
  return clonedList
}

function pickAllValuesFromHead(
  attrsPerFrame: (ElementNodeAttributes | undefined)[],
  allKeys: string[]
) {
  return allKeys.reduce<ElementNodeAttributes>((p, key) => {
    const hit = attrsPerFrame.find((attrs) => attrs?.[key] !== undefined)
    if (hit) {
      p[key] = hit[key]
    }
    return p
  }, {})
}

export function createAnimationKeyframeItem(
  attrs: ElementNodeAttributes | undefined,
  percent: number
): string {
  const filteredEntries = Object.entries(attrs ?? {}).filter(([key]) =>
    validAnimationCssAttr(key)
  )
  if (filteredEntries.length === 0) return ''

  const content = filteredEntries
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

export function createAnimationTagsForElement(
  elementId: string,
  attrsPerFrame: (ElementNodeAttributes | undefined)[],
  duration: number
): string {
  const adjustedAttrsPerFrame = completeEdgeAttrs(
    thinOutSameAttributes(attrsPerFrame) as ElementNodeAttributes[]
  )
  const allKeys = Array.from(
    new Set(
      adjustedAttrsPerFrame.flatMap((attrs) =>
        attrs ? Object.keys(attrs) : []
      )
    )
  )
  return allKeys
    .filter(validAnimationAttr)
    .map((key) =>
      createAnimationTag(
        elementId,
        key,
        adjustedAttrsPerFrame.map((attrs) => attrs?.[key]),
        duration
      )
    )
    .join('')
}

/**
 * <animateTransform> is not supported (it does not support Affine matrix)
 * => should use CSS to animate `transform`
 */
function createAnimationTag(
  elementId: string,
  attributeName: string,
  attrPerFrame: (string | undefined)[],
  duration: number
): string {
  const step = 1 / (attrPerFrame.length - 1)
  const keyTimes: string[] = []
  const values: string[] = []
  attrPerFrame.forEach((attr, i) => {
    if (attr !== undefined) {
      keyTimes.push(`${step * i}`)
      values.push(`${attr}`)
    }
  })

  if (keyTimes.length === 0) return ''

  const animateAttrs: string[] = [
    ['repeatCount', 'indefinite'],
    ['dur', `${duration / 1000}s`],
    ['href', `#${elementId}`],
    ['xlink:href', `#${elementId}`],
    ['attributeName', `${attributeName}`],
    ['keyTimes', keyTimes.join(';')],
    ['values', values.join(';')],
  ].map(([key, value]) => `${key}="${value}"`)

  return `<animate ${animateAttrs.join(' ')}/>`
}

export function mergeSvgTreeList(
  svgTreeList: ElementNode[]
): ElementNode | undefined {
  let currentNode: ElementNode | undefined
  svgTreeList.forEach((svg) => {
    if (currentNode) {
      currentNode = mergeTwoElement(currentNode, svg)
    } else {
      currentNode = svg
    }
  })

  return currentNode
}

export function mergeTwoElement(a: ElementNode, b: ElementNode): ElementNode {
  const bItemInfoMap = new Map<string, [number, ElementNode]>()
  b.children.forEach((c, i) => {
    if (!isPlainText(c)) {
      bItemInfoMap.set(c.id, [i, c])
    }
  })

  const children: (ElementNode | string)[] = []
  let currentBIndex = -1

  a.children.forEach((aItem) => {
    if (isPlainText(aItem)) {
      children.push(aItem)
    } else {
      const bItemInfo = bItemInfoMap.get(aItem.id)
      if (bItemInfo) {
        const bIndex = bItemInfo[0]
        if (bIndex - currentBIndex > 1) {
          children.push(
            ...b.children
              .slice(currentBIndex + 1, bIndex)
              .filter((c) => !isPlainText(c))
          )
        }
        currentBIndex = bIndex
        children.push(mergeTwoElement(aItem, bItemInfo[1]))
      } else {
        children.push(aItem)
      }
    }
  })

  if (currentBIndex < b.children.length) {
    children.push(
      ...b.children
        .slice(currentBIndex + 1, b.children.length)
        .filter((c) => !isPlainText(c))
    )
  }

  return {
    id: a.id,
    tag: a.tag,
    attributes: a.attributes,
    children,
  }
}

function validAnimationCssAttr(key: string): boolean {
  return VALID_ANIMATION_CSS_ATTR_KYES.has(key)
}
function validAnimationAttr(key: string): boolean {
  return VALID_ANIMATION_ATTR_KYES.has(key)
}

/**
 * It depends on each attribute whether the animation of CSS or SVG works well
 */
const VALID_ANIMATION_CSS_ATTR_KYES = new Set([
  'transform',

  'fill',
  'fill-opacity',
  'stroke',
  'stroke-opacity',
  'stroke-width',
  'stroke-dashoffset',
  'stroke-dasharray',

  'font-size',
  'text-anchor',
  'dominant-baseline',
])
const VALID_ANIMATION_ATTR_KYES = new Set([
  'viewBox',

  'd',
  'x',
  'y',
  'dx',
  'dy',
  'width',
  'height',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'fx',
  'fy',
  'x1',
  'y1',
  'x2',
  'y2',
  'offset',

  'gradientUnits',
  'spreadMethod',
  'stop-color',
  'stop-opacity',
])
