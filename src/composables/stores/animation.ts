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

import { HistoryItem } from '/@/composables/stores/history'
import { IdMap, toMap, toTargetIdMap, Transform } from '/@/models'
import { KeyframeBone, KeyframeSelectedState } from '/@/models/keyframe'
import { mergeKeyframesWithDropped } from '/@/utils/animations'
import { dropMap, extractMap, mapReduce, toList } from '/@/utils/commons'
import { deleteKeyframeByProp } from '/@/utils/keyframes'

export function getInsertKeyframeItem(
  currentKeyframes: { get(): KeyframeBone[]; set(val: KeyframeBone[]): void },
  editTransforms: { get(): IdMap<Transform>; set(val: IdMap<Transform>): void },
  insertedKeyframes: KeyframeBone[],
  replace = false
): HistoryItem {
  const preEditTransforms = { ...editTransforms.get() }

  const { dropped } = mergeKeyframesWithDropped(
    currentKeyframes.get(),
    insertedKeyframes,
    !replace
  )

  const redo = () => {
    const { merged } = mergeKeyframesWithDropped(
      currentKeyframes.get(),
      insertedKeyframes,
      !replace
    )
    currentKeyframes.set(merged)
    editTransforms.set(
      dropMap(editTransforms.get(), toTargetIdMap(insertedKeyframes))
    )
  }
  return {
    name: 'Insert Keyframe',
    undo: () => {
      const reverted = toList({
        ...dropMap(toMap(currentKeyframes.get()), toMap(insertedKeyframes)),
        ...toMap(dropped),
      })
      currentKeyframes.set(reverted)
      editTransforms.set(preEditTransforms)
    },
    redo,
  }
}

export function getDeleteKeyframesItem(
  currentKeyframes: { get(): KeyframeBone[]; set(val: KeyframeBone[]): void },
  seletedStateMap: IdMap<KeyframeSelectedState>
): HistoryItem {
  const targetMap = extractMap(toMap(currentKeyframes.get()), seletedStateMap)

  return {
    name: 'Delete Keyframes',
    undo: () => {
      currentKeyframes.set(
        mergeKeyframesWithDropped(currentKeyframes.get(), toList(targetMap))
          .merged
      )
    },
    redo: () => {
      const deletedMap = mapReduce(targetMap, (keyframe) => {
        return deleteKeyframeByProp(keyframe, seletedStateMap[keyframe.id])
      })
      const updated = toList({
        ...toMap(currentKeyframes.get()),
        ...deletedMap,
      }).filter((k): k is KeyframeBone => !!k)

      currentKeyframes.set(updated)
    },
  }
}
