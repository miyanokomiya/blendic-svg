import { reactive } from 'vue'

const settings = reactive({
  selectedColor: 'orange',
  historyMax: 64,
  showBornName: true,
  bornOpacity: 1,
})

export function useSettings() {
  return { settings }
}
