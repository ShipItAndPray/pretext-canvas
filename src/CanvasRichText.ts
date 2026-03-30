import { ensureFontReady } from './utils/fontLoader'
import { measureTextBlock } from './utils/layout'
import { withOpacity } from './utils/colorParse'
import type { RenderRichTextOptions, RenderTextResult } from './types'

export async function renderRichText(
  ctx: CanvasRenderingContext2D,
  options: RenderRichTextOptions,
): Promise<RenderTextResult> {
  const text = options.segments.map((segment) => segment.text).join('')
  const font = options.segments.find((segment) => segment.font)?.font ?? '16px sans-serif'
  await ensureFontReady(font)

  const measured = measureTextBlock(text, font, options.maxWidth, options.lineHeight)
  const lines = measured.lines

  ctx.save()
  let cursorX = options.x
  const y = options.y
  for (const segment of options.segments) {
    ctx.font = segment.font ?? font
    ctx.fillStyle = withOpacity(segment.color ?? '#000000', segment.opacity ?? 1)
    ctx.fillText(segment.text, cursorX, y)
    cursorX += measureTextBlock(segment.text, ctx.font, options.maxWidth, options.lineHeight).width
  }
  ctx.restore()

  return {
    width: measured.width,
    height: measured.height,
    lineCount: lines.length,
    lines,
  }
}
