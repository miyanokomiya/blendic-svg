import { IRectangle } from 'okageo'
import { Actor, getActor, getSvgElement, SvgElement } from '../models'

export function parseFromSvg(svgText: string): Actor {
  const domParser = new DOMParser()
  const svgDom = domParser.parseFromString(svgText, 'image/svg+xml')
  const svgTags = svgDom.getElementsByTagName('svg')
  if (!svgTags || svgTags.length === 0) throw new Error('Not found SVG tag.')
  const svg = svgTags[0] as SVGElement

  const viewBox = parseViewBox(svg)

  return getActor(
    {
      svgElements: parseElementsFromSvgRoot(svg),
      svgAttributes: Array.from(svg.attributes).map((a) => ({
        [a.name]: a.value,
      })),
      svgInnerHtml: svg.innerHTML,
      viewBox,
    },
    true
  )
}

function parseElementsFromSvgRoot(root: SVGElement): SvgElement[] {
  return getSvgChildren(root).flatMap((c) => parseElementNode(c))
}

function parseElementNode(parentElm: SVGElement, parentId = ''): SvgElement[] {
  return [
    getSvgElement({
      id: parentElm.id,
      parentId,
    }),
  ].concat(
    getSvgChildren(parentElm).flatMap((el) =>
      parseElementNode(el, parentElm.id)
    )
  )
}

function getSvgChildren(parentElm: SVGElement): SVGElement[] {
  return Array.from(parentElm.childNodes).filter(
    (el): el is SVGElement => el instanceof SVGElement
  )
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
