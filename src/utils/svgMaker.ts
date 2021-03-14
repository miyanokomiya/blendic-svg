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

import { ElementNode } from '../models'

export function makeSvg(svgNode: ElementNode): SVGElement {
  return makeNode(svgNode) as SVGElement
}

function makeNode(svgNode: ElementNode | string): SVGElement | string {
  if (typeof svgNode === 'string') return svgNode
  return createSVGElement(
    svgNode.tag,
    svgNode.attributes,
    svgNode.children.map(makeNode)
  )
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
    if (typeof item === 'string') {
      $fragment.appendChild(new Text(item))
    } else {
      $fragment.appendChild(item)
    }
  }
  $el.appendChild($fragment)
}
