import { useStore } from '/@/store/index'
import { getArmature, getBorn } from '/@/models'
import { nextTick } from 'vue'

describe('store/index', () => {
  const store = useStore()
  beforeEach(() => {
    store.state.armatures = []
    store.state.lastSelectedArmatureId = ''
    store.state.lastSelectedBornId = ''
    store.state.selectedArmatures = {}
    store.state.selectedBorns = {}
  })

  describe('lastSelectedArmature', () => {
    it('should clear if the armature is removed', async () => {
      store.state.armatures = [
        getArmature({ id: 'a' }),
        getArmature({ id: 'b' }),
      ]
      store.selectArmature('a')
      expect(store.lastSelectedArmature.value?.id).toBe('a')
      store.state.armatures = [getArmature({ id: 'a' })]
      expect(store.lastSelectedArmature.value?.id).toBe('a')
      store.state.armatures = []
      expect(store.lastSelectedArmature.value).toBe(undefined)
      await nextTick()
      expect(store.state.lastSelectedArmatureId).toBe('')
    })
    it('should clear if the armature is unselected', () => {
      store.state.armatures = [
        getArmature({ id: 'a' }),
        getArmature({ id: 'b' }),
      ]
      store.selectArmature('a')
      expect(store.lastSelectedArmature.value?.id).toBe('a')
      store.state.selectedArmatures = {}
      expect(store.lastSelectedArmature.value).toBe(undefined)
    })
  })

  describe('lastSelectedBorn', () => {
    it('should clear if the born is removed', async () => {
      store.state.armatures = [
        getArmature({
          id: 'arm',
          borns: [getBorn({ id: 'a' }), getBorn({ id: 'b' })],
        }),
      ]
      store.selectArmature('arm')
      store.selectBorn('a')
      expect(store.lastSelectedBorn.value?.id).toBe('a')
      store.state.armatures[0].borns = [getBorn({ id: 'a' })]
      expect(store.lastSelectedBorn.value?.id).toBe('a')
      store.state.armatures[0].borns = []
      expect(store.lastSelectedBorn.value).toBe(undefined)
      await nextTick()
      expect(store.state.lastSelectedBornId).toBe('')
    })
  })
})
