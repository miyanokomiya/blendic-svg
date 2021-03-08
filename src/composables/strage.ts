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

import { AffineMatrix } from 'okageo'
import { reactive } from 'vue'
import { ElementNode, IdMap, toMap } from '../models'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import { useCanvasStore } from '../store/canvas'
import { useElementStore } from '../store/element'
import { useHistoryStore } from '../store/history'
import { cleanActions } from '../utils/animations'
import { cleanActors, inheritWeight, parseFromSvg } from '../utils/elements'
import { bakeKeyframes, getPosedElementTree } from '../utils/poseResolver'
import { initialize, StrageRoot } from '/@/models/strage'
import { makeSvg } from '/@/utils/svgMaker'

interface BakedData {
  // data format version (not same as app version)
  version: string
  matrixMapPerFrame: IdMap<AffineMatrix>[]
  svgTree: ElementNode
}

export function useStrage() {
  const store = useStore()
  const animationStore = useAnimationStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()
  const elementStore = useElementStore()

  const state = reactive({
    currentFileName: 'blendic.json',
  })

  function serialize(): string {
    const armatures = store.state.armatures
    const actions = cleanActions(animationStore.actions.value, armatures)
    const actors = cleanActors(elementStore.actors.value, armatures)
    const root: StrageRoot = { armatures, actions, actors }
    return JSON.stringify(root)
  }
  function deserialize(src: string) {
    try {
      const root: StrageRoot = initialize(JSON.parse(src))
      historyStore.clearHistory()
      canvasStore.initState()
      store.initState(root.armatures)
      animationStore.initState(root.actions)
      elementStore.initState(root.actors)
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  async function loadProjectFile() {
    try {
      const file = await showOpenFileDialog()
      const json = await readAsText(file)
      deserialize(json)
      state.currentFileName = file.name
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  async function saveProjectFile() {
    const json = serialize()
    saveJson(json, state.currentFileName)
  }

  async function loadSvgFile(isInheritWeight = false) {
    try {
      const file = await showOpenFileDialog('.svg, image/svg+xml')
      const svg = await readAsText(file)
      const actor = parseFromSvg(svg)

      if (isInheritWeight) {
        const oldActor = elementStore.lastSelectedActor.value
        if (oldActor) {
          elementStore.initState([inheritWeight(oldActor, actor)])
        } else {
          elementStore.initState([actor])
        }
      } else {
        elementStore.initState([actor])
      }
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  function bakeAction() {
    const armature = store.lastSelectedArmature.value
    const action = animationStore.selectedAction.value
    const actor = elementStore.lastSelectedActor.value
    if (!armature || !action || !actor) return

    const matrixMapPerFrame = bakeKeyframes(
      animationStore.keyframeMapByBoneId.value,
      store.boneMap.value,
      toMap(actor.elements),
      actor.svgTree,
      animationStore.endFrame.value
    )

    const data: BakedData = {
      version: '0.0.1',
      matrixMapPerFrame,
      svgTree: actor.svgTree,
    }

    saveJson(JSON.stringify(data), action.name + '.json')
  }

  function bakeSvg() {
    const action = animationStore.selectedAction.value
    const actor = elementStore.lastSelectedActor.value
    if (!action || !actor) return

    const svgNode = getPosedElementTree(
      animationStore.currentPosedBones.value,
      toMap(actor.elements ?? []),
      actor.svgTree
    )

    const svg = makeSvg(svgNode)
    saveSvg(svg.outerHTML, action.name + '.svg')
  }

  return {
    loadProjectFile,
    saveProjectFile,
    loadSvgFile,
    bakeAction,
    bakeSvg,
  }
}

function saveJson(json: string, filename: string) {
  saveFileInWeb(
    URL.createObjectURL(new Blob([json], { type: 'text/plain' })),
    filename
  )
}

function saveSvg(svg: string, filename: string) {
  saveFileInWeb(
    URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })),
    filename
  )
}

function saveFileInWeb(file: string, filename: string) {
  const a = document.createElement('a')
  a.href = file
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function showOpenFileDialog(accept = '.json, application/json'): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = (event) => {
      const target = event?.target as any
      if (target?.files) {
        resolve(target.files[0])
      } else {
        reject()
      }
    }
    input.click()
  })
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
