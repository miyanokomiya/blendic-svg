import { getBone, getTransform } from '/@/models'
import { resolveRelativePose, TransformCache } from '/@/utils/poseResolver'

describe('utils/poseResolver.ts', () => {
  describe('resolveRelativePose', () => {
    const boneMap = {
      a: getBone({ id: 'a', transform: getTransform({ rotate: 1 }) }),
      relative_root: getBone({
        id: 'relative_root',
        parentId: 'a',
        transform: getTransform({ rotate: 10 }),
      }),
      b: getBone({
        id: 'b',
        parentId: 'relative_root',
        transform: getTransform({ rotate: 100 }),
      }),
      target: getBone({
        id: 'target',
        parentId: 'b',
        transform: getTransform({ rotate: 1000 }),
      }),
    }

    it('resolve relative pose the target bone based at relative root', () => {
      expect(resolveRelativePose(boneMap, 'relative_root', 'target')).toEqual(
        getTransform({
          rotate: 1100,
        })
      )
    })
    it('save cache', () => {
      const cache: TransformCache = {}
      resolveRelativePose(boneMap, 'relative_root', 'target', cache)
      expect(cache).toEqual({
        relative_root: {
          target: getTransform({
            rotate: 1100,
          }),
        },
      })
    })
    it('use cache', () => {
      const cache: TransformCache = {
        relative_root: { target: getTransform({ rotate: -1100 }) },
      }
      resolveRelativePose(boneMap, 'relative_root', 'target', cache)
      expect(cache).toEqual({
        relative_root: {
          target: getTransform({
            rotate: -1100,
          }),
        },
      })
    })
  })
})
