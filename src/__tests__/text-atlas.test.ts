import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTextAtlas } from '../TextAtlas'

const fills: Array<[string, number, number]> = []

beforeEach(() => {
  fills.length = 0
  vi.stubGlobal('document', {
    createElement(tag: string) {
      if (tag !== 'canvas') {
        throw new Error(`Unexpected tag ${tag}`)
      }
      return {
        width: 0,
        height: 0,
        getContext(type: string) {
          if (type !== '2d') {
            return null
          }
          return {
            font: '',
            textBaseline: '',
            fillStyle: '',
            measureText(text: string) {
              return { width: text.length * 10 } as TextMetrics
            },
            clearRect: vi.fn(),
            fillText(text: string, x: number, y: number) {
              fills.push([text, x, y])
            },
          }
        },
      }
    },
    fonts: {
      load: vi.fn(async () => undefined),
      ready: Promise.resolve(),
    },
  })
})

it('packs unique texts into a canvas atlas', async () => {
  const atlas = await createTextAtlas(['alpha', 'beta', 'alpha'], '16px Inter', {
    maxWidth: 200,
    padding: 4,
    atlasSize: 256,
  })

  expect(atlas.canvas.width).toBeGreaterThanOrEqual(256)
  expect(atlas.entries.size).toBe(2)
  expect(atlas.getUV('alpha')).toBeDefined()
  expect(atlas.getUV('beta')).toBeDefined()
  expect(fills.some(([text]) => text === 'alpha')).toBe(true)
})
