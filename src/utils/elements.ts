import { IRectangle } from 'okageo'
import {
  Actor,
  ElementNode,
  getActor,
  getElementNode,
} from '../models'

export function parseFromSvg(svgText: string): Actor {
  const domParser = new DOMParser()
  const svgDom = domParser.parseFromString(svgText, 'image/svg+xml')
  const svgTags = svgDom.getElementsByTagName('svg')
  if (!svgTags || svgTags.length === 0) throw new Error('Not found SVG tag.')
  const svg = svgTags[0] as SVGElement

  const viewBox = parseViewBox(svg)
  const svgTree = parseElementNode(svg)

  return getActor({ svgTree, viewBox }, true)
}

function parseElementNode(parentElm: SVGElement): ElementNode {
  return getElementNode({
    id: parentElm.id,
    tag: parentElm.tagName.toLowerCase(),
    attributs: Array.from(parentElm.attributes).reduce<{
      [name: string]: string
    }>((p, c) => ({ ...p, [c.name]: c.value }), {}),
    children: parseHTMLCollection(parentElm.childNodes),
  })
}

function parseHTMLCollection(
  collection: NodeListOf<ChildNode>
): (ElementNode | string)[] {
  return Array.from(collection)
    .map((c) => {
      if (c.nodeName === '#text') {
        return c.nodeValue?.trim() || ''
      }
      return parseElementNode(c as SVGElement)
    })
    .filter((c) => !!c)
}

function parseViewBox(root: SVGElement): IRectangle | undefined {
  const viewBox = root.getAttribute('viewBox')
  if (!viewBox) return

  const list = viewBox.split(/ +/).map((s) => parseFloat(s))
  if (list.length < 4) return

  return {
    x: list[0],
    y: list[1],
    width: list[2],
    height: list[3],
  }
}
