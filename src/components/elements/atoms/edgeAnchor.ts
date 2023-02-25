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

Copyright (C) 2023, Tomoya Komiyama.
*/

import { GRAPH_VALUE_TYPE, ValueType } from '/@/models/graphNode'

export function getSurface(type: ValueType) {
  switch (type.type) {
    case GRAPH_VALUE_TYPE.SCALER:
      return 'l6,8 l-6,8'
    case GRAPH_VALUE_TYPE.VECTOR2:
      return 'l6,4 l-6,4 l6,4 l-6,4'
    case GRAPH_VALUE_TYPE.TRANSFORM:
      return 'l0,4 l6,0 l0,8 l-6,0 l0,4'
    case GRAPH_VALUE_TYPE.BOOLEAN:
      return 'l0,3 l6,0 l0,2 l-6,8 l0,3'
    case GRAPH_VALUE_TYPE.OBJECT:
      return 'l0,4 a5,5,0,1,1,0,8 l0,4'
    case GRAPH_VALUE_TYPE.D:
      return 'l0,5 l6,0 a6,8,0,0,1,-6,8 l0,3'
    case GRAPH_VALUE_TYPE.GENERICS:
      return 'a10 10 0 0 1 0,16'
    default:
      return 'l6,8 l-6,8'
  }
}
