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

import { isTouchSegAndSeg, IVec2, parsePathD } from 'okageo'
import { IdMap } from '/@/models'
import { mapReduce } from '/@/utils/commons'

export function usePathCollision(pathMap: IdMap<string>) {
  const splitedPathMap: IdMap<IVec2[]> = mapReduce(pathMap, (v) =>
    parsePathD(v)
  )

  function getHitPathMap(segment: [IVec2, IVec2]): IdMap<true> {
    return Object.entries(splitedPathMap).reduce<IdMap<true>>(
      (p, [key, polyline]) => {
        const hit = polyline.some((p, i) => {
          if (i < polyline.length - 1) {
            return isTouchSegAndSeg(segment, [p, polyline[i + 1]])
          }
        })
        if (hit) {
          p[key] = true
        }
        return p
      },
      {}
    )
  }

  return {
    getHitPathMap,
  }
}
