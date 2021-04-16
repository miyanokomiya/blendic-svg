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

import { ElementNode, ElementNodeAttributes, IdMap, toMap } from '../models'
import { useStore } from '../store'
import { useAnimationStore } from '../store/animation'
import { useCanvasStore } from '../store/canvas'
import { useElementStore } from '../store/element'
import { useHistoryStore } from '../store/history'
import {
  cleanActions,
  getKeyframeMapByTargetId,
  getLastFrame,
} from '../utils/animations'
import { cleanActors, inheritWeight, parseFromSvg } from '../utils/elements'
import { bakeKeyframes, getPosedElementTree } from '../utils/poseResolver'
import { initialize, StrageRoot } from '/@/models/strage'
import { makeSvg } from '/@/utils/svgMaker'

interface BakedData {
  // data format version (not same as app version)
  version: string
  appVersion: string
  actions: {
    name: string
    attributesMapPerFrame: IdMap<ElementNodeAttributes>[]
  }[]
  svgTree: ElementNode
}

const fileSystemEnable = 'showOpenFilePicker' in window
const defaultProjectFileName = 'blendic.json'
let fileHandle: FileHandle | undefined = undefined

export function useStrage() {
  const store = useStore()
  const animationStore = useAnimationStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()
  const elementStore = useElementStore()

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
    let json: string | undefined = undefined
    try {
      if (fileSystemEnable) {
        const result = await readFile(jsonOptions)
        // the user cancelled
        if (!result) return

        fileHandle = result.handle
        json = result.content
      } else {
        const file = await showOpenFileDialog()
        json = await readAsText(file)
      }
    } catch (e) {
      alert('Failed to open a file.')
    }

    if (!json) return
    try {
      deserialize(json)
    } catch (e) {
      fileHandle = undefined
      alert('Failed to load: Invalid file.')
    }
  }

  async function saveProjectFile() {
    const json = serialize()
    saveJson(json, fileHandle?.name ?? defaultProjectFileName)
  }

  async function overrideProjectFile() {
    const json = serialize()
    if (fileHandle) {
      await overrideFile(fileHandle, json)
    } else {
      saveJson(json, defaultProjectFileName)
    }
  }

  async function loadSvgFile(isInheritWeight = false) {
    try {
      const file = await showOpenFileDialog('.svg, image/svg+xml')
      const svg = await readAsText(file)
      const actor = parseFromSvg(svg)

      if (isInheritWeight && elementStore.lastSelectedActor.value) {
        elementStore.importActor(
          inheritWeight(elementStore.lastSelectedActor.value, actor)
        )
      } else {
        elementStore.importActor(actor)
      }
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  function bakeAction(actionIds: string[]) {
    const armature = store.lastSelectedArmature.value
    const actor = elementStore.lastSelectedActor.value
    if (!armature || !actor) return

    const actionMap = animationStore.actionMap.value
    const actions = actionIds
      .filter((id) => actionMap[id])
      .map((id) => {
        const action = actionMap[id]
        const attributesMapPerFrame = bakeKeyframes(
          getKeyframeMapByTargetId(action.keyframes),
          store.boneMap.value,
          toMap(actor.elements),
          actor.svgTree,
          getLastFrame(action.keyframes)
        )
        return {
          name: action.name,
          attributesMapPerFrame,
        }
      })

    const data: BakedData = {
      version: '1.0.0',
      appVersion: process.env.APP_VERSION ?? 'dev',
      actions,
      svgTree: actor.svgTree,
    }

    saveJson(
      JSON.stringify(data),
      actions.map((a) => a.name).join('_') + '.json'
    )
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
    fileSystemEnable,
    loadProjectFile,
    saveProjectFile,
    overrideProjectFile,
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

interface FileHandle {
  name: string
  size: number
  lastModified: number
  getFile(): Promise<{ text(): Promise<string> }>
  createWritable(): Promise<{
    write(content: string): Promise<void>
    close(): Promise<void>
  }>
}

interface FileHandleOptions {
  types: [
    {
      description: string
      accept: {
        [mime: string]: string[]
      }
    }
  ]
}

const jsonOptions: FileHandleOptions = {
  types: [
    {
      description: 'Text Files',
      accept: {
        'text/plain': ['.json'],
      },
    },
  ],
}

async function getFileHandle(
  options: FileHandleOptions
): Promise<FileHandle | undefined> {
  try {
    const [handle] = await (window as any).showOpenFilePicker(options)
    return handle
  } catch (e) {
    // ignore the error caused by aborting a request
    if (e.message?.includes('aborted')) return
    throw e
  }
}

async function readFile(
  options: FileHandleOptions
): Promise<{ handle: FileHandle; content: string } | undefined> {
  const handle = await getFileHandle(options)
  if (!handle) return

  const file = await handle.getFile()
  const content = await file.text()
  return { handle, content }
}

async function overrideFile(handle: FileHandle, content: string) {
  try {
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  } catch (e) {
    // ignore the error caused by not allowing
    if (e.message?.includes('not allowed')) return
    throw e
  }
}
