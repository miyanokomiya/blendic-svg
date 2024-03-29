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

import {
  Bone,
  ElementNode,
  ElementNodeAttributes,
  IdMap,
  toMap,
  BElement,
} from '../models'
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
import {
  cleanActors,
  cleanGraphs,
  flatElementTree,
  inheritWeight,
  parseFromSvg,
  resolveAnimationGraph,
  toBElements,
} from '../utils/elements'
import {
  addEssentialSvgAttributes,
  bakeKeyframes,
  getGraphResolvedAttributesMap,
  getGraphResolvedElementTree,
  getPosedElementTree,
  getResolvedBoneMap,
  bakeKeyframeFromResolvedBoneMap,
} from '../utils/poseResolver'
import { AnimationExportingSettings } from '/@/composables/settings'
import { initialize, StorageRoot } from '/@/models/storage'
import { useAnimationGraphStore } from '/@/store/animationGraph'
import { mapReduce, toList } from '/@/utils/commons'
import {
  makeSvg,
  mergeSvgTreeList,
  serializeToAnimatedSvg,
} from '/@/utils/svgMaker'

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

export function useStorage() {
  const store = useStore()
  const animationStore = useAnimationStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()
  const elementStore = useElementStore()
  const graphStore = useAnimationGraphStore()

  function serialize(): string {
    const { armatures, bones, constraints, armatureSelected, boneSelected } =
      store.exportState()
    const exportedAnimation = animationStore.exportState()
    const { actions, keyframes } = cleanActions(
      exportedAnimation.actions,
      exportedAnimation.keyframes,
      armatures,
      bones
    )

    const { canvasMode } = canvasStore.exportState()

    const fromElementStore = elementStore.exportState()
    const { actors, elements } = cleanActors(
      fromElementStore.actors,
      fromElementStore.elements,
      armatures,
      bones
    )

    const fromGraphStore = graphStore.exportState()
    const graphs = cleanGraphs(fromGraphStore.graphs)
    const nodes = fromGraphStore.nodes

    const root: StorageRoot = {
      armatures,
      bones,
      constraints,
      armatureSelected,
      boneSelected,

      canvasMode,

      currentFrame: exportedAnimation.currentFrame,
      endFrame: exportedAnimation.endFrame,
      actions,
      keyframes,
      actionSelected: exportedAnimation.actionSelected,
      keyframeState: exportedAnimation.keyframeState,
      targetPropsState: exportedAnimation.targetPropsState,

      actors,
      elements,
      actorSelected: fromElementStore.actorSelected,
      elementSelected: fromElementStore.elementSelected,

      graphs,
      customGraphs: fromGraphStore.customGraphs,
      nodes,
      graphSelected: fromGraphStore.graphSelected,
      customGraphSelected: fromGraphStore.customGraphSelected,
      nodeSelected: fromGraphStore.nodeSelected,
      graphType: fromGraphStore.graphType,
    }
    return JSON.stringify(root)
  }
  function deserialize(src: string) {
    try {
      const root: StorageRoot = initialize(JSON.parse(src))
      historyStore.clear()
      store.initState(
        root.armatures,
        root.bones,
        root.constraints,
        root.armatureSelected,
        root.boneSelected
      )
      canvasStore.initState(root.canvasMode)
      animationStore.initState(
        root.currentFrame,
        root.endFrame,
        root.actions,
        root.keyframes,
        root.actionSelected,
        root.keyframeState,
        root.targetPropsState
      )
      elementStore.initState(
        root.actors,
        root.elements,
        root.actorSelected,
        root.elementSelected
      )
      graphStore.initState(
        root.graphs,
        root.customGraphs,
        root.nodes,
        root.graphSelected,
        root.customGraphSelected,
        root.nodeSelected,
        root.graphType
      )
    } catch (e) {
      console.error(e)
      alert('Failed to load: Invalid file.')
    }
  }

  async function loadProjectFile() {
    let json: string | undefined = undefined
    try {
      if (fileSystemEnable) {
        const result = await readFile()
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
    } else if (fileSystemEnable) {
      fileHandle = await writeFile(json)
    } else {
      saveJson(json, defaultProjectFileName)
    }
  }

  async function loadSvgFile(isInheritWeight = false) {
    try {
      const file = await showOpenFileDialog('.svg, image/svg+xml')
      const svg = await readAsText(file)
      const { actor, elements } = parseFromSvg(svg)

      if (isInheritWeight && elementStore.lastSelectedActor.value) {
        const inherited = inheritWeight(
          {
            actor: elementStore.lastSelectedActor.value,
            elements: toList(elementStore.elementMap.value),
          },
          { actor, elements }
        )
        elementStore.importActor(inherited.actor, inherited.elements)
      } else {
        elementStore.importActor(actor, elements)
      }
    } catch (e) {
      alert('Failed to load: Invalid file.')
    }
  }

  function bakeAction(actionIds: string[]) {
    const armature = store.lastSelectedArmature.value
    const actor = elementStore.lastSelectedActor.value
    if (!armature || !actor) return

    const svgTree = addEssentialSvgAttributes(actor.svgTree)
    const exportedAnimation = animationStore.exportState()
    const actionMap = toMap(exportedAnimation.actions)
    const keyframeMap = toMap(exportedAnimation.keyframes)

    const actions = actionIds
      .filter((id) => actionMap[id])
      .map((id) => {
        const action = actionMap[id]
        const keyframes = action.keyframes.map((id) => keyframeMap[id])
        const attributesMapPerFrame = bakeKeyframes(
          getKeyframeMapByTargetId(keyframes),
          store.boneMap.value,
          store.constraintMap.value,
          elementStore.elementMap.value,
          svgTree,
          getLastFrame(keyframes)
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
      svgTree,
    }

    saveJson(
      JSON.stringify(data),
      actions.map((a) => a.name).join('_') + '.json'
    )
  }

  function removeWeight(src: BElement): BElement {
    return {
      id: src.id,
      tag: src.tag,
      index: src.index,
      parentId: src.parentId,
    }
  }

  function getElementNodeAtFrame(
    currentFrame: number,
    endFrame: number,
    posedBones: IdMap<Bone>,
    ignoreWeight = false
  ): ElementNode {
    const actor = elementStore.lastSelectedActor.value!
    const elementMap = elementStore.elementMap.value

    const adjustedElementMap = ignoreWeight
      ? mapReduce(elementMap, removeWeight)
      : elementMap

    const svgNode = addEssentialSvgAttributes(
      getPosedElementTree(posedBones, adjustedElementMap, actor.svgTree)
    )

    const graphObjectMap = resolveAnimationGraph(
      graphStore.getGraphNodeModuleFn.value(),
      adjustedElementMap,
      posedBones,
      { currentFrame, endFrame },
      graphStore.completedNodeMap.value
    )

    return getGraphResolvedElementTree(graphObjectMap, svgNode)
  }

  function bakeSvg() {
    const actor = elementStore.lastSelectedActor.value
    if (!actor) return

    const svgElementNode = getElementNodeAtFrame(
      animationStore.currentFrame.value,
      animationStore.endFrame.value,
      animationStore.currentPosedBones.value
    )
    const action = animationStore.selectedAction.value
    const graph = graphStore.lastSelectedGraph.value
    const name = [action?.name, graph?.name].filter((n) => !!n).join('_')
    saveSvg(
      new XMLSerializer().serializeToString(makeSvg(svgElementNode)),
      `${name}.svg`
    )
  }

  function bakeAnimatedSvg(
    animSettings: AnimationExportingSettings
  ): SVGElement | undefined {
    const actor = elementStore.lastSelectedActor.value
    if (!actor) return

    const [startFrame, endFrame] =
      animSettings.range === 'auto'
        ? [0, animationStore.endFrame.value]
        : [
            animSettings.customRange.from,
            Math.max(
              animSettings.customRange.from,
              animSettings.customRange.to
            ),
          ]
    const frameCount = endFrame - startFrame + 1

    // const endFrame = animationStore.endFrame.value
    const frames = [...Array(frameCount)].map((_, i) => startFrame + i)

    const action = animationStore.selectedAction.value
    const keyframeMap = toMap(animationStore.keyframes.value)
    const keyframeMapByTargetId = getKeyframeMapByTargetId(
      action?.keyframes.map((id) => keyframeMap[id]) ?? []
    )

    const posedBonesPerFrame = new Map(
      frames.map((currentFrame) => [
        currentFrame,
        getResolvedBoneMap(
          keyframeMapByTargetId,
          store.boneMap.value,
          store.constraintMap.value,
          currentFrame
        ),
      ])
    )

    // Create whole SVG tree in advance to avoid creating elements dynamically
    // For this usage, each SVG element must not be transformed by bones
    const svgTreeList = frames.map((currentFrame) =>
      getElementNodeAtFrame(
        currentFrame,
        endFrame,
        posedBonesPerFrame.get(currentFrame)!,
        true
      )
    )
    const wholeSvgElementNode = mergeSvgTreeList(svgTreeList, true)
    if (!wholeSvgElementNode) return

    const wholeBElementMap = {
      ...toMap(toBElements(wholeSvgElementNode)),
      ...elementStore.elementMap.value,
    }

    const wholeSvgTree = addEssentialSvgAttributes(wholeSvgElementNode)

    const attributesMapPerFrameByAction = new Map(
      frames.map((currentFrame) => [
        currentFrame,
        bakeKeyframeFromResolvedBoneMap(
          posedBonesPerFrame.get(currentFrame)!,
          wholeBElementMap,
          wholeSvgTree
        ),
      ])
    )

    const originalAttributesMap = mapReduce(
      toMap(flatElementTree([wholeSvgElementNode])),
      (elm) => elm.attributes
    )

    const attributesMapPerFrameByGraph = frames.map((currentFrame) => {
      const graphObjectMap = resolveAnimationGraph(
        graphStore.getGraphNodeModuleFn.value(),
        wholeBElementMap,
        posedBonesPerFrame.get(currentFrame)!,
        { currentFrame, endFrame },
        graphStore.completedNodeMap.value
      )

      const posedAttrsMap = attributesMapPerFrameByAction.get(currentFrame)!
      return getGraphResolvedAttributesMap(
        graphObjectMap,
        mapReduce(originalAttributesMap, (attrs, id) => ({
          ...attrs,
          ...posedAttrsMap[id],
        }))
      )
    })

    const graph = graphStore.lastSelectedGraph.value
    const duration =
      animSettings.duration === 'auto'
        ? ((frameCount - 1) * 100) / 6 // Reduce round-off error, e.g. X * (1000 / 60)
        : animSettings.customDuration

    const svgElm = serializeToAnimatedSvg(
      [action?.id, graph?.id].filter((n) => !!n).join('-') ?? 'bsvg',
      wholeSvgTree,
      attributesMapPerFrameByGraph,
      duration,
      'infinite',
      animSettings.interpolation,
      animSettings.fps / 60,
      animSettings.size === 'custom' ? animSettings.customSize : undefined
    )

    if (animSettings.size === 'custom') {
      svgElm.setAttribute('width', `${animSettings.customSize.width}px`)
      svgElm.setAttribute('height', `${animSettings.customSize.height}px`)
    }

    return svgElm
  }

  function bakeAndSaveAnimatedSvg(animSettings: AnimationExportingSettings) {
    const svg = bakeAnimatedSvg(animSettings)
    if (!svg) return

    const action = animationStore.selectedAction.value
    const graph = graphStore.lastSelectedGraph.value
    const name = [action?.name, graph?.name, 'anim']
      .filter((n) => !!n)
      .join('-')
    saveSvg(new XMLSerializer().serializeToString(svg), `${name}.svg`)
  }

  return {
    fileSystemEnable,
    loadProjectFile,
    saveProjectFile,
    overrideProjectFile,
    loadSvgFile,
    bakeAction,
    bakeSvg,
    bakeAnimatedSvg,
    bakeAndSaveAnimatedSvg,
  }
}

function saveJson(json: string, filename: string) {
  saveFileInWeb(
    URL.createObjectURL(new Blob([json], { type: 'text/plain' })),
    filename
  )
}

const XML_PROLONG = '<?xml version = "1.0" standalone = "no"?>'
function saveSvg(svg: string, filename: string) {
  saveFileInWeb(
    URL.createObjectURL(
      new Blob([`${XML_PROLONG}\n${svg}`], { type: 'image/svg+xml' })
    ),
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
    },
  ]
}

const jsonOptions: FileHandleOptions = {
  types: [
    {
      description: 'JSON File',
      accept: {
        'text/plain': ['.json'],
      },
    },
  ],
}

async function getFileOpenHandle(
  options: FileHandleOptions
): Promise<FileHandle | undefined> {
  try {
    const [handle] = await (window as any).showOpenFilePicker(options)
    return handle
  } catch (e) {
    // ignore the error caused by aborting a request
    if (e instanceof Error && e.message?.includes('aborted')) return
    throw e
  }
}

async function getFileSaveHandle(
  options: FileHandleOptions
): Promise<FileHandle | undefined> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      ...options,
      suggestedName: defaultProjectFileName,
    })
    return handle
  } catch (e) {
    // ignore the error caused by aborting a request
    if (e instanceof Error && e.message?.includes('aborted')) return
    throw e
  }
}

async function readFile(): Promise<
  { handle: FileHandle; content: string } | undefined
> {
  const handle = await getFileOpenHandle(jsonOptions)
  if (!handle) return

  const file = await handle.getFile()
  const content = await file.text()
  return { handle, content }
}

async function writeFile(content: string): Promise<FileHandle | undefined> {
  const handle = await getFileSaveHandle(jsonOptions)
  if (!handle) return

  await overrideFile(handle, content)
  return handle
}

async function overrideFile(handle: FileHandle, content: string) {
  try {
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  } catch (e) {
    // ignore the error caused by not allowing
    if (e instanceof Error && e.message?.includes('not allowed')) return
    throw e
  }
}
