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

import { reactive, watchEffect } from 'vue'

export interface AnimationExportingSettings {
  fps: 20 | 30 | 60
  range: 'auto' | 'custom'
  customRange: { from: number; to: number }
  size: 'auto' | 'custom'
  customSize: { width: number; height: number }
}

export type ColorTheme = 'auto' | 'light' | 'dark'

function getDefaultValue() {
  return {
    selectedColor: 'orange',
    historyMax: 64,
    showBoneName: false,
    boneOpacity: 1,
    showViewbox: true,
    showAxis: true,
    graphValueWidth: 5,
    animationExportingSettings: {
      fps: 30,
      range: 'auto',
      customRange: { from: 0, to: 60 },
      size: 'auto',
      customSize: { width: 200, height: 200 },
    } as AnimationExportingSettings,
    colorTheme: 'auto' as ColorTheme,
  }
}

const SETTING_STORAGE_KEY = 'blendic-app-settings'

function restoreValue() {
  const src = getDefaultValue()

  try {
    const json = localStorage.getItem(SETTING_STORAGE_KEY)
    const restored: Partial<typeof src> = json ? JSON.parse(json) : {}

    return {
      ...src,
      ...restored,
      animationExportingSettings: {
        ...src.animationExportingSettings,
        ...(restored.animationExportingSettings ?? {}),
      },
    }
  } catch {
    return src
  }
}

const settings = reactive(restoreValue())

export function useSettings() {
  return { settings }
}

watchEffect(() => {
  const theme = settings.colorTheme
  if (theme === 'light') {
    document.documentElement.classList.add('theme-light')
  } else {
    document.documentElement.classList.remove('theme-light')
  }

  if (theme === 'dark') {
    document.documentElement.classList.add('theme-dark')
  } else {
    document.documentElement.classList.remove('theme-dark')
  }
})

watchEffect(() => {
  localStorage.setItem(SETTING_STORAGE_KEY, JSON.stringify(settings))
})
