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

import { affineToTransform } from 'okageo'
import { Size } from 'okanvas'
import { ElementNode, ElementNodeAttributes, IdMap } from '/@/models'
import {
  mapFilter,
  mapReduce,
  thinOutList,
  thinOutSameAttributes,
} from '/@/utils/commons'
import {
  flatElementTree,
  isPlainText,
  parseViewBoxFromStr,
} from '/@/utils/elements'
import { logRound } from '/@/utils/geometry'
import { normalizeAttributes } from '/@/utils/helpers'

export function makeSvg(
  svgNode: ElementNode,
  identifierMap?: { [id: string]: string },
  overrideAttributesMap?: { [id: string]: ElementNodeAttributes }
): SVGElement {
  return makeNode(svgNode, identifierMap, overrideAttributesMap) as SVGElement
}

function makeNode(
  svgNode: ElementNode | string,
  identifierMap?: { [id: string]: string },
  overrideAttributesMap?: { [id: string]: ElementNodeAttributes }
): SVGElement | string {
  if (isPlainText(svgNode)) return svgNode
  const elm = createSVGElement(
    svgNode.tag,
    normalizeAttributes({
      ...svgNode.attributes,
      ...(overrideAttributesMap?.[svgNode.id] ?? {}),
    }),
    svgNode.children.map((c) =>
      makeNode(c, identifierMap, overrideAttributesMap)
    )
  )

  if (identifierMap?.[svgNode.id]) {
    elm.classList.add(identifierMap[svgNode.id])
  }

  return elm
}

const SVG_URL = 'http://www.w3.org/2000/svg'

type Attributes = { [name: string]: string } | null

