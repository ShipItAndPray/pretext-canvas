import { describe, expect, it, vi } from 'vitest'

import { renderRichText } from '../CanvasRichText'

function createMockContext() {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const ctx = {
    font: '',
    fillStyle: '',
    globalAlpha: 1,
    textAlign: 'left',
    textBaseline: 'top',
    save: vi.fn(() => calls.push({ method: 'save', args: [] })),
    restore: vi.fn(() => calls.push({ method: 'restore', args: [] })),
    fillText: vi.fn((...args: unknown[]) => calls.push({ method: 'fillText', args })),
  } as unknown as CanvasRenderingContext2D & { calls: typeof calls }

  ;(ctx as { calls: typeof calls }).calls = calls
  return ctx
}

vi.mock('../utils/layout', () => ({
  measureTextBlock: (text: string) => ({
    lines: [{ text, width: text.length * 8, y: 0 }],
    width: text.length * 8,
    height: 18,
    lineCount: 1,
  }),
}))

describe('renderRichText', () => {
  it('renders multiple segments with different styles', async () => {
    const ctx = createMockContext()

    const result = await renderRichText(ctx, {
      x: 10,
      y: 20,
      maxWidth: 300,
      lineHeight: 18,
      segments: [
        { text: 'Hello ', font: '16px Inter', color: '#ff0000' },
        { text: 'World', font: 'bold 16px Inter', color: '#0000ff' },
      ],
    })

    expect(result.lineCount).toBe(1)
    expect(ctx.fillText).toHaveBeenCalledTimes(2)
    expect(ctx.fillText).toHaveBeenCalledWith('Hello ', 10, 20)
  })

  it('returns correct dimensions for combined text', async () => {
    const ctx = createMockContext()

    const result = await renderRichText(ctx, {
      x: 0,
      y: 0,
      maxWidth: 500,
      lineHeight: 20,
      segments: [
        { text: 'A', color: '#000' },
        { text: 'B', color: '#111' },
      ],
    })

    expect(result.width).toBe(16) // 'AB' = 2 * 8
    expect(result.height).toBe(18)
    expect(result.lineCount).toBe(1)
  })
})
