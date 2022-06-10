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

Copyright (C) 2022, Tomoya Komiyama.
*/

import { ModeEventTarget } from '/@/composables/modeStates/core'

const emptyTarget = { id: '', type: 'empty' }

export function parseEventTarget(
  event: Pick<Event, 'target'>
): ModeEventTarget {
  if (!event.target) return emptyTarget
  const target = findClosestAnchorElement(event.target as SVGElement)
  if (!target) return emptyTarget

  const id = target.dataset['id'] ?? ''
  const type = target.dataset['type'] ?? ''
  const data = target.dataset
    ? Object.entries(target.dataset).reduce<Required<ModeEventTarget>['data']>(
        (p, [k, v]) => {
          p[k] = v ?? 'true'
          return p
        },
        {}
      )
    : undefined
  return { id, type, data }
}

function findClosestAnchorElement(elm: SVGElement): SVGElement | undefined {
  const closest = elm.closest('[data-type]')
  return closest ? (closest as SVGElement) : undefined
}
