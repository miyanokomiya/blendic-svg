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

import { createGraphNode } from '.'
import { GraphNode, GraphNodeInput } from '../../models/graphNode'
import { generateUuid } from '../random'
import { parsePathD } from '../svgParser'

export function generatePathDNodes(
  d: string,
  generateId = generateUuid
): GraphNode[] {
  const commands = parsePathD(d)
  let parentId = ''
  return commands.map((c) => {
    const id = generateId()
    const d: GraphNodeInput<string[]> = parentId
      ? { from: { id: parentId, key: 'd' } }
      : {}
    parentId = id

    switch (c.command) {
      case 'M':
      case 'm':
        return createGraphNode('make_path_m', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 'm' },
            p: { value: c.p },
          },
        })
      case 'L':
      case 'l':
        return createGraphNode('make_path_l', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 'l' },
            p: { value: c.p },
          },
        })
      case 'H':
      case 'h':
        return createGraphNode('make_path_h', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 'h' },
            x: { value: c.x },
          },
        })
      case 'V':
      case 'v':
        return createGraphNode('make_path_v', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 'v' },
            y: { value: c.y },
          },
        })
      case 'Q':
      case 'q':
        return createGraphNode('make_path_q', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 'q' },
            c1: { value: c.c1 },
            p: { value: c.p },
          },
        })
      case 'T':
      case 't':
        return createGraphNode('make_path_t', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 't' },
            p: { value: c.p },
          },
        })
      case 'C':
      case 'c':
        return createGraphNode('make_path_c', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 'c' },
            c1: { value: c.c1 },
            c2: { value: c.c2 },
            p: { value: c.p },
          },
        })
      case 'S':
      case 's':
        return createGraphNode('make_path_s', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 's' },
            c1: { value: c.c1 },
            p: { value: c.p },
          },
        })
      case 'A':
      case 'a':
        return createGraphNode('make_path_a', {
          id,
          inputs: {
            d,
            relative: { value: c.command === 'a' },
            rx: { value: c.rx },
            ry: { value: c.ry },
            rotate: { value: c.rotate },
            'large-arc': { value: c['large-arc'] },
            sweep: { value: c.sweep },
            p: { value: c.p },
          },
        })
      case 'Z':
      case 'z':
        return createGraphNode('make_path_z', {
          id,
          inputs: { d },
        })
    }
  })
}
