import { describe, expect, it, vi } from 'vitest'

import { renderText } from '../CanvasText'
import { renderTextBox } from '../CanvasTextBox'

function createMockContext() {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const ctx = {
    font: '',
    fillStyle: '',
    globalAlpha: 1,
    textAlign: 'left',
    textBaseline: 'top',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: '',
    lineWidth: 1,
    strokeStyle: '',
    save: vi.fn(() => calls.push({ method: 'save', args: [] })),
    restore: vi.fn(() => calls.push({ method: 'restore', args: [] })),
    fillText: vi.fn((...args: unknown[]) => calls.push({ method: 'fillText', args })),
    fill: vi.fn(() => calls.push({ method: 'fill', args: [] })),
    stroke: vi.fn(() => calls.push({ method: 'stroke', args: [] })),
    beginPath: vi.fn(() => calls.push({ method: 'beginPath', args: [] })),
    moveTo: vi.fn((...args: unknown[]) => calls.push({ method: 'moveTo', args })),
    lineTo: vi.fn((...args: unknown[]) => calls.push({ method: 'lineTo', args })),
    quadraticCurveTo: vi.fn((...args: unknown[]) => calls.push({ method: 'quadraticCurveTo', args })),
    closePath: vi.fn(() => calls.push({ method: 'closePath', args: [] })),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D & { calls: typeof calls }

  ;(ctx as { calls: typeof calls }).calls = calls
  return ctx
}

vi.mock('../utils/layout', () => ({
  measureTextBlock: (text: string) => ({
    lines: text.split('\n').map((line, index) => ({
      text: line,
      width: line.length * 8,
      y: index * 18,
    })),
    width: Math.max(...text.split('\n').map((line) => line.length * 8), 0),
    height: text.split('\n').length * 18,
    lineCount: text.split('\n').length,
  }),
}))

describe('renderText', () => {
  it('renders wrapped text with center alignment offsets', async () => {
    const ctx = createMockContext()

    const result = await renderText(ctx, 'one\ntwo', {
      x: 10,
      y: 20,
      maxWidth: 100,
      font: '16px Inter',
      lineHeight: 18,
      textAlign: 'center',
      opacity: 0.8,
    })

    expect(result.lineCount).toBe(2)
    expect(result.height).toBe(36)
    // 'one' width = 3 * 8 = 24, center offset = (100 - 24) / 2 = 38, x = 10 + 38 = 48
    expect(ctx.fillText).toHaveBeenCalledWith('one', 48, 20)
    expect(ctx.fillText).toHaveBeenCalledWith('two', 48, 38)
  })

  it('renders text with right alignment', async () => {
    const ctx = createMockContext()

    const result = await renderText(ctx, 'hi', {
      x: 0,
      y: 0,
      maxWidth: 200,
      font: '16px Inter',
      lineHeight: 18,
      textAlign: 'right',
    })

    expect(result.lineCount).toBe(1)
    // 'hi' width = 2 * 8 = 16, right offset = 200 - 16 = 184
    expect(ctx.fillText).toHaveBeenCalledWith('hi', 184, 0)
  })

  it('renders text with left alignment (default)', async () => {
    const ctx = createMockContext()

    await renderText(ctx, 'hello', {
      x: 5,
      y: 10,
      maxWidth: 300,
      font: '16px Inter',
      lineHeight: 18,
    })

    // left alignment = no offset, so x stays at 5
    expect(ctx.fillText).toHaveBeenCalledWith('hello', 5, 10)
  })

  it('returns correct result shape', async () => {
    const ctx = createMockContext()

    const result = await renderText(ctx, 'line one\nline two\nline three', {
      x: 0,
      y: 0,
      maxWidth: 400,
      font: '16px Inter',
      lineHeight: 18,
    })

    expect(result.lineCount).toBe(3)
    expect(result.lines).toHaveLength(3)
    expect(result.lines[0].text).toBe('line one')
    expect(result.lines[1].text).toBe('line two')
    expect(result.lines[2].text).toBe('line three')
    expect(result.height).toBe(54) // 3 * 18
    expect(result.width).toBeGreaterThan(0)
  })

  it('restores canvas state after rendering', async () => {
    const ctx = createMockContext()
    ctx.font = 'original-font'
    ctx.fillStyle = 'original-fill'
    ctx.globalAlpha = 0.5

    await renderText(ctx, 'test', {
      x: 0,
      y: 0,
      maxWidth: 100,
      font: '16px Inter',
      lineHeight: 18,
      color: '#ff0000',
    })

    expect(ctx.font).toBe('original-font')
    expect(ctx.fillStyle).toBe('original-fill')
    expect(ctx.globalAlpha).toBe(0.5)
  })
})

describe('renderTextBox', () => {
  it('draws background before text (correct draw order)', async () => {
    const ctx = createMockContext()

    await renderTextBox(ctx, 'hello', {
      x: 12,
      y: 14,
      maxWidth: 120,
      font: '16px Inter',
      lineHeight: 20,
      padding: { top: 4, right: 6, bottom: 4, left: 6 },
      backgroundColor: '#ffffff',
      borderColor: '#111111',
      borderWidth: 2,
      borderRadius: 8,
    })

    const calls = (ctx as unknown as { calls: Array<{ method: string }> }).calls
    const fillIndex = calls.findIndex((c) => c.method === 'fill')
    const strokeIndex = calls.findIndex((c) => c.method === 'stroke')
    const firstFillTextIndex = calls.findIndex((c) => c.method === 'fillText')

    // Background fill must come before text
    expect(fillIndex).toBeLessThan(firstFillTextIndex)
    // Border stroke must come before text
    expect(strokeIndex).toBeLessThan(firstFillTextIndex)
  })

  it('returns correct box dimensions with padding', async () => {
    const ctx = createMockContext()

    const result = await renderTextBox(ctx, 'hello', {
      x: 12,
      y: 14,
      maxWidth: 120,
      font: '16px Inter',
      lineHeight: 20,
      padding: { top: 4, right: 6, bottom: 4, left: 6 },
      backgroundColor: '#ffffff',
      borderColor: '#111111',
      borderWidth: 2,
      borderRadius: 8,
    })

    expect(result.width).toBe(120)
    // height = text height (18) + padding top (4) + padding bottom (4) = 26
    expect(result.height).toBe(26)
  })

  it('applies shadow properties when shadow is specified', async () => {
    const ctx = createMockContext()

    await renderTextBox(ctx, 'shadowed', {
      x: 0,
      y: 0,
      maxWidth: 200,
      font: '16px Inter',
      lineHeight: 20,
      backgroundColor: '#ffffff',
      shadow: { offsetX: 2, offsetY: 4, blur: 8, color: 'rgba(0,0,0,0.3)' },
    })

    // Shadow properties should have been set on the context
    expect(ctx.shadowOffsetX).toBe(2)
    expect(ctx.shadowOffsetY).toBe(4)
    expect(ctx.shadowBlur).toBe(8)
    expect(ctx.shadowColor).toBe('rgba(0,0,0,0.3)')
  })

  it('renders text at padded position', async () => {
    const ctx = createMockContext()

    await renderTextBox(ctx, 'test', {
      x: 10,
      y: 20,
      maxWidth: 200,
      font: '16px Inter',
      lineHeight: 18,
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
    })

    // Text should be at x + padding.left = 22, y + padding.top = 28
    expect(ctx.fillText).toHaveBeenCalledWith('test', 22, 28)
  })

  it('skips background and border when not specified', async () => {
    const ctx = createMockContext()

    await renderTextBox(ctx, 'plain', {
      x: 0,
      y: 0,
      maxWidth: 100,
      font: '16px Inter',
      lineHeight: 18,
    })

    expect(ctx.fill).not.toHaveBeenCalled()
    expect(ctx.stroke).not.toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalled()
  })
})
