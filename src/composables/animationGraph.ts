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

import { provide, inject } from 'vue'
import { GetGraphNodeModule, getGraphNodeModule } from '/@/utils/graphNodes'

const GET_GRAPH_NODE_MODULE_FN = Symbol()
const GET_OBJECT_OPTIONS_FN = Symbol()
const GET_BONE_OPTIONS_FN = Symbol()

export function provideGetGraphNodeModuleFn(
  getGraphNodeModuleFn: () => GetGraphNodeModule
) {
  provide(GET_GRAPH_NODE_MODULE_FN, getGraphNodeModuleFn)
}

export function injectGetGraphNodeModuleFn() {
  return inject<() => GetGraphNodeModule>(
    GET_GRAPH_NODE_MODULE_FN,
    () => getGraphNodeModule
  )
}

export function provideGetObjectOptions(
  getOptionsFn: () => { value: string; label: string }[]
) {
  provide(GET_OBJECT_OPTIONS_FN, getOptionsFn)
}

export function injectGetObjectOptions() {
  return inject<() => { value: string; label: string }[]>(
    GET_OBJECT_OPTIONS_FN,
    () => []
  )
}

export function provideGetBoneOptions(
  getOptionsFn: () => { value: string; label: string }[]
) {
  provide(GET_BONE_OPTIONS_FN, getOptionsFn)
}

export function injectGetBoneOptions() {
  return inject<() => { value: string; label: string }[]>(
    GET_BONE_OPTIONS_FN,
    () => []
  )
}
