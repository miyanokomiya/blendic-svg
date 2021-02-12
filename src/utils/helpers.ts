import { IVec2, IRectangle } from 'okageo'
import { Transform } from '../models/index'

export function transform(transform: Transform): string {
  return [
    `scale(${transform.scale.x},${transform.scale.y})`,
    `rotate(${transform.rotate})`,
    `translate(${transform.translate.x},${transform.translate.y})`,
  ].join(' ')
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