function createSVGElement(
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

const VIEWBOX_G_ID = 'blendic-viewbox-g'
const ANIM_G_ID = 'blendic-anim-group'

/**
 * identifier: Should be valid as CSS selector
 * quolity: Should be 0-1
 */
export function serializeToAnimatedSvg(
  identifier: string,
  svgRoot: ElementNode,
  attributesMapPerFrame: IdMap<ElementNodeAttributes>[],
  duration: number,
  iteration: number | 'infinite' = 'infinite',
  interplocation: 'discrete' | 'linear' = 'discrete',
  quolity = 1,
  size?: Size
): SVGElement {
  const thinnedOutAttributesMapPerFrame = thinOutList(
    attributesMapPerFrame,
    quolity,
    true
  )

  const adjustedSvgRoot = immigrateViewBox(svgRoot, size)
  const adjustedAttributesMapPerFrame: IdMap<ElementNodeAttributes>[] =
    immigrateViewBoxPerFrame(
      adjustedSvgRoot.id,
      thinnedOutAttributesMapPerFrame,
      size
    )

  const allElements = flatElementTree([adjustedSvgRoot])
  const allElementIds = allElements.map((e) => e.id)

  const adjustedAttributesMap = allElementIds.reduce<{
    [id: string]: (ElementNodeAttributes | undefined)[]
  }>((p, id) => {
    p[id] = adjustedAttributesMapPerFrame.map((attrMap) => attrMap[id])
    return p
  }, {})

  const completedAttrs = mapReduce(adjustedAttributesMap, (attrsFrames) =>
    completeEdgeAttrs(
      thinOutSameAttributes(attrsFrames) as ElementNodeAttributes[]
    )
  )
  const staticAttributes = splitStaticAttribute(completedAttrs)
  const animatedAttributes: {
    [id: string]: (ElementNodeAttributes | undefined)[]
  } = mapReduce(completedAttrs, (attrsFrames, id) => {
    return attrsFrames
      .map((attrs) => {
        const staticAttrs = staticAttributes[id]
        if (!staticAttrs || !attrs) return attrs
        return mapFilter(attrs, (_, key) => !staticAttrs[key])
      })
      .map((attrs) =>
        !attrs || Object.keys(attrs).length === 0 ? undefined : attrs
      )
  })

  // Avoid using "id" attribute as CSS selector
  // => CSS selector requires more strict rules than HTML id attribute
  const identifierMap = allElements.reduce<{ [id: string]: string }>(
    (p, e, i) => {
      if (
        e.id === adjustedSvgRoot.id ||
        animatedAttributes[e.id]?.some((a) => !!a)
      ) {
        p[e.id] = `${identifier}-${i}`
      }
      return p
    },
    {}
  )

  const animG = createSVGElement('g')
  const animTagMap = new Map(
    allElementIds
      .map(
        (id) =>
          [
            id,
            createAnimationTagsForElement(
              id,
              animatedAttributes[id],
              duration,
              iteration,
              interplocation
            ),
          ] as [string, string]
      )
      .filter(([, s]) => !!s)
  )

  animG.classList.add(ANIM_G_ID)
  animG.innerHTML = allElementIds.map((id) => animTagMap.get(id) ?? '').join('')

  const style = createSVGElement('style')
  style.innerHTML =
    allElementIds
      .map((id) =>
        createAnimationStyle(identifierMap[id], animatedAttributes[id])
      )
      .join('') +
    `.${identifierMap[adjustedSvgRoot.id]} * {animation-duration:${
      duration / 1000
    }s;animation-iteration-count:${iteration};animation-timing-function:${getAnimationTimingValue(
      interplocation
    )};}`

  const staticAttributeOwnerIds = new Set([
    ...animTagMap.keys(),
    ...Object.keys(staticAttributes),
  ])
  const staticAttributesWithId = Array.from(staticAttributeOwnerIds).reduce<{
    [id: string]: ElementNodeAttributes
  }>((p, id) => {
    p[id] = staticAttributes[id] ?? {}
    if (animTagMap.has(id)) {
      p[id].id = id
    }
    return p
  }, {})
  const svg = makeSvg(adjustedSvgRoot, identifierMap, staticAttributesWithId)
  svg.prepend(animG)
  svg.prepend(style)
  return svg
}

/**
 * Translate `viewBox` of <svg> to `transform` of <g> in order to use CSS animation
 * => <g> element is inserted between <svg> and its children
 */
function immigrateViewBox(svgRoot: ElementNode, size?: Size): ElementNode {
  return {
    ...svgRoot,
    attributes: resetSvgViewBoxAttributes(svgRoot.attributes, size),
    children: [
      {
        id: VIEWBOX_G_ID,
        tag: 'g',
        attributes: {},
        children: svgRoot.children,
      },
    ],
  }
}

/**
 * Convert attributes to correspond to `immigrateViewBox`
 */
function immigrateViewBoxPerFrame(
  svgId: string,
  attributesMapPerFrame: IdMap<ElementNodeAttributes>[],
  size?: Size
) {
  return attributesMapPerFrame.map((attrsMap) => {
    return {
      ...attrsMap,
      [svgId]: resetSvgViewBoxAttributes(attrsMap[svgId], size),
      [VIEWBOX_G_ID]: {
        transform: createTransformFromViewbox(attrsMap[svgId]?.viewBox, size),
      } as ElementNodeAttributes,
    }
  })
}

const BASE_VIEW_SIZE = 100

function resetSvgViewBoxAttributes(
  attrs: ElementNodeAttributes,
  size: Size = { width: BASE_VIEW_SIZE, height: BASE_VIEW_SIZE }
): ElementNodeAttributes {
  const svgAttrs = { ...attrs }
  svgAttrs.viewBox = `0 0 ${size.width} ${size.height}`
  // Original aspect ratio cannot be kept by viewBox transforming
  delete svgAttrs.width
  delete svgAttrs.height
  return svgAttrs
}

function createTransformFromViewbox(
  viewBoxStr: string,
  size: Size = { width: BASE_VIEW_SIZE, height: BASE_VIEW_SIZE }
) {
  const viewBox = parseViewBoxFromStr(viewBoxStr)
  if (!viewBox) return ''

  const scaleX = size.width / viewBox.width
  const scaleY = size.height / viewBox.height

  const minScale = Math.min(scaleX, scaleY)
  const paddingX = (size.width - viewBox.width * minScale) / 2
  const paddingY = (size.height - viewBox.height * minScale) / 2

  return affineToTransform([
    minScale,
    0,
    0,
    minScale,
    paddingX - viewBox.x * minScale,
    paddingY - viewBox.y * minScale,
  ])
}

function isStaticAttribute(attrPerFrames: (string | undefined)[]): boolean {
  return (
    attrPerFrames[0] === attrPerFrames[attrPerFrames.length - 1] &&
    attrPerFrames.filter((f) => !!f).length === 2
  )
}

function toPerFrameAttrMap(
  attrsPerFrame: (ElementNodeAttributes | undefined)[]
): {
  [key: string]: (string | undefined)[]
} {
  const targetKeys = Array.from(
    new Set(attrsPerFrame.flatMap((attrs) => (attrs ? Object.keys(attrs) : [])))
  )

  return targetKeys.reduce<{
    [key: string]: (string | undefined)[]
  }>((p, key) => {
    p[key] = attrsPerFrame.map((attrs) => attrs?.[key])
    return p
  }, {})
}

function toAttrMapPerFrame(attrMap: {
  [key: string]: (string | undefined)[]
}): (ElementNodeAttributes | undefined)[] {
  const keys = Object.keys(attrMap)
  return keys.length === 0
    ? []
    : attrMap[keys[0]].map((_, i) =>
        keys.reduce<ElementNodeAttributes>((p, key) => {
          const val = attrMap[key][i]
          if (val) {
            p[key] = val
          }
          return p
        }, {})
      )
}

function splitStaticAttribute(completedAttrs: {
  [id: string]: (ElementNodeAttributes | undefined)[]
}): {
  [id: string]: ElementNodeAttributes
} {
  return Object.keys(completedAttrs).reduce<{
    [id: string]: ElementNodeAttributes
  }>((p, id) => {
    const attrPerFrameMap = toPerFrameAttrMap(completedAttrs[id])
    const attrs = Object.keys(attrPerFrameMap).reduce<ElementNodeAttributes>(
      (q, key) => {
        const frames = attrPerFrameMap[key]
        if (isStaticAttribute(frames)) {
          q[key] = frames[0] as string
        }
        return q
      },
      {}
    )
    if (Object.keys(attrs).length > 0) {
      p[id] = attrs
    }
    return p
  }, {})
}

function createAnimationStyle(
  identifier: string,
  attrsPerFrame: (ElementNodeAttributes | undefined)[]
): string {
  const attrPerFrameMap = mapFilter(
    toPerFrameAttrMap(attrsPerFrame),
    (_, key) => validAnimationCssAttr(key)
  )

  const keyframeStyle = createAnimationKeyframes(
    identifier,
    toAttrMapPerFrame(attrPerFrameMap)
  )
  return keyframeStyle
    ? keyframeStyle + createAnimationElementStyle(identifier)
    : ''
}

export function createAnimationKeyframes(
  identifier: string,
  attrsPerFrame: (ElementNodeAttributes | undefined)[]
): string {
  const frameDigit = Math.ceil(Math.log10(attrsPerFrame.length))
  const steps = getStepList(attrsPerFrame.length, 100).map((v) =>
    logRound(-frameDigit, v)
  )
  const keyframeValues = attrsPerFrame
    .map((a, i) => createAnimationKeyframeItem(a, steps[i]))
    .filter((s) => s)

  if (keyframeValues.length === 0) {
    return ''
  }

  return `@keyframes ${getAnimationName(identifier)} {${keyframeValues.join(
    ' '
  )}}`
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

export function createAnimationElementStyle(identifier: string): string {
  return `.${identifier}{animation-name:${getAnimationName(identifier)};}`
}

function getAnimationName(identifier: string): string {
  return `ba-${identifier}`
}

export function createAnimationTagsForElement(
  elementId: string,
  attrsPerFrame: (ElementNodeAttributes | undefined)[],
  duration: number,
  iteration: number | 'infinite' = 'infinite',
  interplocation: 'discrete' | 'linear' = 'discrete'
): string {
  const attrPerFrameMap = mapFilter(
    toPerFrameAttrMap(attrsPerFrame),
    (_, key) => validAnimationAttr(key)
  )

  return Object.keys(attrPerFrameMap)
    .map((key) =>
      createAnimationTag(
        elementId,
        key,
        attrPerFrameMap[key],
        duration,
        iteration,
        interplocation
      )
    )
    .join('')
}

function getStepList(length: number, scale = 1): number[] {
  if (length === 0) return []
  if (length === 1) return [0, scale]

  const step = scale / (length - 1)
  const list = [...Array(length)].map((_, i) => step * i)
  // Ensure last item to be 100%
  list[list.length - 1] = scale
  return list
}

/**
 * <animateTransform> is not supported (it does not support Affine matrix)
 * => should use CSS to animate `transform`
 */
function createAnimationTag(
  elementId: string,
  attributeName: string,
  attrPerFrame: (string | undefined)[],
  duration: number,
  iteration: number | 'infinite' = 'infinite',
  interplocation: 'discrete' | 'linear' = 'discrete'
): string {
  const steps = getStepList(attrPerFrame.length)
  const keyTimes: string[] = []
  const values: string[] = []
  attrPerFrame.forEach((attr, i) => {
    if (attr !== undefined) {
      keyTimes.push(`${steps[i]}`)
      values.push(`${attr}`)
    }
  })

  if (keyTimes.length === 0) return ''

  const animateAttrs: string[] = [
    ...(interplocation !== 'linear' ? [['calcMode', interplocation]] : []), // 'linear' can be omitted
    ['repeatCount', typeof iteration === 'string' ? 'indefinite' : iteration],
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
  svgTreeList: ElementNode[],
  showOnlyHead = false
): ElementNode | undefined {
  let currentNode: ElementNode | undefined
  svgTreeList.forEach((svg) => {
    if (currentNode) {
      currentNode = mergeTwoElement(currentNode, svg, showOnlyHead)
    } else {
      currentNode = svg
    }
  })

  return currentNode
}

export function mergeTwoElement(
  a: ElementNode,
  b: ElementNode,
  showOnlyHead = false
): ElementNode {
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
              .filter((c): c is ElementNode => !isPlainText(c))
              .map((c) => (showOnlyHead ? hideElement(c) : c))
          )
        }
        currentBIndex = bIndex
        children.push(mergeTwoElement(aItem, bItemInfo[1], showOnlyHead))
      } else {
        children.push(aItem)
      }
    }
  })

  if (currentBIndex < b.children.length) {
    children.push(
      ...b.children
        .slice(currentBIndex + 1, b.children.length)
        .filter((c): c is ElementNode => !isPlainText(c))
        .map((c) => (showOnlyHead ? hideElement(c) : c))
    )
  }

  return {
    id: a.id,
    tag: a.tag,
    attributes: a.attributes,
    children,
  }
}

