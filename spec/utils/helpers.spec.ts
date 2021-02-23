import { parseStyle, toStyle } from '/@/utils/helpers'

describe('utils/helpers.ts', () => {
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
