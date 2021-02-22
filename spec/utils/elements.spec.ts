import { getActor, getSvgElement } from '/@/models'
import { parseFromSvg } from '/@/utils/elements'

const svgText = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="1 2  3   4">
  <g id="g_1">
    <rect id="rect_1" />
  </g>
</svg>
`

describe('utils/elements.ts', () => {
  describe('parseFromSvg', () => {
    it('parse SVG to a actor', () => {
      const ret = parseFromSvg(svgText)
      expect(ret.svgAttributes).toEqual([
        { xmlns: 'http://www.w3.org/2000/svg' },
        { viewBox: '1 2  3   4' },
      ])
      expect(ret.svgInnerHtml).toContain('g_1')
      expect(ret.svgInnerHtml).not.toContain('viewBox')
      expect(ret.viewBox).toEqual({ x: 1, y: 2, width: 3, height: 4 })
      expect(ret.svgElements).toEqual([
        getSvgElement({ id: 'g_1' }),
        getSvgElement({ id: 'rect_1', parentId: 'g_1' }),
      ])
    })
  })
})