function hideElement(elm: ElementNode): ElementNode {
  return {
    ...elm,
    attributes: {
      ...elm.attributes,
      fill: 'none',
      stroke: 'none',
    },
    children: elm.children.map((c) => (isPlainText(c) ? c : hideElement(c))),
  }
}

function getAnimationTimingValue(
  interplocation: 'discrete' | 'linear' = 'discrete'
): string {
  switch (interplocation) {
    case 'linear':
      return 'linear'
    default:
      return 'step-start'
  }
}

function validAnimationCssAttr(key: string): boolean {
  return VALID_ANIMATION_CSS_ATTR_KYES.has(key)
}
function validAnimationAttr(key: string): boolean {
  return VALID_ANIMATION_ATTR_KYES.has(key)
}

/**
 * Some attributes don't work in CSS animation or SMIL animation.
 * Since some browsers are not positive to support SMIL, use CSS as much as possible.
 * https://dev.w3.org/SVG/proposals/css-animation/animation-proposal.html (This is just a proposal)
 *
 * `viewBox` is translated to `transform`. See `immigrateViewBox`
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

  'gradientUnits',
  'spreadMethod',
  'stop-color',
  'stop-opacity',
])
const VALID_ANIMATION_ATTR_KYES = new Set(['d', 'offset'])
