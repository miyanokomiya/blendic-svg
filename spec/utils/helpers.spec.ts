import { getTransform } from '/@/models'
import { parseStyle, toStyle, getTnansformStr } from '/@/utils/helpers'

describe('utils/helpers.ts', () => {
  describe('transform', () => {
    it('get empty text if identity', () => {
      expect(getTnansformStr(getTransform({}))).toBe('')
    })
    it('get translate text', () => {
      expect(
        getTnansformStr(
          getTransform({
            translate: { x: 1, y: 2 },
          })
        )
      ).toBe('translate(1,2)')
    })
    it('get scale text', () => {
      expect(
        getTnansformStr(
          getTransform({
            scale: { x: 10, y: 20 },
            origin: { x: 1, y: 2 },
          })
        )
      ).toBe('translate(1,2) scale(10,20) translate(-1,-2)')
    })
    it('get rotate text', () => {
      expect(
        getTnansformStr(
          getTransform({
            rotate: 10,
            origin: { x: 1, y: 2 },
          })
        )
      ).toBe('rotate(10 1 2)')
    })
    it('get multiple transform text', () => {
      expect(
        getTnansformStr(
          getTransform({
            translate: { x: 1, y: 2 },
            scale: { x: 10, y: 20 },
            rotate: 10,
            origin: { x: 1, y: 2 },
          })
        )
      ).toBe(
        [
          getTnansformStr(
            getTransform({
              translate: { x: 1, y: 2 },
            })
          ),
          getTnansformStr(
            getTransform({
              scale: { x: 10, y: 20 },
              origin: { x: 1, y: 2 },
            })
          ),
          getTnansformStr(
            getTransform({
              rotate: 10,
              origin: { x: 1, y: 2 },
            })
          ),
        ].join(' ')
      )
    })
  })

  describe('parseStyle', () => {
    it('parse style text to the map', () => {
      expect(parseStyle('fill:red; stroke: green;')).toEqual({
        fill: 'red',
        stroke: 'green',
      })
      expect(parseStyle(' fill : red ; stroke: green ')).toEqual({
        fill: 'red',
        stroke: 'green',
      })
    })
  })

  describe('toStyle', () => {
    it('convert to the style text', () => {
      expect(
        toStyle({
          fill: 'red',
          stroke: 'green',
        })
      ).toEqual('fill:red;stroke:green;')
    })
  })
})
