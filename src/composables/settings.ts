import { reactive } from 'vue'

const settings = reactive({
  selectedColor: 'orange',
  historyMax: 64,
  showBoneName: true,
  boneOpacity: 1,
})

export function useSettings() {
  return { settings }
}
