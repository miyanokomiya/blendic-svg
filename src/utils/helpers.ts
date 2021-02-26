import { IVec2, IRectangle, isZero } from 'okageo'
import { Transform } from '../models/index'

function getScaleText(scale: IVec2, origin: IVec2): string {
  if (scale.x === 1 && scale.y === 1) return ''

  return [
    isZero(origin) ? '' : `translate(${origin.x},${origin.y})`,
    `scale(${scale.x},${scale.y})`,
    isZero(origin) ? '' : `translate(${-origin.x},${-origin.y})`,
  ]
    .filter((s) => !!s)
    .join(' ')
}

export function getTnansformStr(transform: Transform): string {
  return [
    isZero(transform.translate)
      ? ''
      : `translate(${transform.translate.x},${transform.translate.y})`,
    getScaleText(transform.scale, transform.origin),
    transform.rotate === 0
      ? ''
      : `rotate(${transform.rotate} ${transform.origin.x} ${transform.origin.y})`,
  ]
    .filter((s) => !!s)
    .join(' ')
}

export function d(points: IVec2[], closed = false): string {
  if (points.length === 0) return ''

  const [head, ...body] = points
  return (
    `M${head.x},${head.y}` +
    body.map((p) => `L${p.x},${p.y}`).join('') +
    (closed ? 'z' : '')
  )
}

export function gridLineElm(
  scale: number,
  axis: 'x' | 'y',
  viewCanvasRect: IRectangle,
  editStartPoint: IVec2
) {
  const base = { strokeWidth: scale }
  if (axis === 'x')
    return {
      ...base,
      from: { x: viewCanvasRect.x, y: editStartPoint.y },
      to: {
        x: viewCanvasRect.x + viewCanvasRect.width,
        y: editStartPoint.y,
      },
      stroke: 'red',
    }
  else
    return {
      ...base,
      from: { x: editStartPoint.x, y: viewCanvasRect.y },
      to: {
        x: editStartPoint.x,
        y: viewCanvasRect.y + viewCanvasRect.height,
      },
      stroke: 'green',
    }
}

export function viewbox(rect: IRectangle): string {
  return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`
}

export function parseStyle(val = ''): { [name: string]: string } {
  return val
    .split(';')
    .map((e) => e.split(':'))
    .reduce<{ [name: string]: string }>((p, c) => {
      if (c.length === 2) {
        p[c[0].trim()] = c[1].trim()
      }
      return p
    }, {})
}

export function toStyle(obj: { [name: string]: string | undefined }): string {
  return Object.entries(obj)
    .filter((e) => e[1])
    .map((e) => `${e[0]}:${e[1]};`)
    .join('')
}
