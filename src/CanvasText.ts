import { ensureFontReady } from './utils/fontLoader'
import { measureTextBlock } from './utils/layout'
import { withOpacity } from './utils/colorParse'
import type { RenderTextOptions, RenderTextResult } from './types'

function alignmentOffset(textAlign: CanvasTextAlign, maxWidth: number, lineWidth: number): number {
  if (textAlign === 'center') {
    return (maxWidth - lineWidth) / 2
  }
  if (textAlign === 'right' || textAlign === 'end') {
    return maxWidth - lineWidth
  }
  return 0
}

export async function renderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: RenderTextOptions,
): Promise<RenderTextResult> {
  await ensureFontReady(options.font)

  const previous = {
    font: ctx.font,
    fillStyle: ctx.fillStyle,
    globalAlpha: ctx.globalAlpha,
    textAlign: ctx.textAlign,
    textBaseline: ctx.textBaseline,
  }

  ctx.save()
  ctx.font = options.font
  ctx.fillStyle = withOpacity(options.color ?? '#000000', options.opacity ?? 1)
  ctx.globalAlpha = options.opacity ?? 1
  ctx.textAlign = 'left'
  ctx.textBaseline = options.textBaseline ?? 'top'

  const measured = measureTextBlock(text, options.font, options.maxWidth, options.lineHeight)
  const lines = measured.lines.map((line, index) => {
    const y = options.y + index * options.lineHeight
    const x = options.x + alignmentOffset(options.textAlign ?? 'left', options.maxWidth, line.width)
    ctx.fillText(line.text, x, y)
    return {
      ...line,
      y,
    }
  })

  ctx.restore()
  ctx.font = previous.font
  ctx.fillStyle = previous.fillStyle
  ctx.globalAlpha = previous.globalAlpha
  ctx.textAlign = previous.textAlign
  ctx.textBaseline = previous.textBaseline

  return {
    width: lines.reduce((max, line) => Math.max(max, line.width), 0),
    height: measured.height,
    lineCount: lines.length,
    lines,
  }
}
