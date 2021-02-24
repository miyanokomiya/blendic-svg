import { useStore } from '/@/store/index'
import { getArmature, getBone } from '/@/models'
import { nextTick } from 'vue'

describe('store/index', () => {
  const store = useStore()
  beforeEach(() => {
    store.state.armatures = []
    store.state.lastSelectedArmatureId = ''
    store.state.lastSelectedBoneId = ''
    store.state.selectedArmatures = {}
    store.state.selectedBones = {}
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

  describe('lastSelectedBone', () => {
    it('should clear if the bone is removed', async () => {
      store.state.armatures = [
        getArmature({
          id: 'arm',
          bones: [getBone({ id: 'a' }), getBone({ id: 'b' })],
        }),
      ]
      store.selectArmature('arm')
      store.selectBone('a')
      expect(store.lastSelectedBone.value?.id).toBe('a')
      store.state.armatures[0].bones = [getBone({ id: 'a' })]
      expect(store.lastSelectedBone.value?.id).toBe('a')
      store.state.armatures[0].bones = []
      expect(store.lastSelectedBone.value).toBe(undefined)
      await nextTick()
      expect(store.state.lastSelectedBoneId).toBe('')
    })
  })
})
